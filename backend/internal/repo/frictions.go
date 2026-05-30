package repo

import (
	"context"
	"errors"
	"fmt"
	"time"

	"github.com/Rioh1118/orbit/backend/internal/domain/friction"
	"github.com/Rioh1118/orbit/backend/internal/repo/sqlcgen"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

var ErrFrictionNotFound = errors.New("friction not found")

type FrictionRepo struct {
	q *sqlcgen.Queries
}

func NewFrictionRepo(pool *pgxpool.Pool) *FrictionRepo {
	return &FrictionRepo{q: sqlcgen.New(pool)}
}

type ListFrictionsParams struct {
	UserID      uuid.UUID
	TaskID      *uuid.UUID
	WorkSliceID *uuid.UUID
	PatternTag  *friction.PatternTag
	Resolved    *bool
	From        *time.Time
	To          *time.Time
	Limit       int32
	Offset      int32
}

func (r *FrictionRepo) List(ctx context.Context, p ListFrictionsParams) ([]*friction.Friction, int64, error) {
	var tagStr *string
	if p.PatternTag != nil {
		s := string(*p.PatternTag)
		tagStr = &s
	}
	rows, err := r.q.ListFrictions(ctx, sqlcgen.ListFrictionsParams{
		UserID:      toPgUUID(p.UserID),
		TaskID:      toPgUUIDPtr(p.TaskID),
		WorkSliceID: toPgUUIDPtr(p.WorkSliceID),
		PatternTag:  tagStr,
		Resolved:    p.Resolved,
		FromTime:    toPgTimePtr(p.From),
		ToTime:      toPgTimePtr(p.To),
		Limit:       p.Limit,
		Offset:      p.Offset,
	})
	if err != nil {
		return nil, 0, fmt.Errorf("list frictions: %w", err)
	}
	total, err := r.q.CountFrictions(ctx, sqlcgen.CountFrictionsParams{
		UserID:      toPgUUID(p.UserID),
		TaskID:      toPgUUIDPtr(p.TaskID),
		WorkSliceID: toPgUUIDPtr(p.WorkSliceID),
		PatternTag:  tagStr,
		Resolved:    p.Resolved,
		FromTime:    toPgTimePtr(p.From),
		ToTime:      toPgTimePtr(p.To),
	})
	if err != nil {
		return nil, 0, fmt.Errorf("count frictions: %w", err)
	}
	return rowsToFrictions(rows), total, nil
}

func (r *FrictionRepo) Get(ctx context.Context, id, userID uuid.UUID) (*friction.Friction, error) {
	row, err := r.q.GetFriction(ctx, sqlcgen.GetFrictionParams{
		ID:     toPgUUID(id),
		UserID: toPgUUID(userID),
	})
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, ErrFrictionNotFound
		}
		return nil, fmt.Errorf("get friction: %w", err)
	}
	return rowToFriction(row), nil
}

func (r *FrictionRepo) Create(ctx context.Context, f *friction.Friction) (*friction.Friction, error) {
	row, err := r.q.CreateFriction(ctx, sqlcgen.CreateFrictionParams{
		ID:          toPgUUID(f.ID),
		UserID:      toPgUUID(f.UserID),
		TaskID:      toPgUUIDPtr(f.TaskID),
		WorkSliceID: toPgUUIDPtr(f.WorkSliceID),
		PatternTag:  string(f.PatternTag),
		Severity:    int32(f.Severity),
		Description: f.Description,
	})
	if err != nil {
		return nil, fmt.Errorf("create friction: %w", err)
	}
	return rowToFriction(row), nil
}

func (r *FrictionRepo) Update(ctx context.Context, f *friction.Friction) (*friction.Friction, error) {
	row, err := r.q.UpdateFriction(ctx, sqlcgen.UpdateFrictionParams{
		ID:             toPgUUID(f.ID),
		UserID:         toPgUUID(f.UserID),
		TaskID:         toPgUUIDPtr(f.TaskID),
		WorkSliceID:    toPgUUIDPtr(f.WorkSliceID),
		PatternTag:     string(f.PatternTag),
		Severity:       int32(f.Severity),
		Description:    f.Description,
		ResolvedAt:     toPgTimePtr(f.ResolvedAt),
		ResolutionNote: strToPtr(f.ResolutionNote),
	})
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, ErrFrictionNotFound
		}
		return nil, fmt.Errorf("update friction: %w", err)
	}
	return rowToFriction(row), nil
}

func (r *FrictionRepo) Delete(ctx context.Context, id, userID uuid.UUID) error {
	if err := r.q.DeleteFriction(ctx, sqlcgen.DeleteFrictionParams{
		ID:     toPgUUID(id),
		UserID: toPgUUID(userID),
	}); err != nil {
		return fmt.Errorf("delete friction: %w", err)
	}
	return nil
}

func rowToFriction(r sqlcgen.Friction) *friction.Friction {
	return &friction.Friction{
		ID:             uuid.UUID(r.ID.Bytes),
		UserID:         uuid.UUID(r.UserID.Bytes),
		TaskID:         pgUUIDToPtr(r.TaskID),
		WorkSliceID:    pgUUIDToPtr(r.WorkSliceID),
		PatternTag:     friction.PatternTag(r.PatternTag),
		Severity:       int(r.Severity),
		Description:    r.Description,
		ResolvedAt:     pgTimeToPtr(r.ResolvedAt),
		ResolutionNote: ptrToStr(r.ResolutionNote),
		CreatedAt:      r.CreatedAt.Time,
		UpdatedAt:      r.UpdatedAt.Time,
	}
}

func rowsToFrictions(rs []sqlcgen.Friction) []*friction.Friction {
	out := make([]*friction.Friction, len(rs))
	for i, r := range rs {
		out[i] = rowToFriction(r)
	}
	return out
}
