package repo

import (
	"context"
	"fmt"
	"time"

	"github.com/Rioh1118/orbit/backend/internal/domain/friction"
	"github.com/Rioh1118/orbit/backend/internal/domain/task"
	"github.com/Rioh1118/orbit/backend/internal/domain/workslice"
	"github.com/Rioh1118/orbit/backend/internal/repo/sqlcgen"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
)

type ReportRepo struct {
	q *sqlcgen.Queries
}

func NewReportRepo(pool *pgxpool.Pool) *ReportRepo {
	return &ReportRepo{q: sqlcgen.New(pool)}
}

// ReportRange identifies a {category × [from,to)} window bucketed by week in tz.
type ReportRange struct {
	UserID   uuid.UUID
	Category task.Category
	From     time.Time
	To       time.Time
	TZ       string
}

type ModeWeekBucket struct {
	WeekStart    time.Time
	Mode         workslice.Mode
	TotalSeconds int64
}

type CompletedTaskWeekBucket struct {
	WeekStart    time.Time
	TaskCount    int64
	TotalSeconds int64
}

type FrictionPatternWeekBucket struct {
	WeekStart  time.Time
	PatternTag friction.PatternTag
	Count      int64
}

func (r *ReportRepo) ModeByWeek(ctx context.Context, rng ReportRange) ([]ModeWeekBucket, error) {
	rows, err := r.q.SumWorkByCategoryModeWeek(ctx, sqlcgen.SumWorkByCategoryModeWeekParams{
		Tz:       rng.TZ,
		UserID:   toPgUUID(rng.UserID),
		Category: string(rng.Category),
		FromTime: toPgTime(rng.From),
		ToTime:   toPgTime(rng.To),
	})
	if err != nil {
		return nil, fmt.Errorf("sum work by category mode week: %w", err)
	}
	out := make([]ModeWeekBucket, 0, len(rows))
	for _, row := range rows {
		if row.Mode == nil {
			continue
		}
		out = append(out, ModeWeekBucket{
			WeekStart:    row.WeekStart.Time,
			Mode:         workslice.Mode(*row.Mode),
			TotalSeconds: row.TotalSeconds,
		})
	}
	return out, nil
}

func (r *ReportRepo) CompletedTaskTimeByWeek(ctx context.Context, rng ReportRange) ([]CompletedTaskWeekBucket, error) {
	rows, err := r.q.SumCompletedTaskTimeByCategoryWeek(ctx, sqlcgen.SumCompletedTaskTimeByCategoryWeekParams{
		Tz:       rng.TZ,
		UserID:   toPgUUID(rng.UserID),
		Category: string(rng.Category),
		FromTime: toPgTime(rng.From),
		ToTime:   toPgTime(rng.To),
	})
	if err != nil {
		return nil, fmt.Errorf("sum completed task time by week: %w", err)
	}
	out := make([]CompletedTaskWeekBucket, 0, len(rows))
	for _, row := range rows {
		out = append(out, CompletedTaskWeekBucket{
			WeekStart:    row.WeekStart.Time,
			TaskCount:    row.TaskCount,
			TotalSeconds: row.TotalSeconds,
		})
	}
	return out, nil
}

func (r *ReportRepo) FrictionsByWeek(ctx context.Context, rng ReportRange) ([]FrictionPatternWeekBucket, error) {
	rows, err := r.q.CountFrictionsByCategoryPatternWeek(ctx, sqlcgen.CountFrictionsByCategoryPatternWeekParams{
		Tz:       rng.TZ,
		UserID:   toPgUUID(rng.UserID),
		Category: string(rng.Category),
		FromTime: toPgTime(rng.From),
		ToTime:   toPgTime(rng.To),
	})
	if err != nil {
		return nil, fmt.Errorf("count frictions by category pattern week: %w", err)
	}
	out := make([]FrictionPatternWeekBucket, 0, len(rows))
	for _, row := range rows {
		out = append(out, FrictionPatternWeekBucket{
			WeekStart:  row.WeekStart.Time,
			PatternTag: friction.PatternTag(row.PatternTag),
			Count:      row.Cnt,
		})
	}
	return out, nil
}
