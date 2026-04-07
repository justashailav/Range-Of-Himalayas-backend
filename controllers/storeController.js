import { Store } from "../models/storeModel.js";
import { User } from "../models/userModel.js";
export const createStore = async (req, res) => {
  try {
    const { manager, location, ...storeData } = req.body;

    // ✅ HARD FIX (always ensure coordinates exist)
    const safeLocation = {
      type: "Point",
      coordinates:
        location?.coordinates?.length === 2
          ? location.coordinates
          : [77.1734, 31.1048], // fallback (Shimla)
    };

    // ✅ 1. Create Store
    const store = await Store.create({
      ...storeData,
      location: safeLocation,
    });

    let managerUser = null;

    // ✅ 2. Create Manager
    if (manager?.email && manager?.password) {
      const hashedPassword = await bcrypt.hash(manager.password, 10);

      managerUser = await User.create({
        name: manager.name,
        email: manager.email,
        phone: manager.phone,
        password: hashedPassword,
        role: "Manager",
        storeId: store._id,
        accountVerified: true,
      });

      store.managerId = managerUser._id;
      await store.save();
    }

    res.status(201).json({
      success: 1,
      message: "Store + Manager created successfully",
      data: { store, manager: managerUser },
    });

  } catch (error) {
    res.status(500).json({
      success: 0,
      message: error.message,
    });
  }
};


// ✅ 2. GET ALL STORES
export const getAllStores = async (req, res) => {
  try {
    const stores = await Store.find()
      .populate("managerId", "name email")
      .sort({ priority: -1, createdAt: -1 });

    res.json({
      success: 1,
      count: stores.length,
      data: stores
    });
  } catch (error) {
    res.status(500).json({
      success: 0,
      message: error.message
    });
  }
};


// ✅ 3. GET SINGLE STORE
export const getStoreById = async (req, res) => {
  try {
    const store = await Store.findById(req.params.id)
      .populate("managerId", "name email");

    if (!store) {
      return res.status(404).json({
        success: 0,
        message: "Store not found"
      });
    }

    res.json({
      success: 1,
      data: store
    });
  } catch (error) {
    res.status(500).json({
      success: 0,
      message: error.message
    });
  }
};


// ✅ 4. UPDATE STORE
export const updateStore = async (req, res) => {
  try {
    const store = await Store.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );

    if (!store) {
      return res.status(404).json({
        success: 0,
        message: "Store not found"
      });
    }

    res.json({
      success: 1,
      message: "Store updated",
      data: store
    });
  } catch (error) {
    res.status(500).json({
      success: 0,
      message: error.message
    });
  }
};


// ✅ 5. DELETE STORE
export const deleteStore = async (req, res) => {
  try {
    const store = await Store.findByIdAndDelete(req.params.id);

    if (!store) {
      return res.status(404).json({
        success: 0,
        message: "Store not found"
      });
    }

    res.json({
      success: 1,
      message: "Store deleted"
    });
  } catch (error) {
    res.status(500).json({
      success: 0,
      message: error.message
    });
  }
};


// ✅ 6. FIND NEAREST STORE (🔥 CORE FEATURE)
export const findNearestStore = async (req, res) => {
  try {
    const { lng, lat, orderType } = req.query;

    if (!lng || !lat) {
      return res.status(400).json({
        success: 0,
        message: "Longitude & Latitude required",
      });
    }

    const stores = await Store.aggregate([
      {
        $geoNear: {
          near: {
            type: "Point",
            coordinates: [parseFloat(lng), parseFloat(lat)],
          },
          distanceField: "distance",
          maxDistance: 10000, // 🔥 10 KM (IMPORTANT)
          spherical: true,
        },
      },
      {
        $match: {
          isActive: 1,
          isAcceptingOrders: 1,
        },
      },
      {
        $sort: {
          priority: -1,
          distance: 1,
        },
      },
    ]);

    let filteredStores = stores;

    // 🚚 DELIVERY FILTER
    if (orderType === "delivery") {
      filteredStores = stores.filter(
        (s) =>
          s.services?.delivery?.enabled === 1 &&
          s.distance / 1000 <= (s.services?.delivery?.radiusKm || 5)
      );
    }

    // 🏬 PICKUP FILTER
    if (orderType === "pickup") {
      filteredStores = stores.filter(
        (s) => s.services?.pickup?.enabled === 1
      );
    }

    if (!filteredStores.length) {
      return res.status(404).json({
        success: 0,
        message: "No store available within 10 km",
      });
    }

    res.json({
      success: 1,
      data: filteredStores.slice(0, 5),
    });
  } catch (error) {
    res.status(500).json({
      success: 0,
      message: error.message,
    });
  }
};
export const toggleStoreStatus = async (req, res) => {
  try {
    const store = await Store.findById(req.params.id);

    if (!store) {
      return res.status(404).json({
        success: 0,
        message: "Store not found"
      });
    }

    store.isActive = store.isActive === 1 ? 0 : 1;
    await store.save();

    res.json({
      success: 1,
      message: "Store status updated",
      data: store
    });

  } catch (error) {
    res.status(500).json({
      success: 0,
      message: error.message
    });
  }
};
export const getStoresByManager = async (req, res) => {
  try {
    const { managerId } = req.params;

    const stores = await Store.find({ managerId });

    res.json({
      success: 1,
      data: stores
    });

  } catch (error) {
    res.status(500).json({
      success: 0,
      message: error.message
    });
  }
};