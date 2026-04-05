import { Batch } from "../models/batchModel.js";
import QRCode from "qrcode";

export const createBatch = async (req, res) => {
  try {
    // 1. Create batch instance first (so batchId gets generated)
    const batch = new Batch(req.body);

    // 2. Save once to generate batchId (from your pre-save hook)
    await batch.save();

    // 3. Create URL for QR
    const url = `http://www.rangeofhimalayas.co.in/batch/${batch.batchId}`;

    // 4. Generate QR code
    const qrCode = await QRCode.toDataURL(url);

    // 5. Save QR in DB
    batch.qrCode = qrCode;

    await batch.save();

    res.status(201).json({
      success: true,
      message: "Batch created successfully",
      batch,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};
export const getAllBatches = async (req, res) => {
  try {
    const batches = await Batch.find().sort({ createdAt: -1 });

    res.json({
      success: true,
      count: batches.length,
      batches,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

export const getBatchById = async (req, res) => {
  try {
    const batch = await Batch.findOne({ batchId: req.params.batchId });

    if (!batch) {
      return res.status(404).json({
        success: false,
        message: "Batch not found",
      });
    }

    res.json({
      success: true,
      batch,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};



// ✅ UPDATE BATCH
export const updateBatch = async (req, res) => {
  try {
    const batch = await Batch.findOneAndUpdate(
      { batchId: req.params.batchId },
      req.body,
      { new: true }
    );

    if (!batch) {
      return res.status(404).json({
        success: false,
        message: "Batch not found",
      });
    }

    res.json({
      success: true,
      message: "Batch updated",
      batch,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};



// ✅ DELETE BATCH
export const deleteBatch = async (req, res) => {
  try {
    const batch = await Batch.findOneAndDelete({
      batchId: req.params.batchId,
    });

    if (!batch) {
      return res.status(404).json({
        success: false,
        message: "Batch not found",
      });
    }

    res.json({
      success: true,
      message: "Batch deleted",
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};



// 🌿 TRACE BATCH (MAIN FEATURE)
export const traceBatch = async (req, res) => {
  try {
    const batch = await Batch.findOne({ batchId: req.params.batchId });

    if (!batch) {
      return res.status(404).json({
        success: false,
        message: "Batch not found",
      });
    }

    res.json({
      success: true,
      data: {
        productName: batch.productName,
        batchId: batch.batchId,

        origin: batch.origin,
        harvestDate: batch.harvestDate,
        processedDate: batch.processedDate,
        packagingDate: batch.packagingDate,

        farmer: batch.farmer,
        story: batch.story,
        timeline: batch.timeline,

        images: batch.images,
        videoUrl: batch.videoUrl,

        isVerified: batch.isVerified,
      },
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};