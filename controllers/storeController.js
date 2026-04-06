import { Store } from "../models/storeModel.js";
export const createStore = async (req, res) => {
  try {
    const store = await Store.create(req.body);

    res.status(201).json({
      success: 1,
      message: "Store created successfully",
      data: store
    });
  } catch (error) {
    res.status(500).json({
      success: 0,
      message: error.message
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
        message: "Longitude & Latitude required"
      });
    }

    const stores = await Store.aggregate([
      {
        $geoNear: {
          near: {
            type: "Point",
            coordinates: [parseFloat(lng), parseFloat(lat)]
          },
          distanceField: "distance",
          spherical: true
        }
      },
      {
        $match: {
          isActive: 1,
          isAcceptingOrders: 1
        }
      },
      {
        $sort: {
          priority: -1,
          distance: 1
        }
      }
    ]);

    let filteredStores = stores;

    // 🔥 FILTER BASED ON ORDER TYPE
    if (orderType === "delivery") {
      filteredStores = stores.filter(
        (s) =>
          s.services?.delivery?.enabled === 1 &&
          s.distance / 1000 <= (s.services?.delivery?.radiusKm || 5)
      );
    }

    if (orderType === "pickup") {
      filteredStores = stores.filter(
        (s) => s.services?.pickup?.enabled === 1
      );
    }

    if (!filteredStores.length) {
      return res.status(404).json({
        success: 0,
        message: "No store available"
      });
    }

    res.json({
      success: 1,
      data: filteredStores[0] // best store
    });

  } catch (error) {
    res.status(500).json({
      success: 0,
      message: error.message
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