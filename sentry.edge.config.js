import * as Sentry from "@sentry/nextjs";
import {
  beforeBreadcrumbPrivacy,
  beforeSendPrivacy,
} from "./lib/sentry/privacy";

Sentry.init({
  dsn: process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN,
  enabled: Boolean(process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN),
  environment: process.env.NEXT_PUBLIC_SENTRY_ENVIRONMENT || process.env.NODE_ENV,

  sendDefaultPii: false,
  tracesSampleRate: 0,
  maxBreadcrumbs: 0,
  enableLogs: false,

  beforeBreadcrumb: beforeBreadcrumbPrivacy,
  beforeSend: beforeSendPrivacy,
});
