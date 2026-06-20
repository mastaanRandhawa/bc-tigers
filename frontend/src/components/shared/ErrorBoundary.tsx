import { Component, type ErrorInfo, type ReactNode } from 'react';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

/**
 * App-level error boundary. Catches render-time exceptions anywhere in the tree
 * and shows a recoverable fallback instead of a blank white screen.
 */
export default class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // Surface the error in the console for diagnostics; no external reporting yet.
    console.error('Unhandled UI error:', error, info.componentStack);
  }

  private handleReload = () => {
    this.setState({ hasError: false });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div
          role="alert"
          className="flex min-h-dvh flex-col items-center justify-center gap-4 bg-surface-muted px-6 text-center"
        >
          <h1 className="text-xl font-semibold text-foreground">
            Something went wrong
          </h1>
          <p className="max-w-md text-sm text-muted-foreground">
            An unexpected error occurred while rendering this page. Reloading
            usually fixes it.
          </p>
          <button
            type="button"
            onClick={this.handleReload}
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:opacity-90"
          >
            Reload page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
