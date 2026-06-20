package task

import (
	"testing"

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
