package repo

import (
	"context"
	"errors"
	"fmt"
	"time"

	"github.com/Rioh1118/orbit/backend/internal/domain/worksession"
	"github.com/Rioh1118/orbit/backend/internal/repo/sqlcgen"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

var ErrWorkSessionNotFound = errors.New("work session not found")

type WorkSessionRepo struct {
	q *sqlcgen.Queries
}

func NewWorkSessionRepo(pool *pgxpool.Pool) *WorkSessionRepo {
	return &WorkSessionRepo{q: sqlcgen.New(pool)}
}

type ListWorkSessionsParams struct {
	UserID uuid.UUID
	TaskID *uuid.UUID
	Mode   *worksession.Mode
	From   *time.Time
	To     *time.Time
	Limit  int32
	Offset int32
}

func (r *WorkSessionRepo) List(ctx context.Context, p ListWorkSessionsParams) ([]*worksession.WorkSession, int64, error) {
	var modeStr *string
	if p.Mode != nil {
		s := string(*p.Mode)
		modeStr = &s
	}
	rows, err := r.q.ListWorkSlices(ctx, sqlcgen.ListWorkSlicesParams{
		UserID:   toPgUUID(p.UserID),
		TaskID:   toPgUUIDPtr(p.TaskID),
		Mode:     modeStr,
		FromTime: toPgTimePtr(p.From),
		ToTime:   toPgTimePtr(p.To),
		Limit:    p.Limit,
		Offset:   p.Offset,
	})
	if err != nil {
		return nil, 0, fmt.Errorf("list work sessions: %w", err)
	}
	total, err := r.q.CountWorkSlices(ctx, sqlcgen.CountWorkSlicesParams{
		UserID:   toPgUUID(p.UserID),
		TaskID:   toPgUUIDPtr(p.TaskID),
		Mode:     modeStr,
		FromTime: toPgTimePtr(p.From),
		ToTime:   toPgTimePtr(p.To),
	})
	if err != nil {
		return nil, 0, fmt.Errorf("count work sessions: %w", err)
	}
	return rowsToWorkSessions(rows), total, nil
}

func (r *WorkSessionRepo) ListActive(ctx context.Context, userID uuid.UUID) ([]*worksession.WorkSession, error) {
	rows, err := r.q.ListActiveWorkSlices(ctx, toPgUUID(userID))
	if err != nil {
		return nil, fmt.Errorf("list active work sessions: %w", err)
	}
	return rowsToWorkSessions(rows), nil
}

func (r *WorkSessionRepo) Get(ctx context.Context, id, userID uuid.UUID) (*worksession.WorkSession, error) {
	row, err := r.q.GetWorkSlice(ctx, sqlcgen.GetWorkSliceParams{
		ID:     toPgUUID(id),
		UserID: toPgUUID(userID),
	})
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, ErrWorkSessionNotFound
		}
		return nil, fmt.Errorf("get work session: %w", err)
	}
	return rowToWorkSession(row), nil
}

func (r *WorkSessionRepo) Create(ctx context.Context, w *worksession.WorkSession) (*worksession.WorkSession, error) {
	row, err := r.q.CreateWorkSlice(ctx, sqlcgen.CreateWorkSliceParams{
		ID:        toPgUUID(w.ID),
		UserID:    toPgUUID(w.UserID),
		TaskID:    toPgUUIDPtr(w.TaskID),
		Mode:      string(w.Mode),
		StartedAt: toPgTime(w.StartedAt),
		Note:      strToPtr(w.Note),
	})
	if err != nil {
		return nil, fmt.Errorf("create work session: %w", err)
	}
	return rowToWorkSession(row), nil
}

func (r *WorkSessionRepo) Update(ctx context.Context, w *worksession.WorkSession) (*worksession.WorkSession, error) {
	row, err := r.q.UpdateWorkSlice(ctx, sqlcgen.UpdateWorkSliceParams{
		ID:          toPgUUID(w.ID),
		UserID:      toPgUUID(w.UserID),
		Mode:        string(w.Mode),
		TaskID:      toPgUUIDPtr(w.TaskID),
		StartedAt:   toPgTime(w.StartedAt),
		EndedAt:     toPgTimePtr(w.EndedAt),
		DurationSec: intPtrToInt32Ptr(w.DurationSec),
		Density:     intPtrToInt32Ptr(w.Density),
		Note:        strToPtr(w.Note),
	})
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, ErrWorkSessionNotFound
		}
		return nil, fmt.Errorf("update work session: %w", err)
	}
	return rowToWorkSession(row), nil
}

func (r *WorkSessionRepo) Delete(ctx context.Context, id, userID uuid.UUID) error {
	if err := r.q.DeleteWorkSlice(ctx, sqlcgen.DeleteWorkSliceParams{
		ID:     toPgUUID(id),
		UserID: toPgUUID(userID),
	}); err != nil {
		return fmt.Errorf("delete work session: %w", err)
	}
	return nil
}

// SumByMode returns total seconds per mode for ended sessions in [from, to).
func (r *WorkSessionRepo) SumByMode(ctx context.Context, userID uuid.UUID, from, to time.Time) (map[worksession.Mode]int64, error) {
	rows, err := r.q.SumWorkSlicesByModeInRange(ctx, sqlcgen.SumWorkSlicesByModeInRangeParams{
		UserID:      toPgUUID(userID),
		StartedAt:   toPgTime(from),
		StartedAt_2: toPgTime(to),
	})
	if err != nil {
		return nil, fmt.Errorf("sum work sessions by mode: %w", err)
	}
	out := make(map[worksession.Mode]int64, len(rows))
	for _, r := range rows {
		out[worksession.Mode(r.Mode)] = r.TotalSeconds
	}
	return out, nil
}

func rowToWorkSession(r sqlcgen.WorkSlice) *worksession.WorkSession {
	return &worksession.WorkSession{
		ID:          uuid.UUID(r.ID.Bytes),
		UserID:      uuid.UUID(r.UserID.Bytes),
		TaskID:      pgUUIDToPtr(r.TaskID),
		Mode:        worksession.Mode(r.Mode),
		StartedAt:   r.StartedAt.Time,
		EndedAt:     pgTimeToPtr(r.EndedAt),
		DurationSec: int32PtrToIntPtr(r.DurationSec),
		Density:     int32PtrToIntPtr(r.Density),
		Note:        ptrToStr(r.Note),
		CreatedAt:   r.CreatedAt.Time,
		UpdatedAt:   r.UpdatedAt.Time,
	}
}

func rowsToWorkSessions(rs []sqlcgen.WorkSlice) []*worksession.WorkSession {
	out := make([]*worksession.WorkSession, len(rs))
	for i, r := range rs {
		out[i] = rowToWorkSession(r)
	}
	return out
}
