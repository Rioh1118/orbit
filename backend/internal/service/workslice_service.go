package service

import (
	"context"
	"errors"
	"fmt"
	"time"

	"github.com/Rioh1118/orbit/backend/internal/domain/workslice"
	"github.com/Rioh1118/orbit/backend/internal/repo"
	"github.com/google/uuid"
)

type WorkSliceService struct {
	repo     *repo.WorkSliceRepo
	taskRepo *repo.TaskRepo
}

func NewWorkSliceService(r *repo.WorkSliceRepo, taskRepo *repo.TaskRepo) *WorkSliceService {
	return &WorkSliceService{repo: r, taskRepo: taskRepo}
}

type WSListInput struct {
	UserID uuid.UUID
	TaskID *uuid.UUID
	Mode   *workslice.Mode
	From   *time.Time
	To     *time.Time
	Limit  int
	Offset int
}

func (s *WorkSliceService) List(ctx context.Context, in WSListInput) ([]*workslice.WorkSlice, int64, error) {
	limit := in.Limit
	if limit <= 0 {
		limit = 50
	}
	if limit > 200 {
		limit = 200
	}
	return s.repo.List(ctx, repo.ListWorkSlicesParams{
		UserID: in.UserID,
		TaskID: in.TaskID,
		Mode:   in.Mode,
		From:   in.From,
		To:     in.To,
		Limit:  int32(limit),
		Offset: int32(in.Offset),
	})
}

func (s *WorkSliceService) ListActive(ctx context.Context, userID uuid.UUID) ([]*workslice.WorkSlice, error) {
	return s.repo.ListActive(ctx, userID)
}

// Current returns the single open segment, or (nil, nil) if not working.
func (s *WorkSliceService) Current(ctx context.Context, userID uuid.UUID) (*workslice.WorkSlice, error) {
	return s.repo.GetOpen(ctx, userID)
}

func (s *WorkSliceService) Get(ctx context.Context, id, userID uuid.UUID) (*workslice.WorkSlice, error) {
	return s.repo.Get(ctx, id, userID)
}

// closeOpen ends the user's currently-open segment (if any) at `at`.
// This enforces the single-current-activity invariant before opening a new segment.
func (s *WorkSliceService) closeOpen(ctx context.Context, userID uuid.UUID, at time.Time) error {
	open, err := s.repo.GetOpen(ctx, userID)
	if err != nil {
		return err
	}
	if open == nil {
		return nil
	}
	if err := open.End(at); err != nil {
		return err
	}
	if _, err := s.repo.Update(ctx, open); err != nil {
		return err
	}
	return nil
}

type WSStartInput struct {
	UserID uuid.UUID
	TaskID *uuid.UUID
	Mode   workslice.Mode
	Driver workslice.Driver
	Note   string
}

// Start opens a WORK segment, auto-closing any segment already open (state machine).
func (s *WorkSliceService) Start(ctx context.Context, in WSStartInput) (*workslice.WorkSlice, error) {
	if in.Driver == "" {
		in.Driver = workslice.DriverSolo
	}
	id, err := uuid.NewV7()
	if err != nil {
		return nil, fmt.Errorf("uuid: %w", err)
	}
	now := time.Now().UTC()
	w := &workslice.WorkSlice{
		ID:        id,
		UserID:    in.UserID,
		TaskID:    in.TaskID,
		Type:      workslice.TypeWork,
		Mode:      in.Mode,
		Driver:    in.Driver,
		StartedAt: now,
		Note:      in.Note,
	}
	if err := w.Validate(); err != nil {
		return nil, err
	}
	if err := s.closeOpen(ctx, in.UserID, now); err != nil {
		return nil, err
	}
	created, err := s.repo.Create(ctx, w)
	if err != nil {
		return nil, err
	}
	// Auto-set tasks.started_at on first slice. Best-effort, ignore errors.
	if in.TaskID != nil {
		if t, err := s.taskRepo.Get(ctx, *in.TaskID, in.UserID); err == nil && t.StartedAt == nil {
			t.StartedAt = &now
			_, _ = s.taskRepo.Update(ctx, t)
		}
	}
	return created, nil
}

type WSStartOffInput struct {
	UserID uuid.UUID
	Reason workslice.OffReason
	Note   string
}

// StartOff opens a non-craft (off) segment (break/meeting/other), auto-closing the open segment.
func (s *WorkSliceService) StartOff(ctx context.Context, in WSStartOffInput) (*workslice.WorkSlice, error) {
	id, err := uuid.NewV7()
	if err != nil {
		return nil, fmt.Errorf("uuid: %w", err)
	}
	now := time.Now().UTC()
	w := &workslice.WorkSlice{
		ID:        id,
		UserID:    in.UserID,
		Type:      workslice.TypeOff,
		OffReason: in.Reason,
		StartedAt: now,
		Note:      in.Note,
	}
	if err := w.Validate(); err != nil {
		return nil, err
	}
	if err := s.closeOpen(ctx, in.UserID, now); err != nil {
		return nil, err
	}
	return s.repo.Create(ctx, w)
}

// Stop closes the user's open segment without opening a new one ("作業終了").
func (s *WorkSliceService) Stop(ctx context.Context, userID uuid.UUID) (*workslice.WorkSlice, error) {
	open, err := s.repo.GetOpen(ctx, userID)
	if err != nil {
		return nil, err
	}
	if open == nil {
		return nil, nil
	}
	if err := open.End(time.Now().UTC()); err != nil {
		return nil, err
	}
	return s.repo.Update(ctx, open)
}

type WSEndInput struct {
	ID     uuid.UUID
	UserID uuid.UUID
}

func (s *WorkSliceService) End(ctx context.Context, in WSEndInput) (*workslice.WorkSlice, error) {
	w, err := s.repo.Get(ctx, in.ID, in.UserID)
	if err != nil {
		return nil, err
	}
	if err := w.End(time.Now().UTC()); err != nil {
		return nil, err
	}
	return s.repo.Update(ctx, w)
}

type WSUpdateInput struct {
	ID        uuid.UUID
	UserID    uuid.UUID
	Mode      *workslice.Mode
	Driver    *workslice.Driver
	TaskID    *uuid.UUID
	StartedAt *time.Time
	EndedAt   *time.Time
	Note      *string
	// ClearTaskID forces task_id to NULL (since *uuid.UUID can't distinguish unset from cleared).
	ClearTaskID bool
}

func (s *WorkSliceService) Update(ctx context.Context, in WSUpdateInput) (*workslice.WorkSlice, error) {
	w, err := s.repo.Get(ctx, in.ID, in.UserID)
	if err != nil {
		return nil, err
	}
	if in.Mode != nil {
		w.Mode = *in.Mode
	}
	if in.Driver != nil {
		w.Driver = *in.Driver
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
	if in.Note != nil {
		w.Note = *in.Note
	}
	if err := w.Validate(); err != nil {
		return nil, err
	}
	return s.repo.Update(ctx, w)
}

func (s *WorkSliceService) Delete(ctx context.Context, id, userID uuid.UUID) error {
	return s.repo.Delete(ctx, id, userID)
}

// SumByModeForRange returns total work seconds per mode in [from, to) (Today distribution).
func (s *WorkSliceService) SumByModeForRange(ctx context.Context, userID uuid.UUID, from, to time.Time) (map[workslice.Mode]int64, error) {
	if !to.After(from) {
		return nil, errors.New("to must be after from")
	}
	return s.repo.SumByMode(ctx, userID, from, to)
}
