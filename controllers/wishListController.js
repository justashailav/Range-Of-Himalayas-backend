import { Products } from "../models/AdminModel/productsModel.js";
import { WishList } from "../models/wishListModel.js";


export const addToWishList = async (req, res) => {
  try {
    const { userId, productId, size, weight } = req.body;

    if (!userId || !productId || !size) {
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
        item.size === size &&
        (item.weight || "") === (weight || "")
    );

    if (alreadyExists) {
      return res.status(400).json({
        success: false,
        message: "This product variant is already in your wishlist!",
      });
    }

    // Add new unique variant
    wishList.items.push({ productId, size, weight });
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
      select: "image title sizes weights", // ✅ include weights too
    });

    console.log("Populated WishList:", JSON.stringify(wishList, null, 2));

    if (!wishList) {
      return res.status(404).json({
        success: false,
        message: "WishList not found!",
      });
    }

    // ✅ Filter out any invalid (deleted) products
    const validItems = wishList.items.filter(
      (productItem) => productItem.productId
    );

    // ✅ Save cleaned list if needed
    if (validItems.length < wishList.items.length) {
      wishList.items = validItems;
      await wishList.save();
    }

    // ✅ Map wishlist items with size + weight support
    const populateWishListItems = validItems.map((item) => {
      let price = null;
      let salesPrice = null;

      // 1. If product has sizes, find price by size
      const sizeObj = item.productId.sizes?.find(
        (sizeEntry) => sizeEntry.size === item.size
      );

      // 2. If product has weights, find price by weight
      const weightObj = item.productId.weights?.find(
        (weightEntry) => weightEntry.weight === item.weight
      );

      if (sizeObj) {
        price = sizeObj.price;
        salesPrice = sizeObj.salesPrice;
      } else if (weightObj) {
        price = weightObj.price;
        salesPrice = weightObj.salesPrice;
      }

      return {
        productId: item.productId._id,
        image: item.productId.image,
        title: item.productId.title,
        price,
        salesPrice,
        quantity: item.quantity,
        size: item.size,
        weight: item.weight || null, // ✅ include weight in response
      };
    });

    res.status(200).json({
      success: true,
      data: {
        ...wishList._doc,
        items: populateWishListItems,
      },
    });
  } catch (error) {
    console.error("Fetch WishList Error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching wishlist",
    });
  }
};



export const updateWishListItemQty = async (req, res) => {
  try {

    const { userId, productId, quantity, size } = req.body;

    if (!userId || !productId || quantity <= 0 || !size) {
      return res.status(400).json({
        success: false,
        message: "Invalid data provided!",
      });
    }

    const wishList = await WishList.findOne({ userId });
    if (!wishList) {
      return res.status(404).json({
        success: false,
        message: "WishList not found!",
      });
    }

    const findCurrentProductIndex = wishList.items.findIndex(
      (item) => item.productId.toString() === productId && item.size === size
    );

    if (findCurrentProductIndex === -1) {
      return res.status(404).json({
        success: false,
        message: "WishList item not present!",
      });
    }
    wishList.items[findCurrentProductIndex].quantity = quantity;
    await wishList.save();
    await wishList.populate({
      path: "items.productId",
      select: "image title sizes",
    });
    const populatedItems = wishList.items.map((item) => {
      const sizeObj = item.productId?.sizes.find(
        (sizeEntry) => sizeEntry.size === item.size
      );
      return {
        productId: item.productId?._id || null,
        image: item.productId?.image || null,
        title: item.productId?.title || "Product not found",
        price: sizeObj ? sizeObj.price : null,
        salesPrice: sizeObj ? sizeObj.salesPrice : null,
        quantity: item.quantity,
        size: item.size,
      };
    });

    res.status(200).json({
      success: true,
      data: {
        ...wishList._doc,
        items: populatedItems,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Error updating wishlist item",
    });
  }
};

export const deleteWishListItem = async (req, res) => {
  try {
    const { userId, productId } = req.params;
    const { size, weight } = req.body;

    if (!userId || !productId || !size) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields: userId, productId, or size",
      });
    }

    const wishList = await WishList.findOne({ userId }).populate({
      path: "items.productId",
      select: "image title sizes",
    });

    if (!wishList) {
      return res.status(404).json({
        success: false,
        message: "Wishlist not found",
      });
    }

    const initialLength = wishList.items.length;

    wishList.items = wishList.items.filter((item) => {
      const sameProduct = item.productId?._id.toString() === productId;
      const sameSize = item.size === size;
      // Only check weight if the wishlist item has a weight
      const sameWeight = item.weight ? item.weight === weight : true;

      return !(sameProduct && sameSize && sameWeight);
    });

    if (wishList.items.length === initialLength) {
      return res.status(404).json({
        success: false,
        message: "Item not found in wishlist",
      });
    }

    await wishList.save();

    await wishList.populate({
      path: "items.productId",
      select: "image title sizes",
    });

    const items = wishList.items.map((item) => {
      const variant = item.productId?.sizes?.find((v) => v.size === item.size);
      return {
        productId: item.productId?._id || null,
        image: item.productId?.image || "/placeholder.png",
        title: item.productId?.title || "Product not found",
        price: variant?.price || null,
        salesPrice: variant?.salesPrice || null,
        quantity: item.quantity || 0,
        size: item.size,
        weight: item.weight || null,
      };
    });

    res.status(200).json({
      success: true,
      message: "Wishlist item deleted successfully",
      data: {
        ...wishList._doc,
        items,
      },
    });
  } catch (error) {
    console.error("Error deleting wishlist item:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error while deleting wishlist item",
    });
  }
};

