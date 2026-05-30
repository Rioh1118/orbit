package repo

import (
	"context"
	"errors"
	"fmt"

	"github.com/Rioh1118/orbit/backend/internal/domain/task"
	"github.com/Rioh1118/orbit/backend/internal/repo/sqlcgen"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

var ErrTaskNotFound = errors.New("task not found")

type TaskRepo struct {
	q *sqlcgen.Queries
}

func NewTaskRepo(pool *pgxpool.Pool) *TaskRepo {
	return &TaskRepo{q: sqlcgen.New(pool)}
}

type ListTasksParams struct {
	UserID uuid.UUID
	Status *task.Status
	Limit  int32
	Offset int32
}

func (r *TaskRepo) List(ctx context.Context, p ListTasksParams) ([]*task.Task, int64, error) {
	if p.Status != nil {
		rows, err := r.q.ListTasksByStatus(ctx, sqlcgen.ListTasksByStatusParams{
			UserID: toPgUUID(p.UserID),
			Status: string(*p.Status),
			Limit:  p.Limit,
			Offset: p.Offset,
		})
		if err != nil {
			return nil, 0, fmt.Errorf("list tasks by status: %w", err)
		}
		total, err := r.q.CountTasksByStatus(ctx, sqlcgen.CountTasksByStatusParams{
			UserID: toPgUUID(p.UserID),
			Status: string(*p.Status),
		})
		if err != nil {
			return nil, 0, fmt.Errorf("count tasks by status: %w", err)
		}
		return rowsToTasks(rows), total, nil
	}
	rows, err := r.q.ListTasks(ctx, sqlcgen.ListTasksParams{
		UserID: toPgUUID(p.UserID),
		Limit:  p.Limit,
		Offset: p.Offset,
	})
	if err != nil {
		return nil, 0, fmt.Errorf("list tasks: %w", err)
	}
	total, err := r.q.CountTasks(ctx, toPgUUID(p.UserID))
	if err != nil {
		return nil, 0, fmt.Errorf("count tasks: %w", err)
	}
	return rowsToTasks(rows), total, nil
}

func (r *TaskRepo) Get(ctx context.Context, id, userID uuid.UUID) (*task.Task, error) {
	row, err := r.q.GetTask(ctx, sqlcgen.GetTaskParams{
		ID:     toPgUUID(id),
		UserID: toPgUUID(userID),
	})
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, ErrTaskNotFound
		}
		return nil, fmt.Errorf("get task: %w", err)
	}
	return rowToTask(row), nil
}

func (r *TaskRepo) Create(ctx context.Context, t *task.Task) (*task.Task, error) {
	row, err := r.q.CreateTask(ctx, sqlcgen.CreateTaskParams{
		ID:          toPgUUID(t.ID),
		UserID:      toPgUUID(t.UserID),
		Title:       t.Title,
		Description: strToPtr(t.Description),
		Status:      string(t.Status),
		ExternalRef: strToPtr(t.ExternalRef),
	})
	if err != nil {
		return nil, fmt.Errorf("create task: %w", err)
	}
	return rowToTask(row), nil
}

func (r *TaskRepo) Update(ctx context.Context, t *task.Task) (*task.Task, error) {
	row, err := r.q.UpdateTask(ctx, sqlcgen.UpdateTaskParams{
		ID:          toPgUUID(t.ID),
		UserID:      toPgUUID(t.UserID),
		Title:       t.Title,
		Description: strToPtr(t.Description),
		Status:      string(t.Status),
		ExternalRef: strToPtr(t.ExternalRef),
		StartedAt:   toPgTimePtr(t.StartedAt),
		CompletedAt: toPgTimePtr(t.CompletedAt),
	})
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, ErrTaskNotFound
		}
		return nil, fmt.Errorf("update task: %w", err)
	}
	return rowToTask(row), nil
}

func (r *TaskRepo) SoftDelete(ctx context.Context, id, userID uuid.UUID) error {
	if err := r.q.SoftDeleteTask(ctx, sqlcgen.SoftDeleteTaskParams{
		ID:     toPgUUID(id),
		UserID: toPgUUID(userID),
	}); err != nil {
		return fmt.Errorf("soft delete task: %w", err)
	}
	return nil
}

func rowToTask(r sqlcgen.Task) *task.Task {
	return &task.Task{
		ID:          uuid.UUID(r.ID.Bytes),
		UserID:      uuid.UUID(r.UserID.Bytes),
		Title:       r.Title,
		Description: ptrToStr(r.Description),
		Status:      task.Status(r.Status),
		ExternalRef: ptrToStr(r.ExternalRef),
		StartedAt:   pgTimeToPtr(r.StartedAt),
		CompletedAt: pgTimeToPtr(r.CompletedAt),
		CreatedAt:   r.CreatedAt.Time,
		UpdatedAt:   r.UpdatedAt.Time,
	}
}

func rowsToTasks(rs []sqlcgen.Task) []*task.Task {
	out := make([]*task.Task, len(rs))
	for i, r := range rs {
		out[i] = rowToTask(r)
	}
	return out
}
