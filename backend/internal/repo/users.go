package repo

import (
	"context"
	"errors"
	"fmt"

	"github.com/Rioh1118/orbit/backend/internal/domain/user"
	"github.com/Rioh1118/orbit/backend/internal/repo/sqlcgen"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

var ErrUserNotFound = errors.New("user not found")

type UserRepo struct {
	q *sqlcgen.Queries
}

func NewUserRepo(pool *pgxpool.Pool) *UserRepo {
	return &UserRepo{q: sqlcgen.New(pool)}
}

func (r *UserRepo) GetByAPIKeyPrefix(ctx context.Context, prefix string) (*user.User, error) {
	row, err := r.q.GetUserByAPIKeyPrefix(ctx, prefix)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, ErrUserNotFound
		}
		return nil, fmt.Errorf("get user by prefix: %w", err)
	}
	return rowToUser(row), nil
}

func (r *UserRepo) GetByEmail(ctx context.Context, email string) (*user.User, error) {
	row, err := r.q.GetUserByEmail(ctx, email)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, ErrUserNotFound
		}
		return nil, fmt.Errorf("get user by email: %w", err)
	}
	return rowToUser(row), nil
}

func (r *UserRepo) Create(ctx context.Context, u *user.User) (*user.User, error) {
	row, err := r.q.CreateUser(ctx, sqlcgen.CreateUserParams{
		ID:           toPgUUID(u.ID),
		Email:        u.Email,
		DisplayName:  strToPtr(u.DisplayName),
		ApiKeyHash:   u.APIKeyHash,
		ApiKeyPrefix: u.APIKeyPrefix,
	})
	if err != nil {
		return nil, fmt.Errorf("create user: %w", err)
	}
	return rowToUser(row), nil
}

func (r *UserRepo) UpdateAPIKey(ctx context.Context, id uuid.UUID, hash, prefix string) (*user.User, error) {
	row, err := r.q.UpdateAPIKey(ctx, sqlcgen.UpdateAPIKeyParams{
		ID:           toPgUUID(id),
		ApiKeyHash:   hash,
		ApiKeyPrefix: prefix,
	})
	if err != nil {
		return nil, fmt.Errorf("update api key: %w", err)
	}
	return rowToUser(row), nil
}

func rowToUser(r sqlcgen.User) *user.User {
	return &user.User{
		ID:           uuid.UUID(r.ID.Bytes),
		Email:        r.Email,
		DisplayName:  ptrToStr(r.DisplayName),
		APIKeyHash:   r.ApiKeyHash,
		APIKeyPrefix: r.ApiKeyPrefix,
		CreatedAt:    r.CreatedAt.Time,
		UpdatedAt:    r.UpdatedAt.Time,
	}
}
