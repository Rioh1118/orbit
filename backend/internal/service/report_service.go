package service

import (
	"context"
	"errors"
	"time"

	"github.com/Rioh1118/orbit/backend/internal/domain/friction"
	"github.com/Rioh1118/orbit/backend/internal/domain/task"
	"github.com/Rioh1118/orbit/backend/internal/domain/workslice"
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

// Service-layer row shapes. Defined here (not reused from repo) so the DB shape
// does not leak upward to handlers (review H4).
type ModeWeek struct {
	WeekStart    time.Time
	Mode         workslice.Mode
	TotalSeconds int64
}

type CompletedWeek struct {
	WeekStart    time.Time
	TaskCount    int64
	TotalSeconds int64
}

type FrictionWeek struct {
	WeekStart  time.Time
	PatternTag friction.PatternTag
	Count      int64
}

// ThenVsNowResult is the gross {category × week} view (ADR 005). All slices are
// week-bucketed in TZ; the frontend derives proportions and trends from them.
type ThenVsNowResult struct {
	Category        task.Category
	TZ              string
	From            time.Time
	To              time.Time
	ModeByWeek      []ModeWeek
	CompletedByWeek []CompletedWeek
	FrictionByWeek  []FrictionWeek
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

	modeRows, err := s.reports.ModeByWeek(ctx, rng)
	if err != nil {
		return nil, err
	}
	completedRows, err := s.reports.CompletedTaskTimeByWeek(ctx, rng)
	if err != nil {
		return nil, err
	}
	frictionRows, err := s.reports.FrictionsByWeek(ctx, rng)
	if err != nil {
		return nil, err
	}

	res := &ThenVsNowResult{
		Category:        in.Category,
		TZ:              tz,
		From:            from,
		To:              now,
		ModeByWeek:      make([]ModeWeek, 0, len(modeRows)),
		CompletedByWeek: make([]CompletedWeek, 0, len(completedRows)),
		FrictionByWeek:  make([]FrictionWeek, 0, len(frictionRows)),
	}
	for _, b := range modeRows {
		res.ModeByWeek = append(res.ModeByWeek, ModeWeek{WeekStart: b.WeekStart, Mode: b.Mode, TotalSeconds: b.TotalSeconds})
	}
	for _, b := range completedRows {
		res.CompletedByWeek = append(res.CompletedByWeek, CompletedWeek{WeekStart: b.WeekStart, TaskCount: b.TaskCount, TotalSeconds: b.TotalSeconds})
	}
	for _, b := range frictionRows {
		res.FrictionByWeek = append(res.FrictionByWeek, FrictionWeek{WeekStart: b.WeekStart, PatternTag: b.PatternTag, Count: b.Count})
	}
	return res, nil
}
