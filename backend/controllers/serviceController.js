import Service from "../models/Service.js";
import {
  uploadToCloudinary,
  deleteFromCloudinary,
} from "../utils/cloudinary.js";

const parseJsonArrayField = (field) => {
  if (!field) return [];
  if (Array.isArray(field)) return field;
  if (typeof field === "string") {
    try {
      const parsed = JSON.parse(field);
      if (Array.isArray(parsed)) return parsed;
      return typeof parsed === "string" ? [parsed] : [];
    } catch {
      return field
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
    }
  }
  return [];
};

function normalizeSlotsToMap(slotStrings = []) {
  const map = {};
  slotStrings.forEach((raw) => {
    const m = raw.match(
      /^(\d{1,2})\s+([A-Za-z]{3})\s+(\d{4})\s*•\s*(\d{1,2}):(\d{2})\s*(AM|PM)/i,
    );
    if (!m) {
      // fallback: keep raw in an "unspecified" bucket
      map["unspecified"] = map["unspecified"] || [];
      map["unspecified"].push(raw);
      return;
    }
    const [, day, monShort, year, hour, minute, ampm] = m;
    const monthIdx = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ].findIndex((x) => x.toLowerCase() === monShort.toLowerCase());
    const mm = String(monthIdx + 1).padStart(2, "0");
    const dd = String(Number(day)).padStart(2, "0");
    const dateKey = `${year}-${mm}-${dd}`; // YYYY-MM-DD
    const timeStr = `${String(Number(hour)).padStart(2, "0")}:${String(minute).padStart(2, "0")} ${ampm.toUpperCase()}`;
    map[dateKey] = map[dateKey] || [];
    map[dateKey].push(timeStr);
  });
  return map;
}

const sanitizePrice = (v) =>
  Number(String(v ?? "0").replace(/[^\d.-]/g, "")) || 0;
const parseAvailability = (v) => {
  const s = String(v ?? "available").toLowerCase();
  return s === "available" || s === "true";
};

export async function createService(req, res) {
  try {
    const b = req.body || {};
    const instructions = parseJsonArrayField(b.instructions);
    const rawSlots = parseJsonArrayField(b.slots);
    const slots = normalizeSlotsToMap(rawSlots);
    const numericPrice = sanitizePrice(b.price);
    const available = parseAvailability(b.availability);

    let imageUrl = b.imageUrl ? String(b.imageUrl).trim() : null;
    let imagePublicId = b.imagePublicId ? String(b.imagePublicId).trim() : null;
    if (!req.file && !imageUrl) {
      return res.status(400).json({
        success: false,
        message: "Service image is required",
      });
    }

    if (req.file) {
      try {
        const up = await uploadToCloudinary(req.file.path, "services");
        imageUrl = up?.secure_url || up?.url || null;
        imagePublicId = up?.public_id || up?.publicId || null;
      } catch (err) {
        console.error("Cloudinary upload error:", err?.message || err);
        return res.status(502).json({
          success: false,
          message: "Failed to upload service image",
        });
      }
    }
    if (!imageUrl) {
      return res.status(400).json({
        success: false,
        message: "Service image is required",
      });
    }

    const service = new Service({
      name: b.name,
      about: b.about,
      shortDescription: b.shortDescription,
      price: numericPrice,
      available,
      instructions,
      slots,
      imageUrl,
      imagePublicId,
    });
    const saved = await service.save();
    return res.status(201).json({
      success: true,
      data: saved,
      message: "Service created successfully",
    });
  } catch (error) {
    console.error("CreateService Error:", error);
    return res.status(500).json({
      success: false,
      message: "Error creating service",
      error: error.message,
    });
  }
}

export async function getServices(req, res) {
  try {
    const list = await Service.find().sort({ createdAt: -1 });
    return res.status(200).json({
      success: true,
      data: list,
    });
  } catch (error) {
    console.error("Getservices Error:", error);
    return res.status(500).json({
      success: false,
      message: "Error fetching services",
      error: error.message,
    });
  }
}

export async function getServiceById(req, res) {
  try {
    const { id } = req.params;
    const service = await Service.findById(id).lean();
    if (!service)
      return res.status(400).json({
        success: false,
        message: "Service not found",
      });
    return res.status(200).json({
      success: true,
      data: service,
    });
  } catch (error) {
    console.error("GetServiceById Error:", error);
    return res.status(500).json({
      success: false,
      message: "Error fetching service",
      error: error.message,
    });
  }
}

export async function updateService(req, res) {
  try {
    const { id } = req.params;
    const existing = await Service.findById(id);
    if (!existing)
      return res.status(400).json({
        success: false,
        message: "Service not found",
      });

    const b = req.body || {};
    const updateData = {};

    if (b.name !== undefined) updateData.name = b.name;
    if (b.about !== undefined) updateData.about = b.about;
    if (b.shortDescription !== undefined)
      updateData.shortDescription = b.shortDescription;
    if (b.price !== undefined) updateData.price = sanitizePrice(b.price);
    if (b.availability !== undefined)
      updateData.available = parseAvailability(b.availability);
    if (b.instructions !== undefined)
      updateData.instructions = parseJsonArrayField(b.instructions);
    if (b.slots !== undefined)
      updateData.slots = normalizeSlotsToMap(parseJsonArrayField(b.slots));

    if (req.file) {
      try {
        const up = await uploadToCloudinary(req.file.path, "services");
        if (up?.secure_url) {
          updateData.imageUrl = up.secure_url;
          updateData.imagePublicId = up.public_id || up.publicId || null;
          if (existing.imagePublicId) {
            try {
              await deleteFromCloudinary(existing.imagePublicId);
            } catch (err) {
              console.warn("Cloudinary delete failed:", err?.message || err);
            }
          }
        }
      } catch (err) {
        console.error("Cloudinary upload error:", err?.message || err);
        return res.status(502).json({
          success: false,
          message: "Failed to upload service image",
        });
      }
    } else if (String(b.removeImage || "").toLowerCase() === "true") {
      if (existing.imagePublicId) {
        try {
          await deleteFromCloudinary(existing.imagePublicId);
        } catch (err) {
          console.warn("Cloudinary delete failed:", err?.message || err);
        }
      }
      updateData.imageUrl = null;
      updateData.imagePublicId = null;
    } else if (b.imageUrl !== undefined) {
      const nextUrl = String(b.imageUrl || "").trim();
      updateData.imageUrl = nextUrl || null;
      if (!nextUrl) updateData.imagePublicId = null;
    }

    const updated = await Service.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    });
    return res.status(200).json({
      success: true,
      data: updated,
      message: "Service updated successfully",
    });
  } catch (error) {
    console.error("UpdateService Error:", error);
    return res.status(500).json({
      success: false,
      message: "Error updating service",
      error: error.message,
    });
  }
}

export async function deleteService(req, res) {
  try {
    const { id } = req.params;
    const existing = await Service.findById(id);
    if (!existing)
      return res.status(400).json({
        success: false,
        message: "Service not found",
      });

    if (existing.imagePublicId) {
      try {
        await deleteFromCloudinary(existing.imagePublicId);
      } catch (error) {
        console.warn(
          "Failed to delete image from cloudinary:",
          error?.message || error,
        );
      }
    }
    await existing.deleteOne();
    return res.status(200).json({
      success: true,
      message: "Services Deleted",
    });
  } catch (error) {
    console.error("DeleteService Error:", error);
    return res.status(500).json({
      success: false,
      message: "Error updating service",
      error: error.message,
    });
  }
}
