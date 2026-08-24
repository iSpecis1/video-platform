import axios from "axios";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
export const API = `${BACKEND_URL}/api`;

export const http = axios.create({ baseURL: API });

export const api = {
  categories: (learn_mode) => http.get("/categories", { params: { learn_mode } }).then((r) => r.data),
  me: () => http.get("/me").then((r) => r.data),
  listVideos: (params = {}) => http.get("/videos", { params }).then((r) => r.data),
  getVideo: (id) => http.get(`/videos/${id}`).then((r) => r.data),
  recommended: (id, learn_mode) => http.get(`/videos/${id}/recommended`, { params: { learn_mode } }).then((r) => r.data),
  comments: (id) => http.get(`/videos/${id}/comments`).then((r) => r.data),
  listClips: (learn_mode) => http.get("/clips", { params: { learn_mode } }).then((r) => r.data),
  listChannels: () => http.get("/channels").then((r) => r.data),
  getChannel: (handle) => http.get(`/channels/${handle}`).then((r) => r.data),
  channelVideos: (handle, learn_mode) => http.get(`/channels/${handle}/videos`, { params: { learn_mode } }).then((r) => r.data),
  channelClips: (handle, learn_mode) => http.get(`/channels/${handle}/clips`, { params: { learn_mode } }).then((r) => r.data),
  search: (q, learn_mode, type = "all") => http.get("/search", { params: { q, learn_mode, type } }).then((r) => r.data),
  followingFeed: (learn_mode) => http.get("/following/feed", { params: { learn_mode } }).then((r) => r.data),
  follows: () => http.get("/follows").then((r) => r.data),
  toggleFollow: (channel_handle, follow) => http.post("/follows", { channel_handle, follow }).then((r) => r.data),
  likes: () => http.get("/likes").then((r) => r.data),
  toggleLike: (video_id, liked) => http.post("/likes", { video_id, liked }).then((r) => r.data),
  history: () => http.get("/history").then((r) => r.data),
  addHistory: (id) => http.post(`/history/${id}`).then((r) => r.data),
  upload: (payload) => http.post("/upload", payload).then((r) => r.data),
  updateAccount: (id, patch) => http.put(`/accounts/${id}`, patch).then((r) => r.data),
  createChannel: (payload) => http.post("/channels", payload).then((r) => r.data),
  updateChannel: (handle, patch) => http.put(`/channels/${handle}`, patch).then((r) => r.data),
};
