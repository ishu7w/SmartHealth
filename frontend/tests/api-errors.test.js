import { test } from "node:test";
import assert from "node:assert/strict";
import { apiErrorMessage } from "../src/services/apiErrors.js";

test("permission and server errors are distinguished from connection failures", () => {
  assert.match(
    apiErrorMessage({ response: { status: 403, data: {} } }),
    /permission/,
  );
  assert.match(
    apiErrorMessage({ response: { status: 500, data: {} } }),
    /complete this request/,
  );
  assert.match(
    apiErrorMessage(new Error("Network Error")),
    /reach the healthcare server/,
  );
  assert.match(
    apiErrorMessage(new Error("Invalid API response")),
    /unexpected response/,
  );
  assert.match(
    apiErrorMessage(new Error("Invalid CSRF response")),
    /unexpected response/,
  );
});
test("only nonempty string messages from the server are shown", () => {
  assert.equal(
    apiErrorMessage({
      response: { status: 409, data: { message: "Refresh appointment" } },
    }),
    "Refresh appointment",
  );
  assert.match(
    apiErrorMessage({ response: { status: 403, data: { message: {} } } }),
    /permission/,
  );
  assert.match(
    apiErrorMessage({ response: { status: 401, data: { message: " " } } }),
    /sign in/,
  );
});
