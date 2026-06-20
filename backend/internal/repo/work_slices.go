package repo

import (
	"context"
	"errors"
	"fmt"
	"time"

	"github.com/Rioh1118/orbit/backend/internal/domain/workslice"
	"github.com/Rioh1118/orbit/backend/internal/repo/sqlcgen"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

var ErrWorkSliceNotFound = errors.New("work slice not found")

type WorkSliceRepo struct {
	q *sqlcgen.Queries
}

func NewWorkSliceRepo(pool *pgxpool.Pool) *WorkSliceRepo {
	return &WorkSliceRepo{q: sqlcgen.New(pool)}
}

type ListWorkSlicesParams struct {
	UserID uuid.UUID
	TaskID *uuid.UUID
	Mode   *workslice.Mode
	From   *time.Time
	To     *time.Time
	Limit  int32
	Offset int32
}

func (r *WorkSliceRepo) List(ctx context.Context, p ListWorkSlicesParams) ([]*workslice.WorkSlice, int64, error) {
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
		return nil, 0, fmt.Errorf("list work slices: %w", err)
	}
	total, err := r.q.CountWorkSlices(ctx, sqlcgen.CountWorkSlicesParams{
		UserID:   toPgUUID(p.UserID),
		TaskID:   toPgUUIDPtr(p.TaskID),
		Mode:     modeStr,
		FromTime: toPgTimePtr(p.From),
		ToTime:   toPgTimePtr(p.To),
	})
	if err != nil {
		return nil, 0, fmt.Errorf("count work slices: %w", err)
	}
	return rowsToWorkSlices(rows), total, nil
}

func (r *WorkSliceRepo) ListActive(ctx context.Context, userID uuid.UUID) ([]*workslice.WorkSlice, error) {
	rows, err := r.q.ListActiveWorkSlices(ctx, toPgUUID(userID))
	if err != nil {
		return nil, fmt.Errorf("list active work slices: %w", err)
	}
	return rowsToWorkSlices(rows), nil
}

// GetOpen returns the single currently-open segment, or (nil, nil) if none.
func (r *WorkSliceRepo) GetOpen(ctx context.Context, userID uuid.UUID) (*workslice.WorkSlice, error) {
	row, err := r.q.GetOpenWorkSlice(ctx, toPgUUID(userID))
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, nil
		}
		return nil, fmt.Errorf("get open work slice: %w", err)
	}
	return rowToWorkSlice(row), nil
}

func (r *WorkSliceRepo) Get(ctx context.Context, id, userID uuid.UUID) (*workslice.WorkSlice, error) {
	row, err := r.q.GetWorkSlice(ctx, sqlcgen.GetWorkSliceParams{
		ID:     toPgUUID(id),
		UserID: toPgUUID(userID),
	})
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, ErrWorkSliceNotFound
		}
		return nil, fmt.Errorf("get work slice: %w", err)
	}
	return rowToWorkSlice(row), nil
}

func (r *WorkSliceRepo) Create(ctx context.Context, w *workslice.WorkSlice) (*workslice.WorkSlice, error) {
	row, err := r.q.CreateWorkSlice(ctx, sqlcgen.CreateWorkSliceParams{
		ID:        toPgUUID(w.ID),
		UserID:    toPgUUID(w.UserID),
		TaskID:    toPgUUIDPtr(w.TaskID),
		Type:      string(w.Type),
		Mode:      strToPtr(string(w.Mode)),
		Driver:    strToPtr(string(w.Driver)),
		OffReason: strToPtr(string(w.OffReason)),
		StartedAt: toPgTime(w.StartedAt),
		Note:      strToPtr(w.Note),
	})
	if err != nil {
		return nil, fmt.Errorf("create work slice: %w", err)
	}
	return rowToWorkSlice(row), nil
}

func (r *WorkSliceRepo) Update(ctx context.Context, w *workslice.WorkSlice) (*workslice.WorkSlice, error) {
	row, err := r.q.UpdateWorkSlice(ctx, sqlcgen.UpdateWorkSliceParams{
		ID:          toPgUUID(w.ID),
		UserID:      toPgUUID(w.UserID),
		TaskID:      toPgUUIDPtr(w.TaskID),
		Mode:        strToPtr(string(w.Mode)),
		Driver:      strToPtr(string(w.Driver)),
		OffReason:   strToPtr(string(w.OffReason)),
		StartedAt:   toPgTime(w.StartedAt),
		EndedAt:     toPgTimePtr(w.EndedAt),
		DurationSec: intPtrToInt32Ptr(w.DurationSec),
		Note:        strToPtr(w.Note),
	})
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, ErrWorkSliceNotFound
		}
		return nil, fmt.Errorf("update work slice: %w", err)
	}
	return rowToWorkSlice(row), nil
}

func (r *WorkSliceRepo) Delete(ctx context.Context, id, userID uuid.UUID) error {
	if err := r.q.DeleteWorkSlice(ctx, sqlcgen.DeleteWorkSliceParams{
		ID:     toPgUUID(id),
		UserID: toPgUUID(userID),
	}); err != nil {
		return fmt.Errorf("delete work slice: %w", err)
	}
	return nil
}

// SumByMode returns total seconds per mode for ended WORK segments in [from, to).
func (r *WorkSliceRepo) SumByMode(ctx context.Context, userID uuid.UUID, from, to time.Time) (map[workslice.Mode]int64, error) {
	rows, err := r.q.SumWorkModeInRange(ctx, sqlcgen.SumWorkModeInRangeParams{
		UserID:      toPgUUID(userID),
		StartedAt:   toPgTime(from),
		StartedAt_2: toPgTime(to),
	})
	if err != nil {
		return nil, fmt.Errorf("sum work slices by mode: %w", err)
	}
	out := make(map[workslice.Mode]int64, len(rows))
	for _, row := range rows {
		if row.Mode == nil {
			continue
		}
		out[workslice.Mode(*row.Mode)] = row.TotalSeconds
	}
	return out, nil
}

func rowToWorkSlice(r sqlcgen.WorkSlice) *workslice.WorkSlice {
	return &workslice.WorkSlice{
		ID:          uuid.UUID(r.ID.Bytes),
		UserID:      uuid.UUID(r.UserID.Bytes),
		TaskID:      pgUUIDToPtr(r.TaskID),
		Type:        workslice.Type(r.Type),
		Mode:        workslice.Mode(ptrToStr(r.Mode)),
		Driver:      workslice.Driver(ptrToStr(r.Driver)),
		OffReason:   workslice.OffReason(ptrToStr(r.OffReason)),
		StartedAt:   r.StartedAt.Time,
		EndedAt:     pgTimeToPtr(r.EndedAt),
		DurationSec: int32PtrToIntPtr(r.DurationSec),
		Note:        ptrToStr(r.Note),
		CreatedAt:   r.CreatedAt.Time,
		UpdatedAt:   r.UpdatedAt.Time,
	}
}

func rowsToWorkSlices(rs []sqlcgen.WorkSlice) []*workslice.WorkSlice {
	out := make([]*workslice.WorkSlice, len(rs))
	for i, r := range rs {
		out[i] = rowToWorkSlice(r)
	}
	return out
}
