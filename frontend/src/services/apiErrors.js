export function apiErrorMessage(error) {
  const message = error.response?.data?.message;
  if (typeof message === "string" && message.trim()) return message;
  const status = error.response?.status;
  const messages = {
    401: "Please sign in to continue.",
    403: "You do not have permission to perform this action.",
    409: "This record changed or conflicts with another record. Refresh and try again.",
    429: "Too many requests. Please wait before trying again.",
  };
  if (messages[status]) return messages[status];
  if (["Invalid API response", "Invalid CSRF response"].includes(error.message))
    return "The server returned an unexpected response. Please check the server address.";
  if (error.response)
    return "The server could not complete this request. Please retry.";
  return "Could not reach the healthcare server. Please retry.";
}
