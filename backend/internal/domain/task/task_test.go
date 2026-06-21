package task

import (
	"testing"
	"time"

	"github.com/google/uuid"
)

func TestStatusValid(t *testing.T) {
	cases := []struct {
		in   Status
		want bool
	}{
		{StatusOpen, true},
		{StatusInProgress, true},
		{StatusBlocked, true},
		{StatusDone, true},
		{StatusArchived, true},
		{Status(""), false},
		{Status("unknown"), false},
	}
	for _, c := range cases {
		if got := c.in.Valid(); got != c.want {
			t.Errorf("Status(%q).Valid() = %v, want %v", c.in, got, c.want)
		}
	}
}

func TestCategoryValid(t *testing.T) {
	cases := []struct {
		in   Category
		want bool
	}{
		{CategoryNewFeature, true},
		{CategoryBugFix, true},
		{CategoryRefactor, true},
		{CategoryInvestigation, true},
		{CategorySupport, true},
		{CategoryOther, true},
		{Category("learning"), false}, // ADR 005: learning removed from category
		{Category(""), false},
		{Category("unknown"), false},
	}
	for _, c := range cases {
		if got := c.in.Valid(); got != c.want {
			t.Errorf("Category(%q).Valid() = %v, want %v", c.in, got, c.want)
		}
	}
}

func TestTaskValidate(t *testing.T) {
	cases := []struct {
		name    string
		task    Task
		wantErr error
	}{
		{
			name: "valid",
			task: Task{ID: uuid.New(), UserID: uuid.New(), Title: "ok", Status: StatusOpen, Category: CategoryOther},
		},
		{
			name:    "empty title",
			task:    Task{ID: uuid.New(), UserID: uuid.New(), Title: "", Status: StatusOpen, Category: CategoryOther},
			wantErr: ErrInvalidTitle,
		},
		{
			name:    "invalid status",
			task:    Task{ID: uuid.New(), UserID: uuid.New(), Title: "ok", Status: "garbage", Category: CategoryOther},
			wantErr: ErrInvalidStatus,
		},
		{
			name:    "invalid category",
			task:    Task{ID: uuid.New(), UserID: uuid.New(), Title: "ok", Status: StatusOpen, Category: "garbage"},
			wantErr: ErrInvalidCategory,
		},
		{
			name:    "empty category",
			task:    Task{ID: uuid.New(), UserID: uuid.New(), Title: "ok", Status: StatusOpen, Category: ""},
			wantErr: ErrInvalidCategory,
		},
	}
	for _, c := range cases {
		t.Run(c.name, func(t *testing.T) {
			err := c.task.Validate()
			if err != c.wantErr {
				t.Errorf("err = %v, want %v", err, c.wantErr)
			}
		})
	}
}

func eqTimePtr(a, b *time.Time) bool {
	if a == nil || b == nil {
		return a == b
	}
	return a.Equal(*b)
}

// TestNextLifecycle pins the ADR-005 task state machine: how a status change moves
// the started_at / completed_at lifecycle stamps. Pure given `now`.
func TestNextLifecycle(t *testing.T) {
	now := time.Date(2026, 6, 21, 12, 0, 0, 0, time.UTC)
	earlier := time.Date(2026, 6, 1, 9, 0, 0, 0, time.UTC)
	ep := &earlier // a pre-existing stamp

	cases := []struct {
		name          string
		newStatus     Status
		started       *time.Time
		completed     *time.Time
		wantStarted   *time.Time
		wantCompleted *time.Time
	}{
		{"open->in_progress stamps started_at", StatusInProgress, nil, nil, &now, nil},
		{"re-enter in_progress keeps started_at (sticky)", StatusInProgress, ep, nil, ep, nil},
		{"in_progress->done stamps completed_at, keeps started_at", StatusDone, ep, nil, ep, &now},
		{"done idempotent keeps original completed_at", StatusDone, ep, ep, ep, ep},
		{"done->open clears completed_at, keeps started_at (destructive)", StatusOpen, ep, ep, ep, nil},
		{"done->in_progress reactivates: clears completed_at, keeps started_at", StatusInProgress, ep, ep, ep, nil},
		{"done->archived preserves both (filed finished task keeps record)", StatusArchived, ep, ep, ep, ep},
		{"->blocked preserves timestamps", StatusBlocked, ep, nil, ep, nil},
		{"archived(completed)->open restore clears completed_at", StatusOpen, ep, ep, ep, nil},
		{"open from fresh stays clean", StatusOpen, nil, nil, nil, nil},
		{"open->done directly stamps completed_at (started stays nil)", StatusDone, nil, nil, nil, &now},
	}

	for _, c := range cases {
		t.Run(c.name, func(t *testing.T) {
			gotStarted, gotCompleted := NextLifecycle(c.newStatus, c.started, c.completed, now)
			if !eqTimePtr(gotStarted, c.wantStarted) {
				t.Errorf("started = %v, want %v", gotStarted, c.wantStarted)
			}
			if !eqTimePtr(gotCompleted, c.wantCompleted) {
				t.Errorf("completed = %v, want %v", gotCompleted, c.wantCompleted)
			}
		})
	}
}
