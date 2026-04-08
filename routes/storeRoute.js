const router = express.Router();

// ✅ CREATE
router.post("/create-store", createStore);

// ✅ GET
router.get("/get-all-stores", getAllStores);
router.get("/nearest", findNearestStore);
router.get("/my-store", isAuthenticated, attachStore, getMyStore);

// ✅ ACTION ROUTES (STATIC FIRST)
router.patch("/toggle/:id", toggleStoreStatus);

// ❗ DYNAMIC ROUTES ALWAYS LAST
router.get("/:id", getStoreById);
router.put("/:id", updateStore);
router.delete("/:id", deleteStore);

export default router;