import Link from "next/link";
import { Component, type ErrorInfo, type ReactNode } from "react";
import { reportClientError } from "../../lib/client-error-reporting";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    if (typeof console !== "undefined") {
      console.error("[ErrorBoundary]", error, errorInfo.componentStack);
    }
    void reportClientError({
      message: error.message,
      name: error.name,
      stack: error.stack,
      componentStack: errorInfo.componentStack ?? undefined,
      source: "error-boundary",
    });
  }

  render() {
    if (this.state.hasError) {
      return (
        <main className="mx-auto flex min-h-[60vh] max-w-lg flex-col items-center justify-center px-4 py-12">
          <p className="text-6xl font-black text-slate-300">Oops</p>
          <h1 className="mt-4 text-xl font-bold text-slate-800">Something went wrong</h1>
          <p className="mt-2 text-center text-sm text-slate-600">
            The browser hit an unexpected issue while loading this page. Try reloading or return to the home page.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <button
              type="button"
              onClick={() => this.setState({ hasError: false })}
              className="rounded-md border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Try again
            </button>
            <Link
              href="/"
              className="rounded-md bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              Go home
            </Link>
            <Link
              href="/500"
              className="rounded-md border border-rose-200 bg-rose-50 px-4 py-2.5 text-sm font-semibold text-rose-700 transition hover:bg-rose-100"
            >
              System error page
            </Link>
          </div>
        </main>
      );
    }

    return this.props.children;
  }
}

