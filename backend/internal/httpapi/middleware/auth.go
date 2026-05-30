package middleware

import (
	"net/http"
	"strings"

	"github.com/Rioh1118/orbit/backend/internal/auth"
	"github.com/Rioh1118/orbit/backend/internal/httpapi/response"
	"github.com/Rioh1118/orbit/backend/internal/repo"
)

func APIKeyAuth(users *repo.UserRepo, salt string) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			header := r.Header.Get("Authorization")
			if !strings.HasPrefix(header, "Bearer ") {
				response.Error(w, http.StatusUnauthorized, "UNAUTHENTICATED", "missing bearer token", nil)
				return
			}
			raw := strings.TrimPrefix(header, "Bearer ")
			prefix, err := auth.ExtractPrefix(raw)
			if err != nil {
				response.Error(w, http.StatusUnauthorized, "UNAUTHENTICATED", "invalid api key format", nil)
				return
			}
			u, err := users.GetByAPIKeyPrefix(r.Context(), prefix)
			if err != nil {
				response.Error(w, http.StatusUnauthorized, "UNAUTHENTICATED", "invalid api key", nil)
				return
			}
			if !auth.Verify(salt, raw, u.APIKeyHash) {
				response.Error(w, http.StatusUnauthorized, "UNAUTHENTICATED", "invalid api key", nil)
				return
			}
			next.ServeHTTP(w, r.WithContext(WithUserID(r.Context(), u.ID)))
		})
	}
}
