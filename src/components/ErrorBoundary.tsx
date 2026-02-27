import { Component, type ReactNode } from "react";
import { Link } from "react-router-dom";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  /** Set true when rendered outside BrowserRouter — disables Link usage */
  isOuterBoundary?: boolean;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: { componentStack: string }) {
    if (import.meta.env.DEV) {
      console.error("[ErrorBoundary]", error.message, info.componentStack);
    }
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      const message =
        import.meta.env.DEV && this.state.error
          ? this.state.error.message
          : "An unexpected error occurred. Please refresh the page.";

      // Outer boundary (outside BrowserRouter) — can't use Link
      if (this.props.isOuterBoundary) {
        return (
          <div className="min-h-screen bg-[#111] flex items-center justify-center p-6">
            <div className="text-center max-w-md">
              <h1 className="font-bold text-3xl text-white mb-2">
                Bikers<span className="text-orange-500">Brain</span>
              </h1>
              <p className="text-gray-400 text-sm mt-4 mb-6">{message}</p>
              <button
                onClick={() => window.location.reload()}
                className="px-6 py-2 bg-orange-500 text-white rounded font-semibold uppercase tracking-wider text-sm hover:bg-orange-600 transition-colors"
              >
                Refresh Page
              </button>
            </div>
          </div>
        );
      }

      return (
        <div className="min-h-screen bg-background flex items-center justify-center p-6">
          <div className="text-center max-w-md">
            <h1 className="font-oswald text-4xl font-bold mb-2">
              Bikers<span className="text-primary">Brain</span>
            </h1>
            <h2 className="font-oswald text-2xl font-bold mt-6 mb-2">Something went wrong</h2>
            <p className="text-muted-foreground mb-6 text-sm">{message}</p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => window.location.reload()}
                className="px-5 py-2 bg-primary text-primary-foreground rounded font-barlow-condensed font-semibold tracking-wider uppercase text-sm hover:bg-primary/90 transition-colors"
              >
                Refresh Page
              </button>
              <Link
                to="/"
                onClick={this.handleReset}
                className="px-5 py-2 border border-border rounded font-barlow-condensed font-semibold tracking-wider uppercase text-sm hover:border-primary hover:text-primary transition-colors"
              >
                Go Home
              </Link>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

