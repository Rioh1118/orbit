package handlers

import (
	"encoding/json"
	"errors"
	"net/http"
	"strconv"
	"time"

	"github.com/Rioh1118/orbit/backend/internal/domain/workslice"
	appmw "github.com/Rioh1118/orbit/backend/internal/httpapi/middleware"
	"github.com/Rioh1118/orbit/backend/internal/httpapi/response"
	"github.com/Rioh1118/orbit/backend/internal/repo"
	"github.com/Rioh1118/orbit/backend/internal/service"
	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"
)

type WorkSliceHandler struct {
	svc *service.WorkSliceService
}

func NewWorkSliceHandler(svc *service.WorkSliceService) *WorkSliceHandler {
	return &WorkSliceHandler{svc: svc}
}

func (h *WorkSliceHandler) Routes() http.Handler {
	r := chi.NewRouter()
	r.Get("/", h.list)
	r.Get("/active", h.active)
	r.Get("/current", h.current)
	r.Post("/start", h.start)
	r.Post("/start-off", h.startOff)
	r.Post("/stop", h.stop)
	r.Post("/{id}/end", h.end)
	r.Patch("/{id}", h.update)
	r.Delete("/{id}", h.delete)
	return r
}

type workSliceDTO struct {
	ID          uuid.UUID  `json:"id"`
	TaskID      *uuid.UUID `json:"task_id"`
	Type        string     `json:"type"`
	Mode        string     `json:"mode"`
	Driver      string     `json:"driver"`
	OffReason   string     `json:"off_reason"`
	StartedAt   string     `json:"started_at"`
	EndedAt     *string    `json:"ended_at"`
	DurationSec *int       `json:"duration_sec"`
	Note        string     `json:"note"`
	CreatedAt   string     `json:"created_at"`
	UpdatedAt   string     `json:"updated_at"`
}

func wsToDTO(w *workslice.WorkSlice) workSliceDTO {
	return workSliceDTO{
		ID:          w.ID,
		TaskID:      w.TaskID,
		Type:        string(w.Type),
		Mode:        string(w.Mode),
		Driver:      string(w.Driver),
		OffReason:   string(w.OffReason),
		StartedAt:   w.StartedAt.UTC().Format(time.RFC3339),
		EndedAt:     fmtTimePtr(w.EndedAt),
		DurationSec: w.DurationSec,
		Note:        w.Note,
		CreatedAt:   w.CreatedAt.UTC().Format(time.RFC3339),
		UpdatedAt:   w.UpdatedAt.UTC().Format(time.RFC3339),
	}
}

func parseRFC3339Ptr(s string) (*time.Time, error) {
	if s == "" {
		return nil, nil
	}
	t, err := time.Parse(time.RFC3339, s)
	if err != nil {
		return nil, err
	}
	return &t, nil
}

// isWSValidationErr maps domain validation errors to a 400.
func isWSValidationErr(err error) bool {
	return errors.Is(err, workslice.ErrInvalidType) ||
		errors.Is(err, workslice.ErrInvalidMode) ||
		errors.Is(err, workslice.ErrInvalidDriver) ||
		errors.Is(err, workslice.ErrInvalidOffReason) ||
		errors.Is(err, workslice.ErrLayerMismatch) ||
		errors.Is(err, workslice.ErrNoteTooLong) ||
		errors.Is(err, workslice.ErrEndBeforeStart)
}

func (h *WorkSliceHandler) list(w http.ResponseWriter, r *http.Request) {
	uid, _ := appmw.UserIDFromCtx(r.Context())
	q := r.URL.Query()
	limit, _ := strconv.Atoi(q.Get("limit"))
	offset, _ := strconv.Atoi(q.Get("offset"))

	var taskID *uuid.UUID
	if s := q.Get("task_id"); s != "" {
		id, err := uuid.Parse(s)
		if err != nil {
			response.Error(w, http.StatusBadRequest, "VALIDATION_FAILED", "invalid task_id", nil)
			return
		}
		taskID = &id
	}

	var mode *workslice.Mode
	if s := q.Get("mode"); s != "" {
		m := workslice.Mode(s)
		if !m.Valid() {
			response.Error(w, http.StatusBadRequest, "VALIDATION_FAILED", "invalid mode", nil)
			return
		}
		mode = &m
	}

	from, err := parseRFC3339Ptr(q.Get("from"))
	if err != nil {
		response.Error(w, http.StatusBadRequest, "VALIDATION_FAILED", "invalid from", nil)
		return
	}
	to, err := parseRFC3339Ptr(q.Get("to"))
	if err != nil {
		response.Error(w, http.StatusBadRequest, "VALIDATION_FAILED", "invalid to", nil)
		return
	}

	slices, total, err := h.svc.List(r.Context(), service.WSListInput{
		UserID: uid, TaskID: taskID, Mode: mode, From: from, To: to, Limit: limit, Offset: offset,
	})
	if err != nil {
		response.Error(w, http.StatusInternalServerError, "INTERNAL_ERROR", err.Error(), nil)
		return
	}
	dtos := make([]workSliceDTO, len(slices))
	for i, s := range slices {
		dtos[i] = wsToDTO(s)
	}
	effectiveLimit := limit
	if effectiveLimit <= 0 {
		effectiveLimit = 50
	}
	response.List(w, http.StatusOK, dtos, response.MetaObj{
		Total: int(total), Limit: effectiveLimit, Offset: offset,
	})
}

func (h *WorkSliceHandler) active(w http.ResponseWriter, r *http.Request) {
	uid, _ := appmw.UserIDFromCtx(r.Context())
	slices, err := h.svc.ListActive(r.Context(), uid)
	if err != nil {
		response.Error(w, http.StatusInternalServerError, "INTERNAL_ERROR", err.Error(), nil)
		return
	}
	dtos := make([]workSliceDTO, len(slices))
	for i, s := range slices {
		dtos[i] = wsToDTO(s)
	}
	response.Success(w, http.StatusOK, dtos)
}

// current returns the single open segment, or null when not working.
func (h *WorkSliceHandler) current(w http.ResponseWriter, r *http.Request) {
	uid, _ := appmw.UserIDFromCtx(r.Context())
	cur, err := h.svc.Current(r.Context(), uid)
	if err != nil {
		response.Error(w, http.StatusInternalServerError, "INTERNAL_ERROR", err.Error(), nil)
		return
	}
	if cur == nil {
		response.Success(w, http.StatusOK, nil)
		return
	}
	response.Success(w, http.StatusOK, wsToDTO(cur))
}

type startReq struct {
	Mode   string  `json:"mode"`
	Driver string  `json:"driver"`
	TaskID *string `json:"task_id"`
	Note   string  `json:"note"`
}

func (h *WorkSliceHandler) start(w http.ResponseWriter, r *http.Request) {
	uid, _ := appmw.UserIDFromCtx(r.Context())
	var req startReq
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		response.Error(w, http.StatusBadRequest, "VALIDATION_FAILED", "invalid json", nil)
		return
	}
	var taskID *uuid.UUID
	if req.TaskID != nil && *req.TaskID != "" {
		id, err := uuid.Parse(*req.TaskID)
		if err != nil {
			response.Error(w, http.StatusBadRequest, "VALIDATION_FAILED", "invalid task_id", nil)
			return
		}
		taskID = &id
	}
	mode := workslice.Mode(req.Mode)
	if !mode.Valid() {
		response.Error(w, http.StatusBadRequest, "VALIDATION_FAILED", "invalid mode", map[string]any{"field": "mode"})
		return
	}
	driver := workslice.Driver(req.Driver)
	if req.Driver != "" && !driver.Valid() {
		response.Error(w, http.StatusBadRequest, "VALIDATION_FAILED", "invalid driver", map[string]any{"field": "driver"})
		return
	}
	slice, err := h.svc.Start(r.Context(), service.WSStartInput{
		UserID: uid, TaskID: taskID, Mode: mode, Driver: driver, Note: req.Note,
	})
	if err != nil {
		if errors.Is(err, repo.ErrOpenSegmentConflict) {
			response.Error(w, http.StatusConflict, "CONFLICT", "another segment is already open", nil)
			return
		}
		if isWSValidationErr(err) {
			response.Error(w, http.StatusBadRequest, "VALIDATION_FAILED", err.Error(), nil)
			return
		}
		response.Error(w, http.StatusInternalServerError, "INTERNAL_ERROR", "could not start segment", nil)
		return
	}
	response.Success(w, http.StatusCreated, wsToDTO(slice))
}

type startOffReq struct {
	Reason string `json:"reason"`
	Note   string `json:"note"`
}

func (h *WorkSliceHandler) startOff(w http.ResponseWriter, r *http.Request) {
	uid, _ := appmw.UserIDFromCtx(r.Context())
	var req startOffReq
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		response.Error(w, http.StatusBadRequest, "VALIDATION_FAILED", "invalid json", nil)
		return
	}
	reason := workslice.OffReason(req.Reason)
	if !reason.Valid() {
		response.Error(w, http.StatusBadRequest, "VALIDATION_FAILED", "invalid reason", map[string]any{"field": "reason"})
		return
	}
	slice, err := h.svc.StartOff(r.Context(), service.WSStartOffInput{UserID: uid, Reason: reason, Note: req.Note})
	if err != nil {
		if errors.Is(err, repo.ErrOpenSegmentConflict) {
			response.Error(w, http.StatusConflict, "CONFLICT", "another segment is already open", nil)
			return
		}
		if isWSValidationErr(err) {
			response.Error(w, http.StatusBadRequest, "VALIDATION_FAILED", err.Error(), nil)
			return
		}
		response.Error(w, http.StatusInternalServerError, "INTERNAL_ERROR", "could not start segment", nil)
		return
	}
	response.Success(w, http.StatusCreated, wsToDTO(slice))
}

// stop closes the open segment without opening a new one ("作業終了").
func (h *WorkSliceHandler) stop(w http.ResponseWriter, r *http.Request) {
	uid, _ := appmw.UserIDFromCtx(r.Context())
	slice, err := h.svc.Stop(r.Context(), uid)
	if err != nil {
		response.Error(w, http.StatusInternalServerError, "INTERNAL_ERROR", err.Error(), nil)
		return
	}
	if slice == nil {
		response.Success(w, http.StatusOK, nil)
		return
	}
	response.Success(w, http.StatusOK, wsToDTO(slice))
}

func (h *WorkSliceHandler) end(w http.ResponseWriter, r *http.Request) {
	uid, _ := appmw.UserIDFromCtx(r.Context())
	id, err := uuid.Parse(chi.URLParam(r, "id"))
	if err != nil {
		response.Error(w, http.StatusBadRequest, "VALIDATION_FAILED", "invalid id", nil)
		return
	}
	slice, err := h.svc.End(r.Context(), service.WSEndInput{ID: id, UserID: uid})
	if err != nil {
		if errors.Is(err, repo.ErrWorkSliceNotFound) {
			response.Error(w, http.StatusNotFound, "NOT_FOUND", "work slice not found", nil)
			return
		}
		if errors.Is(err, workslice.ErrAlreadyEnded) {
			response.Error(w, http.StatusConflict, "CONFLICT", err.Error(), nil)
			return
		}
		if isWSValidationErr(err) {
			response.Error(w, http.StatusBadRequest, "VALIDATION_FAILED", err.Error(), nil)
			return
		}
		response.Error(w, http.StatusInternalServerError, "INTERNAL_ERROR", err.Error(), nil)
		return
	}
	response.Success(w, http.StatusOK, wsToDTO(slice))
}

type wsUpdateReq struct {
	Mode      *string `json:"mode"`
	Driver    *string `json:"driver"`
	TaskID    *string `json:"task_id"`
	StartedAt *string `json:"started_at"`
	EndedAt   *string `json:"ended_at"`
	Note      *string `json:"note"`
}

func (h *WorkSliceHandler) update(w http.ResponseWriter, r *http.Request) {
	uid, _ := appmw.UserIDFromCtx(r.Context())
	id, err := uuid.Parse(chi.URLParam(r, "id"))
	if err != nil {
		response.Error(w, http.StatusBadRequest, "VALIDATION_FAILED", "invalid id", nil)
		return
	}
	var req wsUpdateReq
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		response.Error(w, http.StatusBadRequest, "VALIDATION_FAILED", "invalid json", nil)
		return
	}
	in := service.WSUpdateInput{ID: id, UserID: uid, Note: req.Note}
	if req.Mode != nil {
		m := workslice.Mode(*req.Mode)
		in.Mode = &m
	}
	if req.Driver != nil {
		d := workslice.Driver(*req.Driver)
		in.Driver = &d
	}
	if req.TaskID != nil {
		if *req.TaskID == "" {
			in.ClearTaskID = true
		} else {
			tid, err := uuid.Parse(*req.TaskID)
			if err != nil {
				response.Error(w, http.StatusBadRequest, "VALIDATION_FAILED", "invalid task_id", nil)
				return
			}
			in.TaskID = &tid
		}
	}
	if req.StartedAt != nil {
		t, err := time.Parse(time.RFC3339, *req.StartedAt)
		if err != nil {
			response.Error(w, http.StatusBadRequest, "VALIDATION_FAILED", "invalid started_at", nil)
			return
		}
		in.StartedAt = &t
	}
	if req.EndedAt != nil {
		t, err := time.Parse(time.RFC3339, *req.EndedAt)
		if err != nil {
			response.Error(w, http.StatusBadRequest, "VALIDATION_FAILED", "invalid ended_at", nil)
			return
		}
		in.EndedAt = &t
	}
	slice, err := h.svc.Update(r.Context(), in)
	if err != nil {
		if errors.Is(err, repo.ErrWorkSliceNotFound) {
			response.Error(w, http.StatusNotFound, "NOT_FOUND", "work slice not found", nil)
			return
		}
		if isWSValidationErr(err) {
			response.Error(w, http.StatusBadRequest, "VALIDATION_FAILED", err.Error(), nil)
			return
		}
		response.Error(w, http.StatusInternalServerError, "INTERNAL_ERROR", err.Error(), nil)
		return
	}
	response.Success(w, http.StatusOK, wsToDTO(slice))
}

func (h *WorkSliceHandler) delete(w http.ResponseWriter, r *http.Request) {
	uid, _ := appmw.UserIDFromCtx(r.Context())
	id, err := uuid.Parse(chi.URLParam(r, "id"))
	if err != nil {
		response.Error(w, http.StatusBadRequest, "VALIDATION_FAILED", "invalid id", nil)
		return
	}
	if err := h.svc.Delete(r.Context(), id, uid); err != nil {
		response.Error(w, http.StatusInternalServerError, "INTERNAL_ERROR", err.Error(), nil)
		return
	}
	w.WriteHeader(http.StatusNoContent)
}
