/** Task title validation (brief §7.12.4: empty input shows inline error, never silent). */

export const MAX_TASK_TITLE_LENGTH = 200;

export type TitleValidation =
  | { ok: true; value: string }
  | { ok: false; error: string };

export function validateTaskTitle(raw: string): TitleValidation {
  const value = raw.trim();
  if (value === "") {
    return { ok: false, error: "タイトルを入力してください" };
  }
  if (value.length > MAX_TASK_TITLE_LENGTH) {
    return { ok: false, error: `タイトルは${MAX_TASK_TITLE_LENGTH}文字以内で入力してください` };
  }
  return { ok: true, value };
}
