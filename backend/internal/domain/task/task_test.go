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

func TestTaskValidate(t *testing.T) {
	cases := []struct {
		name    string
		task    Task
		wantErr error
	}{
		{
			name: "valid",
			task: Task{ID: uuid.New(), UserID: uuid.New(), Title: "ok", Status: StatusOpen},
		},
		{
			name:    "empty title",
			task:    Task{ID: uuid.New(), UserID: uuid.New(), Title: "", Status: StatusOpen},
			wantErr: ErrInvalidTitle,
		},
		{
			name:    "invalid status",
			task:    Task{ID: uuid.New(), UserID: uuid.New(), Title: "ok", Status: "garbage"},
			wantErr: ErrInvalidStatus,
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
