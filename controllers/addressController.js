import { Address } from "../models/AddressModel.js";

export const addAddress = async (req, res) => {
  try {
    const {
      userId,
      address,
      city,
      pincode,
      phone,
      notes,
      latitude,
      longitude,
    } = req.body;

    console.log("UserId", userId);

    if (!userId || !address || !city || !pincode || !phone) {
      return res.status(400).json({
        success: false,
        message: "Invalid data provided!",
      });
    }

    // 🔥 Prepare location (GeoJSON format)
    let locationData = {
      type: "Point",
      coordinates: [0, 0],
    };

    if (latitude && longitude) {
      locationData.coordinates = [Number(longitude), Number(latitude)];
    }

    const newlyCreatedAddress = new Address({
      userId,
      address,
      city,
      pincode,
      phone,
      notes,
      location: locationData, // ✅ added here
    });

    await newlyCreatedAddress.save();

    res.status(201).json({
      success: true,
      data: newlyCreatedAddress,
    });
  } catch (e) {
    console.log(e);
    res.status(500).json({
      success: false,
      message: "Error",
    });
  }
};
export const fetchAllAddress = async (req, res) => {
  try {
    const { userId } = req.params;
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "User id is required!",
      });
    }

    const addressList = await Address.find({ userId });

    res.status(200).json({
      success: true,
      addressList,
    });
  } catch (e) {
    console.log(e);
    res.status(500).json({
      success: false,
      message: "Error",
    });
  }
};

export const editAddress = async (req, res) => {
  try {
    const { userId, addressId } = req.params;
    console.log(userId);
    console.log("AddressId", addressId);

    if (!userId || !addressId) {
      return res.status(400).json({
        success: false,
        message: "User and address id is required!",
      });
    }

    const {
      address,
      city,
      pincode,
      phone,
      notes,
      latitude,
      longitude,
    } = req.body;

    // 🔥 Prepare update object
    const updateData = {
      address,
      city,
      pincode,
      phone,
      notes,
    };

    // 🔥 Handle location update
    if (latitude && longitude) {
      updateData.location = {
        type: "Point",
        coordinates: [Number(longitude), Number(latitude)], // [lng, lat]
      };
    }

    // ❗ Remove undefined fields (important)
    Object.keys(updateData).forEach((key) => {
      if (updateData[key] === undefined) {
        delete updateData[key];
      }
    });

    const addressData = await Address.findOneAndUpdate(
      {
        _id: addressId,
        userId,
      },
      updateData,
      { new: true }
    );

    if (!addressData) {
      return res.status(404).json({
        success: false,
        message: "Address not found",
      });
    }

    res.status(200).json({
      success: true,
      data: addressData,
    });
  } catch (e) {
    console.log(e);
    res.status(500).json({
      success: false,
      message: "Error",
    });
  }
};

export const deleteAddress = async (req, res) => {
  try {
    const { userId, addressId } = req.params;
    if (!userId || !addressId) {
      return res.status(400).json({
        success: false,
        message: "User and address id is required!",
      });
    }

    const address = await Address.findOneAndDelete({ _id: addressId, userId });

    if (!address) {
      return res.status(404).json({
        success: false,
        message: "Address not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Address deleted successfully",
    });
  } catch (e) {
    console.log(e);
    res.status(500).json({
      success: false,
      message: "Error",
    });
  }
};