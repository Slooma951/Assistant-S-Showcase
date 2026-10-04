import { agentStatus } from "./agent-status.mjs";
const now = new Date(2026, 9, 4, 12);
const agent = {
  id: "demo",
  brainPref: ["mock"],
  lines: { focused: ["Working on your task."], calm: ["Ready."] },
};
const result = agentStatus({
  agent,
  now,
  needs: [],
  tasks: [{ id: "mock-task", agent: "demo", status: "running" }],
  brains: { mock: { ready: true } },
});
console.log(
  JSON.stringify(
    {
      fixture: "synthetic state, no connected accounts",
      state: result.state,
      mood: result.mood,
      halo: result.halo,
      taskId: result.taskId,
    },
    null,
    2,
  ),
);
