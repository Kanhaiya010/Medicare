import express from "express";
import upload from "../middlewares/multer.js";
import {
  createDoctor,
  deleteDoctor,
  doctorLogin,
  getDoctorCount,
  getDoctorDashboardStats,
  getDoctorById,
  getDoctors,
  streamDoctorCount,
  toggleAvailability,
  updateDoctor,
} from "../controllers/doctorController.js";
import doctorAuth from "../middlewares/doctorAuth.js";

const doctorRouter = express.Router();
doctorRouter.get("/", getDoctors);
doctorRouter.get("/count", getDoctorCount);
doctorRouter.get("/count/stream", streamDoctorCount);
doctorRouter.get("/dashboard-stats", getDoctorDashboardStats);
doctorRouter.post("/login", doctorLogin);

doctorRouter.get("/:id", getDoctorById);
doctorRouter.post("/", upload.single("image"), createDoctor);

// after login
doctorRouter.put("/:id", doctorAuth, upload.single("image"), updateDoctor);
doctorRouter.post("/:id/toggle-availability", doctorAuth, toggleAvailability);
doctorRouter.delete("/:id", deleteDoctor);

export default doctorRouter;
