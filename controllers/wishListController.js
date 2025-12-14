import { Products } from "../models/AdminModel/productsModel.js";
import { WishList } from "../models/wishListModel.js";


export const addToWishList = async (req, res) => {
  try {
    const { userId, productId, size, weight } = req.body;
    const normalizedSize = size || "";
    if (!userId || !productId) {
      return res.status(400).json({
        success: false,
        message: "Invalid data provided!",
      });
    }

    const product = await Products.findById(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    let wishList = await WishList.findOne({ userId });
    if (!wishList) {
      wishList = new WishList({ userId, items: [] });
    }

    const alreadyExists = wishList.items.some(
      (item) =>
        item.productId.toString() === productId.toString() &&
        (item.size || "") === normalizedSize  &&
        (item.weight || "") === (weight || "")
    );

    if (alreadyExists) {
      return res.status(400).json({
        success: false,
        message: "This product variant is already in your wishlist!",
      });
    }

    // Add new unique variant
    wishList.items.push({ productId, size:normalizedSize, weight });
    await wishList.save();

    res.status(200).json({
      success: true,
      message: "Product added to wishlist",
      wishList,
    });
  } catch (error) {
    console.error("Add to WishList Error:", error);
    res.status(500).json({
      success: false,
      message: "Something went wrong!",
    });
  }
};

export const fetchWishListItems = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "User id is mandatory!",
      });
    }

    const wishList = await WishList.findOne({ userId }).populate({
      path: "items.productId",
      select: "image title price salesPrice sizes weights",
    });

    if (!wishList) {
      return res.status(404).json({
        success: false,
        message: "WishList not found!",
      });
    }

    /* ---------------- REMOVE DELETED PRODUCTS ---------------- */
    const validItems = wishList.items.filter(
      (item) => item.productId
    );

    if (validItems.length !== wishList.items.length) {
      wishList.items = validItems;
      await wishList.save();
    }

    /* ---------------- MAP ITEMS ---------------- */
    const populatedItems = validItems.map((item) => {
      const product = item.productId;

      let price = product.price || 0;
      let salesPrice = product.salesPrice || 0;

      /* ---- SIZE BASED PRICE (if exists) ---- */
      if (item.size && product.sizes?.length) {
        const sizeObj = product.sizes.find(
          (s) => s.size === item.size
        );
        if (sizeObj) {
          price = sizeObj.price;
          salesPrice = sizeObj.salesPrice;
        }
      }

      /* ---- WEIGHT BASED PRICE (if exists & size not used) ---- */
      else if (item.weight && product.weights?.length) {
        const weightObj = product.weights.find(
          (w) => w.weight === item.weight
        );
        if (weightObj) {
          price = weightObj.price;
          salesPrice = weightObj.salesPrice;
        }
      }

      return {
        _id: item._id,
        productId: product._id,
        title: product.title,
        image: product.image,
        quantity: item.quantity || 1,

        size: item.size || "",        // ✅ optional size
        weight: item.weight || null,  // ❌ raw weight (not normalized)

        price,
        salesPrice,
      };
    });

    return res.status(200).json({
      success: true,
      data: {
        _id: wishList._id,
        userId: wishList.userId,
        items: populatedItems,
      },
    });
  } catch (error) {
    console.error("Fetch WishList Error:", error);
    return res.status(500).json({
      success: false,
      message: "Error fetching wishlist",
    });
  }
};

export const updateWishListItemQty = async (req, res) => {
  try {
    const { userId, productId, quantity, size = "", weight } = req.body;

    /* ---------------- VALIDATION ---------------- */
    if (!userId || !productId || !weight || quantity <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid data provided!",
      });
    }

    const wishList = await WishList.findOne({ userId }).populate({
      path: "items.productId",
      select: "image title weights",
    });

    if (!wishList) {
      return res.status(404).json({
        success: false,
        message: "WishList not found!",
      });
    }

    /* ---------------- FIND ITEM ---------------- */
    const itemIndex = wishList.items.findIndex(
      (item) =>
        item.productId?._id.toString() === productId.toString() &&
        item.weight === weight &&
        (item.size || "") === size
    );

    if (itemIndex === -1) {
      return res.status(404).json({
        success: false,
        message: "WishList item not present!",
      });
    }

    /* ---------------- UPDATE QUANTITY ---------------- */
    wishList.items[itemIndex].quantity = quantity;
    await wishList.save();

    /* ---------------- MAP RESPONSE ---------------- */
    const populatedItems = wishList.items
      .filter((item) => item.productId)
      .map((item) => {
        const product = item.productId;

        const weightObj = product.weights.find(
          (w) => w.weight === item.weight
        );

        return {
          _id: item._id,
          productId: product._id,
          image: product.image,
          title: product.title,

          quantity: item.quantity,
          size: item.size || "",
          weight: item.weight,

          price: weightObj?.price || 0,
          salesPrice: weightObj?.salesPrice || 0,
        };
      });

    return res.status(200).json({
      success: true,
      data: {
        _id: wishList._id,
        userId: wishList.userId,
        items: populatedItems,
      },
    });
  } catch (error) {
    console.error("Update WishList Qty Error:", error);
    return res.status(500).json({
      success: false,
      message: "Error updating wishlist item",
    });
  }
};


export const deleteWishListItem = async (req, res) => {
  try {
    const { userId, productId } = req.params;
    const { size = "", weight } = req.body;

    /* ---------------- VALIDATION ---------------- */
    if (!userId || !productId || !weight) {
      return res.status(400).json({
        success: false,
        message: "Invalid data provided!",
      });
    }

    const wishList = await WishList.findOne({ userId });

    if (!wishList) {
      return res.status(404).json({
        success: false,
        message: "Wishlist not found",
      });
    }

    /* ---------------- REMOVE ITEM ---------------- */
    const initialLength = wishList.items.length;

    wishList.items = wishList.items.filter(
      (item) =>
        !(
          item.productId.toString() === productId.toString() &&
          item.weight === weight &&
          (item.size || "") === size
        )
    );

    if (wishList.items.length === initialLength) {
      return res.status(404).json({
        success: false,
        message: "Wishlist item not found",
      });
    }

    await wishList.save();

    /* ---------------- POPULATE RESPONSE ---------------- */
    await wishList.populate({
      path: "items.productId",
      select: "image title sizes weights",
    });

    const items = wishList.items.map((item) => {
      const sizeObj = item.productId?.sizes?.find(
        (s) => s.size === item.size
      );
      const weightObj = item.productId?.weights?.find(
        (w) => w.weight === item.weight
      );

      return {
        productId: item.productId?._id || null,
        image: item.productId?.image || "/placeholder.png",
        title: item.productId?.title || "Product not found",
        price: sizeObj?.price ?? weightObj?.price ?? null,
        salesPrice: sizeObj?.salesPrice ?? weightObj?.salesPrice ?? null,
        quantity: item.quantity || 1,
        size: item.size || "",
        weight: item.weight,
      };
    });

    return res.status(200).json({
      success: true,
      message: "Wishlist item deleted successfully",
      data: {
        ...wishList._doc,
        items,
      },
    });
  } catch (error) {
    console.error("Delete Wishlist Item Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error while deleting wishlist item",
    });
  }
};


