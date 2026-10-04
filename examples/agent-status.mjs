// Selected function from Assistant S. Only the nighttime label is generalised.
// All input state and character lines in this repository are synthetic.
const RECENT_MS = 10 * 60 * 1000;

export function agentStatus({
  agent,
  needs,
  tasks,
  brains,
  threadLast,
  now = new Date(),
}) {
  const t = now.getTime();
  const mine = needs.filter((n) => n.agent === agent.id);
  const running = tasks.find(
    (x) => x.agent === agent.id && ["running", "queued"].includes(x.status),
  );
  const anyReady = agent.brainPref.some((b) => brains[b]?.ready);
  const lastDone = [...tasks]
    .reverse()
    .find((x) => x.agent === agent.id && x.status === "done");
  const lastFail = [...tasks]
    .reverse()
    .find((x) => x.agent === agent.id && x.status === "error");
  const recentFail =
    lastFail &&
    t - (lastFail.endedAt || 0) < 15 * 60000 &&
    (!lastDone || lastFail.endedAt > lastDone.endedAt);
  const hour = now.getHours();
  const lastActive = Math.max(
    threadLast || 0,
    lastDone?.endedAt || 0,
    lastFail?.endedAt || 0,
  );

  let state = "idle";
  if (running) state = "working";
  else if (!anyReady) state = "offline";
  else if (recentFail) state = "error";
  else if (mine.some((n) => n.level !== "info")) state = "waiting";

  let mood = "calm";
  if (state === "working") mood = "focused";
  else if (state === "offline" || state === "error") mood = "worried";
  else if (lastDone && t - (lastDone.endedAt || 0) < RECENT_MS) mood = "happy";
  else if (
    hour >= 23 ||
    hour < 6 ||
    (lastActive && t - lastActive > 3 * 3600000 && !mine.length)
  )
    mood = "sleepy";

  const pool = agent.lines?.[mood] || agent.lines?.calm || [""];
  let line = pool[Math.floor(t / 600000) % pool.length];
  if (state === "waiting") line = mine[0].text;
  if (state === "error")
    line = mine.find((n) => n.level === "alert")?.text || line;
  if (state === "offline")
    line =
      mine.find((n) => n.level === "alert")?.text ||
      agent.lines?.worried?.[0] ||
      line;

  const halo = {
    working: "mint",
    waiting: "gold",
    error: "pink",
    offline: "grey",
    idle: "lavender",
  }[state];
  return {
    id: agent.id,
    state,
    mood,
    halo,
    line,
    needs: mine.length,
    taskId: running?.id || null,
    lastActiveAt: lastActive || null,
    sleepyBecause:
      mood === "sleepy"
        ? hour >= 23 || hour < 6
          ? "night hours"
          : "idle for a while"
        : null,
  };
}
