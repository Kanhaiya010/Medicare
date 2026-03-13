import axios from "axios";
import React, { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";

const API_BASE = "http://localhost:4000";

const VerifyPaymentPage = () => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    let cancelled = false;
    const fallbackTarget = "/appointments?payment_status=Failed";

    const redirectTo = (target) => {
      if (cancelled) return;
      navigate(target, { replace: true });
      setTimeout(() => {
        if (!cancelled && `${window.location.pathname}${window.location.search}` !== target) {
          window.location.replace(target);
        }
      }, 120);
    };

    const hardFallback = setTimeout(() => {
      redirectTo(fallbackTarget);
    }, 12000);

    const verifyPayment = async () => {
      const params = new URLSearchParams(location.search || "");
      const sessionId = params.get("session_id");

      const buildTarget = (status) => `/appointments?payment_status=${status}`;

      if (location.pathname === "/appointment/cancel") {
        redirectTo(buildTarget("Cancelled"));
        return;
      }

      if (!sessionId) {
        redirectTo(buildTarget("Failed"));
        return;
      }

      try {
        const res = await axios.get(`${API_BASE}/api/appointments/confirm`, {
          params: { session_id: sessionId },
          timeout: 10000,
        });

        if (res?.data?.success) {
          redirectTo(buildTarget("Paid"));
        } else {
          redirectTo(buildTarget("Failed"));
        }
      } catch (error) {
        console.error("Payment verification failed", error);
        redirectTo(buildTarget("Failed"));
      }
    };

    verifyPayment();

    return () => {
      cancelled = true;
      clearTimeout(hardFallback);
    };
  }, [location.pathname, location.search, navigate]);

  return (
    <div style={{ minHeight: "50vh", display: "grid", placeItems: "center" }}>
      Verifying payment, please wait...
    </div>
  );
};

export default VerifyPaymentPage;

