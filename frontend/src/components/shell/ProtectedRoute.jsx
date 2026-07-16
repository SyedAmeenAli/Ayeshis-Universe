import React, { useEffect } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useSession } from "@/stores/sessionStore";

/**
 * Gate a route behind the private session cookie.
 * On mount, checks with the server if not already known.
 */
export function ProtectedRoute({ children }) {
  const status = useSession((s) => s.status);
  const check = useSession((s) => s.check);
  const location = useLocation();

  useEffect(() => {
    if (status === "unknown") check();
  }, [status, check]);

  if (status === "unknown") {
    return (
      <div className="min-h-screen w-full flex items-center justify-center text-text-muted">
        <span className="type-mono text-xs animate-pulse">verifying archive access…</span>
      </div>
    );
  }

  if (status === "guest") {
    return <Navigate to="/gateway" replace state={{ from: location.pathname }} />;
  }

  return children;
}
