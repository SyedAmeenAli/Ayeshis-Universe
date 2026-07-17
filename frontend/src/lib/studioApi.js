import axios from "axios";
import { API, apiGet } from "@/lib/api";

export const studioApi = axios.create({ baseURL: API, withCredentials: true });

export function studioLogin(pin) {
  return studioApi.post("/studio/login", { pin }).then((r) => r.data);
}

export function studioLogout() {
  return studioApi.post("/studio/logout").then((r) => r.data);
}

export function fetchStudioMe() {
  return studioApi.get("/studio/me").then((r) => r.data);
}

export function fetchStudioDashboard() {
  return studioApi.get("/studio/dashboard").then((r) => r.data);
}

export function fetchFeatureFlagsPublic() {
  // GET /studio/feature-flags has no studio-auth dependency — it's a
  // public read so regular Ayesha-facing pages can check if a feature
  // is currently switched off.
  return apiGet("/studio/feature-flags");
}

export function updateFeatureFlags(payload) {
  return studioApi.put("/studio/feature-flags", payload).then((r) => r.data);
}

export function fetchStudioQuiz() {
  return studioApi.get("/studio/quiz/questions").then((r) => r.data);
}

export function updateStudioQuizQuestion(key, payload) {
  return studioApi.put(`/studio/quiz/questions/${key}`, payload).then((r) => r.data);
}
