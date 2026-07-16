import axios from "axios";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
export const API = `${BACKEND_URL}/api`;

export const api = axios.create({
  baseURL: API,
  withCredentials: true,
});

export async function apiGet(path) {
  const res = await api.get(path);
  return res.data;
}

export async function apiPost(path, body) {
  const res = await api.post(path, body ?? {});
  return res.data;
}
