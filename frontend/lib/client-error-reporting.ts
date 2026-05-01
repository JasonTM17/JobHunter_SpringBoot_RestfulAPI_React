type ClientErrorPayload = {
  message: string;
  name?: string;
  stack?: string;
  componentStack?: string;
  source: "error-boundary" | "window-error" | "unhandled-rejection";
  url?: string;
  userAgent?: string;
  timestamp: string;
};

const REPORTING_ENABLED =
  process.env.NEXT_PUBLIC_CLIENT_ERROR_REPORTING_ENABLED !== "false";

export async function reportClientError(payload: Omit<ClientErrorPayload, "timestamp" | "url" | "userAgent">) {
  if (!REPORTING_ENABLED || typeof window === "undefined") {
    return;
  }

  const body: ClientErrorPayload = {
    ...payload,
    timestamp: new Date().toISOString(),
    url: window.location.href,
    userAgent: window.navigator.userAgent,
  };

  try {
    await fetch("/api/client-errors", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
      keepalive: true,
    });
  } catch {
    // Error reporting must never create a second user-facing failure.
  }
}

export function toErrorPayload(error: unknown) {
  if (error instanceof Error) {
    return {
      message: error.message,
      name: error.name,
      stack: error.stack,
    };
  }

  return {
    message: typeof error === "string" ? error : "Unknown client error",
    name: "UnknownError",
  };
}

