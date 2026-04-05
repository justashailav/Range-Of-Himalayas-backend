import express from "express";
import { createBatch, deleteBatch, getAllBatches, getBatchById, traceBatch, updateBatch } from "../controllers/batchController.js";
const router = express.Router();
router.get("/trace/:batchId", traceBatch);
router.post("/create-batch", createBatch);            
router.get("/get-all-batches", getAllBatches);           
router.get("/:batchId", getBatchById);   
router.put("/:batchId", updateBatch);     
router.delete("/:batchId", deleteBatch);  


export default router;