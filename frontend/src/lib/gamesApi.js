import { apiGet, apiPost, api } from "@/lib/api";

export async function fetchGames() {
  return apiGet("/games");
}
export async function fetchStats() {
  return apiGet("/games/stats");
}
export async function fetchGameSave(key) {
  return apiGet(`/games/${key}/save`);
}
export async function putGameSave(key, payload) {
  const res = await api.put(`/games/${key}/save`, payload);
  return res.data;
}
export async function startGame(key) {
  return apiPost(`/games/${key}/start`);
}
export async function completeGame(key, payload) {
  return apiPost(`/games/${key}/complete`, payload);
}
export async function restartGame(key) {
  return apiPost(`/games/${key}/restart`);
}
export async function fetchAchievements() {
  return apiGet("/games/achievements");
}
export async function unlockAchievement(payload) {
  return apiPost("/games/achievements/unlock", payload);
}
export async function fetchQuizQuestions() {
  return apiGet("/games/quiz/questions");
}
export async function putEvidence(key, payload) {
  const res = await api.put(`/games/case-1709/evidence/${key}`, payload);
  return res.data;
}
export async function fetchCaseContent() {
  return apiGet("/games/case-1709/content");
}
