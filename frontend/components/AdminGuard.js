"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { clearAdminToken, getToken, isAdminTokenValid } from "@/lib/auth";

export default function AdminGuard({ children }) {
  const router = useRouter();
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    const handleUnauthorized = () => {
      setAuthorized(false);
      router.replace("/login");
    };
    window.addEventListener("gigshield:admin-unauthorized", handleUnauthorized);

    if (isAdminTokenValid() && !getToken()) {
      setAuthorized(true);
    } else {
      clearAdminToken();
      router.replace("/login");
    }

    return () => window.removeEventListener("gigshield:admin-unauthorized", handleUnauthorized);
  }, [router]);

  // Renders nothing — not even the page shell — until an admin token is
  // confirmed. This is the actual access control on the frontend; the
  // real enforcement is still the backend's get_current_admin dependency,
  // this just stops the UI from ever being visible to someone unauthorized.
  if (!authorized) return null;
  return children;
}
