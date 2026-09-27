// This file configures the initialization of Sentry on the server.
// The config you add here will be used whenever the server handles a request.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: "https://bbfc20852c39f2cce319ea9ffb99c7d1@o4512157150609408.ingest.us.sentry.io/4512157154934784",

  // Define how likely traces are sampled. Adjust this value in production, or use tracesSampler for greater control.
  tracesSampleRate: 1,

  // Restrict beyond the SDK defaults so no request data (session cookie, Authorization
  // header used by the cron route, request/response bodies, OAuth code/state) leaves the server.
  // See: https://docs.sentry.io/platforms/javascript/guides/nextjs/configuration/options/#dataCollection
  dataCollection: {
    userInfo: false,
    cookies: false,
    httpHeaders: { deny: ['authorization', 'cookie', 'set-cookie'] },
    httpBodies: [],
    urlQueryParams: { deny: ['code', 'state', 'token', 'access_token', 'id_token'] },
  },
});
