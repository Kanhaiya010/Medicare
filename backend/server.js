import express from "express";
import cors from "cors";
import "dotenv/config";

import { connectDb } from "./config/db.js";
import { maybeClerkMiddleware } from "./middlewares/clerkMode.js";
import doctorRouter from "./routes/doctorRouter.js";
import serviceRouter from "./routes/servicesRouter.js";
import appointmentRouter from "./routes/appointmentRouter.js";
import serviceAppointmentRouter from "./routes/serviceAppointmentRouter.js";
const app = express();
const port = 4000;

const allowedOrigins = new Set(
  (
    process.env.ALLOWED_ORIGINS ||
    "http://localhost:5173,http://localhost:5174,http://localhost:5175"
  )
    .split(",")
    .map((v) => v.trim())
    .filter(Boolean),
);

const isAllowedLocalOrigin = (origin = "") =>
  /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin);

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin) return callback(null, true);
      if (allowedOrigins.has(origin) || isAllowedLocalOrigin(origin)) {
        return callback(null, true);
      }
      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);
app.use(maybeClerkMiddleware);
app.use(express.json({ limit: "20mb" }));
app.use(express.urlencoded({ limit: "20mb", extended: true }));

connectDb();

app.use("/api/doctors", doctorRouter);
app.use("/api/services", serviceRouter);
app.use("/api/service-appointments", serviceAppointmentRouter);
app.use("/api/appointments", appointmentRouter);

app.get("/", (req, res) => {
  res.send("API WORKING"); // Basic health check route
});

app.listen(port, () => {
  console.log(`Server Started on http://localhost:${port}`); // Starts the server
});
