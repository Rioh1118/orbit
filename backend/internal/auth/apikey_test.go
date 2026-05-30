package auth

import (
	"strings"
	"testing"
)

func TestGenerateProducesValidPrefixedKey(t *testing.T) {
	raw, prefix, err := Generate()
	if err != nil {
		t.Fatalf("Generate: %v", err)
	}
	if !strings.HasPrefix(raw, KeyPrefix) {
		t.Errorf("raw missing prefix: %q", raw)
	}
	if len(prefix) != prefixLen {
		t.Errorf("prefix len = %d, want %d", len(prefix), prefixLen)
	}
	if !strings.HasPrefix(raw, prefix) {
		t.Errorf("raw does not start with prefix")
	}
}

func TestHashIsDeterministicAndVerifySucceeds(t *testing.T) {
	salt := "test-salt"
	raw, _, _ := Generate()

	h1 := Hash(salt, raw)
	h2 := Hash(salt, raw)
	if h1 != h2 {
		t.Errorf("hash not deterministic")
	}
	if !Verify(salt, raw, h1) {
		t.Errorf("Verify(correct) = false")
	}
	if Verify(salt, raw+"x", h1) {
		t.Errorf("Verify(wrong key) = true")
	}
	if Verify(salt+"x", raw, h1) {
		t.Errorf("Verify(wrong salt) = true")
	}
}

func TestExtractPrefix(t *testing.T) {
	cases := []struct {
		name    string
		input   string
		want    string
		wantErr bool
	}{
		{"valid", "orb_abcdefghxyz123", "orb_abcde", false},
		{"too short", "orb_abc", "", true},
		{"wrong prefix", "key_abcdefghxyz123", "", true},
	}
	for _, c := range cases {
		t.Run(c.name, func(t *testing.T) {
			got, err := ExtractPrefix(c.input)
			if c.wantErr {
				if err == nil {
					t.Errorf("expected error, got nil")
				}
				return
			}
			if err != nil {
				t.Errorf("unexpected error: %v", err)
			}
			if len(got) != prefixLen {
				t.Errorf("len = %d, want %d", len(got), prefixLen)
			}
		})
	}
}
