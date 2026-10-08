import { expect, test } from "bun:test";
import { hasLocation, href, pick, safeUrl, stateLabel } from "./params";
import { isMcpPath, isNamespacePath, shouldPassThrough } from "./passthrough";
import { toSearch } from "./upstream";

test("pick keeps only allowed keys, trims, joins repeated values", () => {
  expect(pick({ zip: " 95032 ", token: "secret", type: ["branch", "central"], q: "" }, ["zip", "type", "q"])).toEqual({
    zip: "95032",
    type: "branch,central",
  });
});

test("pick caps a value at 200 characters", () => {
  expect(pick({ q: "x".repeat(500) }, ["q"]).q.length).toBe(200);
});

test("hasLocation needs a usable location", () => {
  expect(hasLocation({ zip: "95032" })).toBe(true);
  expect(hasLocation({ city: "Los Gatos" })).toBe(false);
  expect(hasLocation({ city: "Los Gatos", state: "CA" })).toBe(true);
  expect(hasLocation({ lat: "37.2" })).toBe(false);
});

test("href changes one parameter and drops the cursor unless it is the change", () => {
  const p = { zip: "95032", cursor: "abc" };
  expect(href("/lib", p, { type: "branch" })).toBe("/lib?zip=95032&type=branch");
  expect(href("/lib", p, { cursor: "next" })).toBe("/lib?zip=95032&cursor=next");
  expect(href("/lib", {})).toBe("/lib");
});

test("safeUrl allows http(s) and site paths only", () => {
  expect(safeUrl("https://www.irs.gov/")).toBe("https://www.irs.gov/");
  expect(safeUrl("/gov/us/irs")).toBe("/gov/us/irs");
  expect(safeUrl("javascript:alert(1)")).toBeNull();
  expect(safeUrl("//evil.example")).toBeNull();
  expect(safeUrl(null)).toBeNull();
});

test("capability states read as plain English", () => {
  expect(stateLabel("directory_only")).toBe("Directory and official links");
  expect(stateLabel("something_new")).toBe("something new");
});

test("toSearch drops empty values", () => {
  expect(toSearch({ zip: "95032", city: "", state: undefined })).toBe("?zip=95032");
  expect(toSearch()).toBe("");
});

test("namespace and MCP paths", () => {
  expect(isNamespacePath("/gov/us/irs")).toBe(true);
  expect(isNamespacePath("/government")).toBe(false);
  expect(isNamespacePath("/developers")).toBe(false);
  expect(isMcpPath("/lib/us/loc/mcp")).toBe(true);
  expect(isMcpPath("/mcp")).toBe(false);
});

test("browsers get pages; JSON clients, raw=1, POST and MCP pass through", () => {
  const html = "text/html,application/xhtml+xml,*/*;q=0.8";
  expect(shouldPassThrough("GET", "/lib", html, false)).toBe(false);
  expect(shouldPassThrough("GET", "/lib", "application/json", false)).toBe(true);
  expect(shouldPassThrough("GET", "/lib", html, true)).toBe(true);
  expect(shouldPassThrough("GET", "/lib", "*/*", false)).toBe(false);
  expect(shouldPassThrough("POST", "/lib/mcp", "application/json, text/event-stream", false)).toBe(true);
  expect(shouldPassThrough("GET", "/lib/mcp", html, false)).toBe(true);
  expect(shouldPassThrough("GET", "/developers", "application/json", false)).toBe(false);
});
