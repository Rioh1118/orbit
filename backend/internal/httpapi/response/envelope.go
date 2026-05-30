package response

import (
	"encoding/json"
	"log/slog"
	"net/http"
)

type Envelope struct {
	Data  any      `json:"data"`
	Error *APIErr  `json:"error"`
	Meta  *MetaObj `json:"meta"`
}

type APIErr struct {
	Code    string         `json:"code"`
	Message string         `json:"message"`
	Details map[string]any `json:"details,omitempty"`
}

type MetaObj struct {
	Total  int `json:"total"`
	Limit  int `json:"limit"`
	Offset int `json:"offset"`
}

func Success(w http.ResponseWriter, status int, data any) {
	write(w, status, Envelope{Data: data})
}

func List(w http.ResponseWriter, status int, data any, meta MetaObj) {
	write(w, status, Envelope{Data: data, Meta: &meta})
}

func Error(w http.ResponseWriter, status int, code, message string, details map[string]any) {
	write(w, status, Envelope{Error: &APIErr{Code: code, Message: message, Details: details}})
}

func write(w http.ResponseWriter, status int, body Envelope) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	if err := json.NewEncoder(w).Encode(body); err != nil {
		slog.Error("failed to encode response", "error", err)
	}
}
