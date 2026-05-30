package auth

import (
	"crypto/rand"
	"crypto/sha256"
	"crypto/subtle"
	"encoding/base64"
	"encoding/hex"
	"errors"
	"strings"
)

const (
	KeyPrefix = "orb_"
	rawBytes  = 32
	prefixLen = 12 // "orb_" + 8 chars
)

var ErrInvalidFormat = errors.New("invalid api key format")

func Generate() (raw, prefix string, err error) {
	b := make([]byte, rawBytes)
	if _, err := rand.Read(b); err != nil {
		return "", "", err
	}
	raw = KeyPrefix + base64.RawURLEncoding.EncodeToString(b)
	prefix = raw[:prefixLen]
	return raw, prefix, nil
}

func Hash(salt, raw string) string {
	h := sha256.Sum256([]byte(salt + raw))
	return hex.EncodeToString(h[:])
}

func Verify(salt, raw, expectedHash string) bool {
	got := Hash(salt, raw)
	return subtle.ConstantTimeCompare([]byte(got), []byte(expectedHash)) == 1
}

func ExtractPrefix(raw string) (string, error) {
	if !strings.HasPrefix(raw, KeyPrefix) || len(raw) < prefixLen {
		return "", ErrInvalidFormat
	}
	return raw[:prefixLen], nil
}
