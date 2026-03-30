import axios from "axios";

const BASE_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:4000";
const API = axios.create({
  baseURL: `${BASE_URL}/api/auth`
});

export const signup = (data) => API.post("/signup", data);
export const login = (data) => API.post("/login", data);

export const getProfile = (token) => API.get("/profile", {
  headers: { Authorization: `Bearer ${token}` }
});

export const updateProfile = (data, token) => API.put("/update-profile", data, {
  headers: { Authorization: `Bearer ${token}` }
});

export const updatePassword = (data, token) => API.put("/update-password", data, {
  headers: { Authorization: `Bearer ${token}` }
});

export const forgotPassword = (email) => API.post("/forgot-password", { email });