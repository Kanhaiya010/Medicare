import express from "express";
import { maybeClerkMiddleware, requireClerkAuth } from "../middlewares/clerkMode.js";
import {
  confirmPayment,
  getAppointments,
  getStats,
  createAppointment,
  getAppointmentsByPatient,
  getAppointmentsByDoctor,
  cancelAppointment,
  getRegisteredUserCount,
  updateAppointment,
} from "../controllers/appointmentControllers.js";

const appointmentRouter = express.Router();

appointmentRouter.get("/", getAppointments);
appointmentRouter.get("/confirm", confirmPayment);
appointmentRouter.get("/stats/summary", getStats);

// authentic routes
appointmentRouter.post(
  "/",
  maybeClerkMiddleware,
  requireClerkAuth,
  createAppointment,
);
appointmentRouter.get(
  "/me",
  maybeClerkMiddleware,
  requireClerkAuth,
  getAppointmentsByPatient,
);

appointmentRouter.get("/doctor/:doctorId", getAppointmentsByDoctor);

appointmentRouter.post("/:id/cancel", cancelAppointment);
appointmentRouter.get("/patients/count", getRegisteredUserCount);
appointmentRouter.put("/:id", updateAppointment);

export default appointmentRouter;
