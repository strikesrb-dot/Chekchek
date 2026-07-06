// Central runtime configuration. Everything overridable via environment variables
// so tests and the simulator can run with fast timers on any port.

export const config = {
  httpPort: intEnv('CHEKCHEK_HTTP_PORT', 8080),
  osmandPort: intEnv('CHEKCHEK_OSMAND_PORT', 5055),
  gt06Port: intEnv('CHEKCHEK_GT06_PORT', 5023),

  // Dispatch behaviour
  offerTimeoutMs: intEnv('CHEKCHEK_OFFER_TIMEOUT_MS', 15_000),
  requeueDelayMs: intEnv('CHEKCHEK_REQUEUE_DELAY_MS', 10_000),
  maxOfferCandidates: intEnv('CHEKCHEK_MAX_CANDIDATES', 20),

  // A vehicle that hasn't reported for this long is treated as stale/offline.
  staleAfterMs: intEnv('CHEKCHEK_STALE_AFTER_MS', 120_000),
};

function intEnv(name, fallback) {
  const raw = process.env[name];
  const value = raw === undefined ? NaN : Number.parseInt(raw, 10);
  return Number.isFinite(value) ? value : fallback;
}
