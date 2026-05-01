import { useEffect } from "react";
import { reportClientError, toErrorPayload } from "../../lib/client-error-reporting";

export default function ClientErrorReporter() {
  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      void reportClientError({
        ...toErrorPayload(event.error ?? event.message),
        source: "window-error",
      });
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      void reportClientError({
        ...toErrorPayload(event.reason),
        source: "unhandled-rejection",
      });
    };

    window.addEventListener("error", handleError);
    window.addEventListener("unhandledrejection", handleUnhandledRejection);

    return () => {
      window.removeEventListener("error", handleError);
      window.removeEventListener("unhandledrejection", handleUnhandledRejection);
    };
  }, []);

  return null;
}

