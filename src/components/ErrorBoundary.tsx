"use client";

import { Component, ReactNode } from "react";
import Link from "next/link";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-[400px] flex items-center justify-center p-8">
          <div className="text-center max-w-md">
            <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
              <AlertTriangle className="h-8 w-8 text-red-600" />
            </div>
            <h2 className="text-xl font-bold text-leather-800 mb-2">
              Đã có lỗi xảy ra
            </h2>
            <p className="text-ink-600 mb-6">
              Xin lỗi, đã có lỗi không mong muốn xảy ra. Vui lòng thử lại.
            </p>
            <div className="flex gap-3 justify-center">
              <Button
                onClick={() => {
                  this.setState({ hasError: false });
                  window.location.reload();
                }}
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Tải lại trang
              </Button>
              <Link href="/">
                <Button variant="outline">
                  <Home className="mr-2 h-4 w-4" />
                  Về trang chủ
                </Button>
              </Link>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
