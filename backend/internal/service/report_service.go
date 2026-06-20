package service

import (
	"context"
	"errors"
	"time"

	"github.com/Rioh1118/orbit/backend/internal/domain/task"
	"github.com/Rioh1118/orbit/backend/internal/repo"
	"github.com/google/uuid"
)

const (
	defaultReportWeeks = 4
	maxReportWeeks     = 26
)

// ErrInvalidTZ is returned when the tz param is not a known IANA location.
var ErrInvalidTZ = errors.New("invalid tz")

type ReportService struct {
	reports *repo.ReportRepo
}

func NewReportService(r *repo.ReportRepo) *ReportService {
	return &ReportService{reports: r}
}

type ThenVsNowInput struct {
	UserID   uuid.UUID
	Category task.Category
	Weeks    int
	TZ       string
}

// ThenVsNowResult is the gross {category × week} view (ADR 005). All slices are
// week-bucketed in TZ; the frontend derives stat tiles (% change) from them.
type ThenVsNowResult struct {
	Category        task.Category
	TZ              string
	From            time.Time
	To              time.Time
	ModeByWeek      []repo.ModeWeekBucket
	CompletedByWeek []repo.CompletedTaskWeekBucket
	FrictionByWeek  []repo.FrictionPatternWeekBucket
}

func (s *ReportService) ThenVsNow(ctx context.Context, in ThenVsNowInput) (*ThenVsNowResult, error) {
	if !in.Category.Valid() {
		return nil, task.ErrInvalidCategory
	}
	weeks := in.Weeks
	if weeks <= 0 {
		weeks = defaultReportWeeks
	}
	if weeks > maxReportWeeks {
		weeks = maxReportWeeks
	}
	tz := in.TZ
	if tz == "" {
		tz = "UTC"
	}
	if _, err := time.LoadLocation(tz); err != nil {
		return nil, ErrInvalidTZ
	}

	now := time.Now().UTC()
	from := now.AddDate(0, 0, -7*weeks)
	rng := repo.ReportRange{UserID: in.UserID, Category: in.Category, From: from, To: now, TZ: tz}

	modeByWeek, err := s.reports.ModeByWeek(ctx, rng)
	if err != nil {
		return nil, err
	}
	completed, err := s.reports.CompletedTaskTimeByWeek(ctx, rng)
	if err != nil {
		return nil, err
	}
	frictions, err := s.reports.FrictionsByWeek(ctx, rng)
	if err != nil {
		return nil, err
	}

	return &ThenVsNowResult{
		Category:        in.Category,
		TZ:              tz,
		From:            from,
		To:              now,
		ModeByWeek:      modeByWeek,
		CompletedByWeek: completed,
		FrictionByWeek:  frictions,
	}, nil
}
