package service

import (
	"context"
	"fmt"
	"time"

	"github.com/Rioh1118/orbit/backend/internal/domain/task"
	"github.com/Rioh1118/orbit/backend/internal/repo"
	"github.com/google/uuid"
)

type TaskService struct {
	repo *repo.TaskRepo
}

func NewTaskService(r *repo.TaskRepo) *TaskService {
	return &TaskService{repo: r}
}

type ListInput struct {
	UserID   uuid.UUID
	Status   *task.Status
	Category *task.Category
	Limit    int
	Offset   int
}

func (s *TaskService) List(ctx context.Context, in ListInput) ([]*task.Task, int64, error) {
	limit := in.Limit
	if limit <= 0 {
		limit = 50
	}
	if limit > 200 {
		limit = 200
	}
	return s.repo.List(ctx, repo.ListTasksParams{
		UserID:   in.UserID,
		Status:   in.Status,
		Category: in.Category,
		Limit:    int32(limit),
		Offset:   int32(in.Offset),
	})
}

func (s *TaskService) Get(ctx context.Context, id, userID uuid.UUID) (*task.Task, error) {
	return s.repo.Get(ctx, id, userID)
}

type CreateInput struct {
	UserID      uuid.UUID
	Title       string
	Description string
	Category    task.Category
	Status      task.Status
	ExternalRef string
}

func (s *TaskService) Create(ctx context.Context, in CreateInput) (*task.Task, error) {
	id, err := uuid.NewV7()
	if err != nil {
		return nil, fmt.Errorf("uuid: %w", err)
	}
	status := in.Status
	if status == "" {
		status = task.StatusOpen
	}
	t := &task.Task{
		ID:          id,
		UserID:      in.UserID,
		Title:       in.Title,
		Description: in.Description,
		Category:    in.Category,
		Status:      status,
		ExternalRef: in.ExternalRef,
	}
	if err := t.Validate(); err != nil {
		return nil, err
	}
	return s.repo.Create(ctx, t)
}

type UpdateInput struct {
	ID          uuid.UUID
	UserID      uuid.UUID
	Title       *string
	Description *string
	Category    *task.Category
	Status      *task.Status
	ExternalRef *string
}

func (s *TaskService) Update(ctx context.Context, in UpdateInput) (*task.Task, error) {
	existing, err := s.repo.Get(ctx, in.ID, in.UserID)
	if err != nil {
		return nil, err
	}
	// Work on a copy so we never mutate the value returned by the repo (immutability).
	updated := *existing
	if in.Title != nil {
		updated.Title = *in.Title
	}
	if in.Description != nil {
		updated.Description = *in.Description
	}
	if in.ExternalRef != nil {
		updated.ExternalRef = *in.ExternalRef
	}
	if in.Category != nil {
		if !in.Category.Valid() {
			return nil, task.ErrInvalidCategory
		}
		updated.Category = *in.Category
	}
	if in.Status != nil {
		if !in.Status.Valid() {
			return nil, task.ErrInvalidStatus
		}
		// Lifecycle stamps follow the ADR-005 state machine (see task.NextLifecycle):
		// start stamps started_at, completion stamps completed_at, reopening clears it.
		updated.StartedAt, updated.CompletedAt = task.NextLifecycle(
			*in.Status, existing.StartedAt, existing.CompletedAt, time.Now().UTC(),
		)
		updated.Status = *in.Status
	}
	if err := updated.Validate(); err != nil {
		return nil, err
	}
	return s.repo.Update(ctx, &updated)
}

func (s *TaskService) Delete(ctx context.Context, id, userID uuid.UUID) error {
	return s.repo.SoftDelete(ctx, id, userID)
}
