import express from "express"
import { addAddress, deleteAddress, editAddress, fetchAllAddress } from "../controllers/addressController.js";
const router =express.Router()

router.post("/add-address",addAddress);
router.get("/get-address/:userId",fetchAllAddress);
router.put("/update-address/:userId/:addressId",editAddress);
router.delete("/delete/:userId/:addressId",deleteAddress);

export default router;