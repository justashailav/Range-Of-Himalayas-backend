import express from "express";
import { createStore, deleteStore, findNearestStore, getAllStores, getStoreById, getStoresByManager, toggleStoreStatus, updateStore } from "../controllers/storeController.js";


const router = express.Router();

router.post("/create-store", createStore);
router.get("/get-all-stores", getAllStores);
router.get("/nearest", findNearestStore);
router.get("/manager/:managerId", getStoresByManager);
router.get("/:id", getStoreById);
router.put("/:id", updateStore);
router.delete("/:id", deleteStore);
router.patch("/toggle/:id", toggleStoreStatus);

export default router;