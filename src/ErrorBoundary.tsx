import React from 'react';

type Props = {
  children: React.ReactNode;
};

class ErrorBoundary extends React.Component<Props> {
  componentDidCatch(error: Error, info: React.ErrorInfo) {
    window.Main.sendMessage(
      `Error caught by ErrorBoundary: ${error.toString()}. Stack trace: ${
        info.componentStack
      }`,
    );
  }

  render() {
    const { children } = this.props;
    return children;
  }
}

export default ErrorBoundary;
