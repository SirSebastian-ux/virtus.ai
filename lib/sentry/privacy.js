const REDACTED_ERROR_MESSAGE =
  "Error message redacted by Virtus privacy policy.";

function stripQueryString(url) {
  if (typeof url !== "string") return undefined;

  return url.split("?")[0];
}

function sanitizeException(exception) {
  if (!exception?.values) return exception;

  return {
    ...exception,
    values: exception.values.map((value) => ({
      ...value,
      value: REDACTED_ERROR_MESSAGE,
    })),
  };
}

export function beforeSendPrivacy(event) {
  return {
    ...event,
    user: undefined,
    breadcrumbs: undefined,
    extra: undefined,
    request: event.request
      ? {
          method: event.request.method,
          url: stripQueryString(event.request.url),
        }
      : undefined,
    exception: sanitizeException(event.exception),
  };
}

export function beforeBreadcrumbPrivacy() {
  return null;
}
