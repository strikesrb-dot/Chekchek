// Boot: wire the store, dispatch engine, and the three ingestion/serving
// surfaces together. No logic lives here — see the individual modules.

import { config } from './config.js';
import { createStore } from './store.js';
import { createDispatch } from './dispatch.js';
import { createApi } from './api.js';
import { createArdoiseApi } from './ardoise-api.js';
import { startHttpServer } from './http.js';
import { startOsmandServer } from './osmand.js';
import { startGt06Server } from './gt06-server.js';

const store = createStore();
const dispatch = createDispatch(store, config);
const trackingApi = createApi(store, dispatch);
const ardoiseApi = createArdoiseApi();

// One handler surface: Ardoise receivables routes, then the tracking routes.
const api = { handle: (m, p, b) => ardoiseApi.handle(m, p, b) ?? trackingApi.handle(m, p, b) };

startHttpServer(store, api, config.httpPort);
startOsmandServer(store, config.osmandPort);
startGt06Server(store, config.gt06Port);

console.log('[chekchek] prototype up — multi-modal tracking + dispatch core');
