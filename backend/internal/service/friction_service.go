package service

import (
	"context"
	"errors"
	"fmt"
	"time"

	"github.com/Rioh1118/orbit/backend/internal/domain/friction"
	"github.com/Rioh1118/orbit/backend/internal/repo"
	"github.com/google/uuid"
)

type FrictionService struct {
	repo *repo.FrictionRepo
}

func NewFrictionService(r *repo.FrictionRepo) *FrictionService {
	return &FrictionService{repo: r}
}

type FListInput struct {
	UserID      uuid.UUID
	TaskID      *uuid.UUID
	WorkSliceID *uuid.UUID
	PatternTag  *friction.PatternTag
	Resolved    *bool
	From        *time.Time
	To          *time.Time
	Limit       int
	Offset      int
}

func (s *FrictionService) List(ctx context.Context, in FListInput) ([]*friction.Friction, int64, error) {
	limit := in.Limit
	if limit <= 0 {
		limit = 50
	}
	if limit > 200 {
		limit = 200
	}
	return s.repo.List(ctx, repo.ListFrictionsParams{
		UserID:      in.UserID,
		TaskID:      in.TaskID,
		WorkSliceID: in.WorkSliceID,
		PatternTag:  in.PatternTag,
		Resolved:    in.Resolved,
		From:        in.From,
		To:          in.To,
		Limit:       int32(limit),
		Offset:      int32(in.Offset),
	})
}

func (s *FrictionService) Get(ctx context.Context, id, userID uuid.UUID) (*friction.Friction, error) {
	return s.repo.Get(ctx, id, userID)
}

type FCreateInput struct {
	UserID      uuid.UUID
	TaskID      *uuid.UUID
	WorkSliceID *uuid.UUID
	PatternTag  friction.PatternTag
	Description string
}

func (s *FrictionService) Create(ctx context.Context, in FCreateInput) (*friction.Friction, error) {
	id, err := uuid.NewV7()
	if err != nil {
		return nil, fmt.Errorf("uuid: %w", err)
	}
	f := &friction.Friction{
		ID:          id,
		UserID:      in.UserID,
		TaskID:      in.TaskID,
		WorkSliceID: in.WorkSliceID,
		PatternTag:  in.PatternTag,
		Description: in.Description,
	}
	if err := f.Validate(); err != nil {
		return nil, err
	}
	return s.repo.Create(ctx, f)
}

type FUpdateInput struct {
	ID             uuid.UUID
	UserID         uuid.UUID
	TaskID         *uuid.UUID
	ClearTaskID    bool
	WorkSliceID    *uuid.UUID
	ClearWorkSlice bool
	PatternTag     *friction.PatternTag
	Description    *string
	ResolutionNote *string
	// Resolve toggles resolved_at. nil = no change, true = resolve now, false = clear.
	Resolve *bool
}

func (s *FrictionService) Update(ctx context.Context, in FUpdateInput) (*friction.Friction, error) {
	f, err := s.repo.Get(ctx, in.ID, in.UserID)
	if err != nil {
		return nil, err
	}
	if in.ClearTaskID {
		f.TaskID = nil
	} else if in.TaskID != nil {
		f.TaskID = in.TaskID
	}
	if in.ClearWorkSlice {
		f.WorkSliceID = nil
	} else if in.WorkSliceID != nil {
		f.WorkSliceID = in.WorkSliceID
	}
	if in.PatternTag != nil {
		if !in.PatternTag.Valid() {
			return nil, friction.ErrInvalidPatternTag
		}
		f.PatternTag = *in.PatternTag
	}
	if in.Description != nil {
		f.Description = *in.Description
	}
	if in.ResolutionNote != nil {
		f.ResolutionNote = *in.ResolutionNote
	}
	if in.Resolve != nil {
		if *in.Resolve {
			if f.ResolvedAt == nil {
				now := time.Now().UTC()
				f.ResolvedAt = &now
			}
		} else {
			f.ResolvedAt = nil
		}
	}
	if err := f.Validate(); err != nil {
		return nil, err
	}
	return s.repo.Update(ctx, f)
}

func (s *FrictionService) Delete(ctx context.Context, id, userID uuid.UUID) error {
	return s.repo.Delete(ctx, id, userID)
}

// Resolve is a convenience helper for the common "mark resolved with optional note" flow.
func (s *FrictionService) Resolve(ctx context.Context, id, userID uuid.UUID, note string) (*friction.Friction, error) {
	f, err := s.repo.Get(ctx, id, userID)
	if err != nil {
		return nil, err
	}
	if err := f.Resolve(time.Now().UTC(), note); err != nil {
		if errors.Is(err, friction.ErrAlreadyResolved) {
			return f, nil // idempotent
		}
		return nil, err
	}
	return s.repo.Update(ctx, f)
}
