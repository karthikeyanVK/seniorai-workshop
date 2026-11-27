import { app, HttpRequest, HttpResponseInit, InvocationContext, Timer } from "@azure/functions";
import { loadConfig, requireAudience } from "../config";
import { makeLogger } from "../logger";
import { runIngestion } from "../ingest";

requireAudience(); // throws at worker indexing => `func start` fails when AUDIENCE_NAME is missing/invalid

// Timer: NCRONTAB from INGEST_SCHEDULE (default every 6 hours).
app.timer("ingestTimer", {
  schedule: "%INGEST_SCHEDULE%",
  runOnStartup: true, // fire once on every host start (func start / cold start / deploy), then follow schedule
  handler: async (_t: Timer, ctx: InvocationContext) => {
    const cfg = loadConfig();
    const log = makeLogger(cfg.logLevel, { invocationId: ctx.invocationId, trigger: "timer" });
    const s = await runIngestion(cfg, log);
    if (s.failed > 0) throw new Error(`${s.failed} document(s) failed; see logs`); // surfaces in App Insights; next run retries
  },
});

// HTTP: POST /api/ingest[?force=true]  (function-key protected)
app.http("ingestHttp", {
  methods: ["POST"],
  authLevel: "function",
  route: "ingest",
  handler: async (req: HttpRequest, ctx: InvocationContext): Promise<HttpResponseInit> => {
    try {
      const cfg = loadConfig();
      const log = makeLogger(cfg.logLevel, { invocationId: ctx.invocationId, trigger: "http" });
      const s = await runIngestion(cfg, log, { force: req.query.get("force") === "true" });
      return { status: s.failed ? 207 : 200, jsonBody: s };
    } catch (e) {
      ctx.error(e);
      return { status: 500, jsonBody: { error: (e as Error).message } };
    }
  },
});
