package workslice

import (
	"testing"
	"time"

	"github.com/google/uuid"
)

func TestModeValid(t *testing.T) {
	for _, m := range []Mode{
		ModeSpecRead, ModeTaskBreakdown, ModeStudy, ModeCodeExplore, ModeDesign,
		ModeImplement, ModeReview, ModeVerify, ModeDebug, ModeConsult, ModeOther,
	} {
		if !m.Valid() {
			t.Errorf("Mode(%q) should be valid", m)
		}
		if m.Key() == "" {
			t.Errorf("Mode(%q) should have a key", m)
		}
	}
	for _, m := range []Mode{"garbage", "ai_review", "human_review"} {
		if Mode(m).Valid() {
			t.Errorf("Mode(%q) should be invalid", m)
		}
	}
}

func TestModeKeysUnique(t *testing.T) {
	seen := map[string]Mode{}
	for m := range validModes {
		k := m.Key()
		if prev, ok := seen[k]; ok {
			t.Errorf("key %q shared by %q and %q", k, prev, m)
		}
		seen[k] = m
	}
}

func TestDriverAndOffReasonValid(t *testing.T) {
	for _, d := range []Driver{DriverSolo, DriverAI, DriverHuman} {
		if !d.Valid() {
			t.Errorf("Driver(%q) should be valid", d)
		}
	}
	if Driver("garbage").Valid() {
		t.Error("garbage driver should be invalid")
	}
	for _, o := range []OffReason{OffBreak, OffMeeting, OffOther} {
		if !o.Valid() {
			t.Errorf("OffReason(%q) should be valid", o)
		}
	}
	if OffReason("garbage").Valid() {
		t.Error("garbage off_reason should be invalid")
	}
}

func TestEnd(t *testing.T) {
	start := time.Date(2026, 1, 1, 10, 0, 0, 0, time.UTC)
	end := start.Add(30 * time.Minute)

	w := &WorkSlice{ID: uuid.New(), UserID: uuid.New(), Type: TypeWork, Mode: ModeCodeExplore, Driver: DriverSolo, StartedAt: start}
	if err := w.End(end); err != nil {
		t.Fatalf("End: %v", err)
	}
	if w.EndedAt == nil || !w.EndedAt.Equal(end) {
		t.Errorf("EndedAt mismatch")
	}
	if w.DurationSec == nil || *w.DurationSec != 1800 {
		t.Errorf("DurationSec = %v, want 1800", w.DurationSec)
	}
	if err := w.End(end); err != ErrAlreadyEnded {
		t.Errorf("expected ErrAlreadyEnded, got %v", err)
	}

	bad := &WorkSlice{Type: TypeWork, Mode: ModeCodeExplore, Driver: DriverSolo, StartedAt: start}
	if err := bad.End(start.Add(-1 * time.Minute)); err != ErrEndBeforeStart {
		t.Errorf("expected ErrEndBeforeStart, got %v", err)
	}
}

func TestValidate(t *testing.T) {
	start := time.Date(2026, 1, 1, 10, 0, 0, 0, time.UTC)
	taskID := uuid.New()
	cases := []struct {
		name string
		w    WorkSlice
		want error
	}{
		{"valid work", WorkSlice{Type: TypeWork, Mode: ModeCodeExplore, Driver: DriverSolo, StartedAt: start}, nil},
		{"valid off", WorkSlice{Type: TypeOff, OffReason: OffBreak, StartedAt: start}, nil},
		{"invalid type", WorkSlice{Type: "garbage", StartedAt: start}, ErrInvalidType},
		{"work invalid mode", WorkSlice{Type: TypeWork, Mode: "garbage", Driver: DriverSolo, StartedAt: start}, ErrInvalidMode},
		{"work missing driver", WorkSlice{Type: TypeWork, Mode: ModeImplement, StartedAt: start}, ErrInvalidDriver},
		{"work with off_reason", WorkSlice{Type: TypeWork, Mode: ModeImplement, Driver: DriverSolo, OffReason: OffBreak, StartedAt: start}, ErrLayerMismatch},
		{"off invalid reason", WorkSlice{Type: TypeOff, OffReason: "garbage", StartedAt: start}, ErrInvalidOffReason},
		{"off with mode", WorkSlice{Type: TypeOff, OffReason: OffBreak, Mode: ModeImplement, StartedAt: start}, ErrLayerMismatch},
		{"off with task", WorkSlice{Type: TypeOff, OffReason: OffBreak, TaskID: &taskID, StartedAt: start}, ErrLayerMismatch},
		{"zero start", WorkSlice{Type: TypeWork, Mode: ModeCodeExplore, Driver: DriverSolo}, ErrZeroStartedAt},
	}
	for _, c := range cases {
		t.Run(c.name, func(t *testing.T) {
			if err := c.w.Validate(); err != c.want {
				t.Errorf("err = %v, want %v", err, c.want)
			}
		})
	}
}
