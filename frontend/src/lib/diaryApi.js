import { apiGet, apiPost, api } from "@/lib/api";

export function fetchDiaryStatus() {
  return apiGet("/diary/status");
}

export function unlockDiary(pin) {
  return apiPost("/diary/unlock", { pin });
}

export function fetchDiaryEntries() {
  return apiGet("/diary/entries");
}

export function createDiaryEntry(payload) {
  return apiPost("/diary/entries", payload);
}

export async function updateDiaryEntry(id, payload) {
  const res = await api.put(`/diary/entries/${id}`, payload);
  return res.data;
}

export async function deleteDiaryEntry(id) {
  const res = await api.delete(`/diary/entries/${id}`);
  return res.data;
}
