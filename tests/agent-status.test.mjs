import test from "node:test";
import assert from "node:assert/strict";
import { agentStatus } from "../examples/agent-status.mjs";
const now = new Date(2026, 9, 4, 12);
const base = () => ({
  now,
  agent: {
    id: "demo",
    brainPref: ["mock"],
    lines: { calm: ["Ready."], worried: ["Check status."] },
  },
  needs: [],
  tasks: [],
  brains: { mock: { ready: true } },
});
test("running work takes precedence over disconnected providers", () => {
  const r = agentStatus({
    ...base(),
    tasks: [{ id: "task", agent: "demo", status: "running" }],
    brains: {},
  });
  assert.equal(r.state, "working");
  assert.equal(r.mood, "focused");
  assert.equal(r.taskId, "task");
});
test("queued work is visible as work", () =>
  assert.equal(
    agentStatus({
      ...base(),
      tasks: [{ id: "q", agent: "demo", status: "queued" }],
    }).state,
    "working",
  ));
test("unavailable provider produces offline state", () =>
  assert.equal(agentStatus({ ...base(), brains: {} }).state, "offline"));
test("a recent failure produces error state", () =>
  assert.equal(
    agentStatus({
      ...base(),
      tasks: [
        { agent: "demo", status: "error", endedAt: now.getTime() - 1000 },
      ],
    }).state,
    "error",
  ));
test("a later success supersedes an older failure", () => {
  const r = agentStatus({
    ...base(),
    tasks: [
      { agent: "demo", status: "error", endedAt: now.getTime() - 2000 },
      { agent: "demo", status: "done", endedAt: now.getTime() - 1000 },
    ],
  });
  assert.equal(r.state, "idle");
  assert.equal(r.mood, "happy");
});
test("an actionable need produces a waiting state", () =>
  assert.equal(
    agentStatus({
      ...base(),
      needs: [{ agent: "demo", level: "ask", text: "Review the mock result." }],
    }).state,
    "waiting",
  ));
test("another agent task does not affect this agent", () =>
  assert.equal(
    agentStatus({ ...base(), tasks: [{ agent: "other", status: "running" }] })
      .state,
    "idle",
  ));
test("late hours change mood without inventing work", () => {
  const r = agentStatus({ ...base(), now: new Date(2026, 9, 4, 23) });
  assert.equal(r.state, "idle");
  assert.equal(r.mood, "sleepy");
});
