import axios from "axios";
import React, { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";

const API_BASE = "http://localhost:4000";
const VerifyServicePaymentPage = () => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    let cancelled = false;
    const fallbackTarget = "/appointments?service_payment=Failed";

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

    const verifyServicePayment = async () => {
      const params = new URLSearchParams(location.search || "");
      const sessionId = params.get("session_id");

      const buildTarget = (status) => `/appointments?service_payment=${status}`;

      if (location.pathname === "/service-appointment/cancel") {
        redirectTo(buildTarget("Cancelled"));
        return;
      }

      if (!sessionId) {
        redirectTo(buildTarget("Failed"));
        return;
      }

      try {
        const res = await axios.get(`${API_BASE}/api/service-appointments/confirm`, {
          params: { session_id: sessionId },
          timeout: 10000,
        });

        if (res?.data?.success) {
          redirectTo(buildTarget("Paid"));
        } else {
          redirectTo(buildTarget("Failed"));
        }
      } catch (error) {
        console.error("Service payment verification failed:", error);
        redirectTo(buildTarget("Failed"));
      }
    };

    verifyServicePayment();

    return () => {
      cancelled = true;
      clearTimeout(hardFallback);
    };
  }, [location.pathname, location.search, navigate]);

  return (
    <div style={{ minHeight: "50vh", display: "grid", placeItems: "center" }}>
      Verifying service payment, please wait...
    </div>
  );
};

export default VerifyServicePaymentPage;

