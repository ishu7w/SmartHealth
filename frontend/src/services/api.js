import axios from "axios";

const client = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "/api",
  withCredentials: true,
  timeout: 120000,
});
let csrf;
export async function request(path, method = "GET", data) {
  try {
    if (method !== "GET" && !csrf) {
      csrf = (await client.get("/auth/csrf")).data;
      if (!csrf?.token || !csrf?.headerName) {
        csrf = undefined;
        throw new Error("Invalid CSRF response");
      }
    }
    const response = await client.request({
      url: path,
      method,
      data,
      headers: method === "GET" ? {} : { [csrf.headerName]: csrf.token },
    });
    if (
      response.status !== 204 &&
      !response.headers["content-type"]?.includes("application/json")
    )
      throw new Error("Invalid API response");
    return response.data;
  } catch (error) {
    const failure = new Error(
      error.response?.data?.message ||
        (error.response?.status === 401
          ? "Please sign in to continue."
          : "Could not reach the healthcare server. Please retry."),
    );
    failure.status = error.response?.status;
    if (failure.status === 403) csrf = undefined;
    throw failure;
  }
}
export async function login(email, password) {
  await request(
    "/auth/login",
    "POST",
    new URLSearchParams({ username: email.trim().toLowerCase(), password }),
  );
  csrf = undefined;
  return request("/auth/me");
}
export async function logout() {
  await request("/auth/logout", "POST");
  csrf = undefined;
}
