package service

import (
	"context"
	"errors"
	"fmt"
	"time"

	"github.com/Rioh1118/orbit/backend/internal/domain/worksession"
	"github.com/Rioh1118/orbit/backend/internal/repo"
	"github.com/google/uuid"
)

type WorkSessionService struct {
	repo     *repo.WorkSessionRepo
	taskRepo *repo.TaskRepo
}

func NewWorkSessionService(r *repo.WorkSessionRepo, taskRepo *repo.TaskRepo) *WorkSessionService {
	return &WorkSessionService{repo: r, taskRepo: taskRepo}
}

type WSListInput struct {
	UserID uuid.UUID
	TaskID *uuid.UUID
	Mode   *worksession.Mode
	From   *time.Time
	To     *time.Time
	Limit  int
	Offset int
}

func (s *WorkSessionService) List(ctx context.Context, in WSListInput) ([]*worksession.WorkSession, int64, error) {
	limit := in.Limit
	if limit <= 0 {
		limit = 50
	}
	if limit > 200 {
		limit = 200
	}
	return s.repo.List(ctx, repo.ListWorkSessionsParams{
		UserID: in.UserID,
		TaskID: in.TaskID,
		Mode:   in.Mode,
		From:   in.From,
		To:     in.To,
		Limit:  int32(limit),
		Offset: int32(in.Offset),
	})
}

func (s *WorkSessionService) ListActive(ctx context.Context, userID uuid.UUID) ([]*worksession.WorkSession, error) {
	return s.repo.ListActive(ctx, userID)
}

func (s *WorkSessionService) Get(ctx context.Context, id, userID uuid.UUID) (*worksession.WorkSession, error) {
	return s.repo.Get(ctx, id, userID)
}

type WSStartInput struct {
	UserID uuid.UUID
	TaskID *uuid.UUID
	Mode   worksession.Mode
	Note   string
}

func (s *WorkSessionService) Start(ctx context.Context, in WSStartInput) (*worksession.WorkSession, error) {
	id, err := uuid.NewV7()
	if err != nil {
		return nil, fmt.Errorf("uuid: %w", err)
	}
	now := time.Now().UTC()
	w := &worksession.WorkSession{
		ID:        id,
		UserID:    in.UserID,
		TaskID:    in.TaskID,
		Mode:      in.Mode,
		StartedAt: now,
		Note:      in.Note,
	}
	if err := w.Validate(); err != nil {
		return nil, err
	}
	created, err := s.repo.Create(ctx, w)
	if err != nil {
		return nil, err
	}
	// Auto-set tasks.started_at on first session. Best-effort, ignore errors.
	if in.TaskID != nil {
		if t, err := s.taskRepo.Get(ctx, *in.TaskID, in.UserID); err == nil && t.StartedAt == nil {
			t.StartedAt = &now
			_, _ = s.taskRepo.Update(ctx, t)
		}
	}
	return created, nil
}

type WSEndInput struct {
	ID      uuid.UUID
	UserID  uuid.UUID
	Density *int
}

func (s *WorkSessionService) End(ctx context.Context, in WSEndInput) (*worksession.WorkSession, error) {
	w, err := s.repo.Get(ctx, in.ID, in.UserID)
	if err != nil {
		return nil, err
	}
	if err := w.End(time.Now().UTC(), in.Density); err != nil {
		return nil, err
	}
	return s.repo.Update(ctx, w)
}

type WSUpdateInput struct {
	ID        uuid.UUID
	UserID    uuid.UUID
	Mode      *worksession.Mode
	TaskID    *uuid.UUID
	StartedAt *time.Time
	EndedAt   *time.Time
	Density   *int
	Note      *string
	// ClearTaskID forces task_id to NULL (since *uuid.UUID can't distinguish unset from cleared).
	ClearTaskID bool
}

func (s *WorkSessionService) Update(ctx context.Context, in WSUpdateInput) (*worksession.WorkSession, error) {
	w, err := s.repo.Get(ctx, in.ID, in.UserID)
	if err != nil {
		return nil, err
	}
	if in.Mode != nil {
		if !in.Mode.Valid() {
			return nil, worksession.ErrInvalidMode
		}
		w.Mode = *in.Mode
	}
	if in.ClearTaskID {
		w.TaskID = nil
	} else if in.TaskID != nil {
		w.TaskID = in.TaskID
	}
	if in.StartedAt != nil {
		w.StartedAt = *in.StartedAt
	}
	if in.EndedAt != nil {
		w.EndedAt = in.EndedAt
		dur := int(in.EndedAt.Sub(w.StartedAt).Seconds())
		w.DurationSec = &dur
	}
	if in.Density != nil {
		d := *in.Density
		w.Density = &d
	}
	if in.Note != nil {
		w.Note = *in.Note
	}
	if err := w.Validate(); err != nil {
		return nil, err
	}
	return s.repo.Update(ctx, w)
}

func (s *WorkSessionService) Delete(ctx context.Context, id, userID uuid.UUID) error {
	return s.repo.Delete(ctx, id, userID)
}

// SumByModeForRange returns total seconds per mode in [from, to).
func (s *WorkSessionService) SumByModeForRange(ctx context.Context, userID uuid.UUID, from, to time.Time) (map[worksession.Mode]int64, error) {
	if !to.After(from) {
		return nil, errors.New("to must be after from")
	}
	return s.repo.SumByMode(ctx, userID, from, to)
}
