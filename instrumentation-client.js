import * as Sentry from "@sentry/nextjs";
import {
  beforeBreadcrumbPrivacy,
  beforeSendPrivacy,
} from "./lib/sentry/privacy";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  enabled: Boolean(process.env.NEXT_PUBLIC_SENTRY_DSN),
  environment: process.env.NEXT_PUBLIC_SENTRY_ENVIRONMENT || process.env.NODE_ENV,

  sendDefaultPii: false,
  tracesSampleRate: 0,
  replaysSessionSampleRate: 0,
  replaysOnErrorSampleRate: 0,
  maxBreadcrumbs: 0,
  enableLogs: false,

  beforeBreadcrumb: beforeBreadcrumbPrivacy,
  beforeSend: beforeSendPrivacy,
});

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
