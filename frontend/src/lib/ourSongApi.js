import { apiGet, apiPost } from "@/lib/api";

export function fetchAudioConfig() {
  return apiGet("/config");
}

export function saveOurSongMoment(caption) {
  return apiPost("/our-song/save-moment", { caption });
}
