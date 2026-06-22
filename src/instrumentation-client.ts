const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;

if (dsn) {
  void import("@sentry/nextjs").then((Sentry) => {
    Sentry.init({
      dsn,
      environment:
        process.env.NEXT_PUBLIC_VERCEL_ENV ??
        process.env.NODE_ENV ??
        "development",
      sendDefaultPii: false,
      tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1,
    });
  });
}

type RouterTransitionStart =
  typeof import("@sentry/nextjs").captureRouterTransitionStart;

export const onRouterTransitionStart: RouterTransitionStart = (...args) => {
  void import("@sentry/nextjs").then((Sentry) => {
    Sentry.captureRouterTransitionStart(...args);
  });
};
