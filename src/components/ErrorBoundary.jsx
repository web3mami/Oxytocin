import React from "react";

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error("[ErrorBoundary]", error, info);
  }

  render() {
    if (this.state.error) {
      return (
        <div className="app-error">
          <h1>Something went wrong</h1>
          <p className="app-error__msg">{this.state.error.message}</p>
          <p className="app-error__hint">
            Try a normal browser (Chrome or Edge) at{" "}
            <a href="http://localhost:5173/admin">http://localhost:5173/admin</a>
            . VS Code&apos;s built-in browser sometimes blocks this app.
          </p>
          <a className="btn btn--ghost" href="/">
            ← Home
          </a>
        </div>
      );
    }
    return this.props.children;
  }
}
