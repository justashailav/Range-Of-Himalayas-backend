import express from "express";
import { createCustomBox, deleteCustomBox, getCustomBoxById, getUserCustomBoxes, updateCustomBox } from "../controllers/customBoxController.js";
const router = express.Router();
router.post("/create-box", createCustomBox);
router.get("/get-boxes/:userId", getUserCustomBoxes);
router.get("/get-box/:id", getCustomBoxById);
router.put("/update-box/:id", updateCustomBox);
router.delete("/delete-box/:id", deleteCustomBox);

export default router;
