import { Products } from "../models/AdminModel/productsModel.js";
import { Cart } from "../models/cartModel.js";
import { CustomBox } from "../models/customBox.js";

// export const createCustomBox = async (req, res) => {
//   try {
//     const { userId, boxName, boxSize, items, message, isGift } = req.body;

//     if (!items || items.length === 0) {
//       return res.status(400).json({ error: "Box must contain at least one item." });
//     }

//     const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0);
//     if (totalQuantity > boxSize) {
//       return res.status(400).json({ error: "Items exceed box size limit." });
//     }

//     let totalPrice = 0;
//     for (const item of items) {
//       const product = await Products.findById(item.productId);
//       if (!product) {
//         return res.status(404).json({ error: `Product not found: ${item.productId}` });
//       }

//       // Use the "size" field from frontend
//       const customPrice = product.customBoxPrices.find(
//         (p) => p.size === item.size
//       );

//       if (!customPrice) {
//         return res.status(400).json({
//           error: `Price not defined for size "${item.size}" of product "${product.title}"`,
//         });
//       }

//       item.pricePerUnit = customPrice.pricePerPiece;
//       item.totalPrice = customPrice.pricePerPiece * item.quantity;
//       totalPrice += item.totalPrice;
//     }

//     let discount = 0;
//     if (totalQuantity >= 10) discount = 10;

//     const finalPrice = totalPrice - (totalPrice * discount) / 100;

//     const customBox = new CustomBox({
//       userId,
//       boxName,
//       boxSize,
//       items,
//       totalPrice,
//       discount,
//       finalPrice,
//       message,
//       isGift: isGift || false,
//     });

//     const savedBox = await customBox.save();
//     res.status(201).json(savedBox);
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ error: "Failed to create custom box", details: error.message });
//   }
// };

export const createCustomBox = async (req, res) => {
  try {
    const { userId, boxName, boxSize, items, message, isGift } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({ error: "Box must contain at least one item." });
    }

    const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0);
    if (totalQuantity > boxSize) {
      return res.status(400).json({ error: "Items exceed box size limit." });
    }

    let totalPrice = 0;
    for (const item of items) {
      const product = await Products.findById(item.productId);
      if (!product) {
        return res.status(404).json({ error: `Product not found: ${item.productId}` });
      }

      // Use the "size" field from frontend
      const customPrice = product.customBoxPrices.find(
        (p) => p.size === item.size
      );

      if (!customPrice) {
        return res.status(400).json({
          error: `Price not defined for size "${item.size}" of product "${product.title}"`,
        });
      }

      item.pricePerUnit = customPrice.pricePerPiece;
      item.totalPrice = customPrice.pricePerPiece * item.quantity;
      totalPrice += item.totalPrice;
    }

    let discount = 0;
    if (totalQuantity >= 10) discount = 10;

    const finalPrice = totalPrice - (totalPrice * discount) / 100;

    const customBox = new CustomBox({
      userId,
      boxName,
      boxSize,
      items,
      totalPrice,
      discount,
      finalPrice,
      message,
      isGift: isGift || false,
    });

    const savedBox = await customBox.save();

    // Populate productId titles before sending
    const populatedBox = await CustomBox.findById(savedBox._id).populate(
      "items.productId",
      "title" // only send title
    );

    res.status(201).json(populatedBox);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to create custom box", details: error.message });
  }
};

export const getUserCustomBoxes = async (req, res) => {
  try {
    const { userId } = req.params;

    // Populate items.productId and select only required fields
    const boxes = await CustomBox.find({ userId }).populate({
      path: "items.productId",
      select: "title ", // add any other fields you need
    });

    res.status(200).json(boxes);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch boxes", details: error.message });
  }
};


export const getCustomBoxById = async (req, res) => {
  try {
    const { id } = req.params;
    const box= await CustomBox.find({ id }).populate({
      path: "items.productId",
      select: "title ", // add any other fields you need
    });
    if (!box) {
      return res.status(404).json({ error: "Custom box not found" });
    }

    res.status(200).json(box);
  } catch (error) {
    res
      .status(500)
      .json({ error: "Failed to fetch box", details: error.message });
  }
};
export const updateCustomBox = async (req, res) => {
  try {
    const { id } = req.params;
    const { boxName, boxSize, items, message } = req.body;

    if (!Array.isArray(items)) {
      return res.status(400).json({ error: "Items must be an array." });
    }

    if (items.length > boxSize) {
      return res.status(400).json({ error: "Items exceed box size limit." });
    }

    // Normalize items
    const normalizedItems = items.map((item) => ({
      productId: item.productId,
      quantity: Number(item.quantity) || 1,
      size: item.size || item.selectedSize, // fallback for old data
      pricePerUnit: Number(item.pricePerUnit) || 0,
      totalPrice: (Number(item.pricePerUnit) || 0) * (Number(item.quantity) || 1),
    }));

    // Validate missing size
    const missingSizeItems = normalizedItems.filter((item) => !item.size);
    if (missingSizeItems.length > 0) {
      return res.status(400).json({ error: "Each item must have a 'size' property." });
    }

    // Calculate totals
    const totalQuantity = normalizedItems.reduce((sum, item) => sum + item.quantity, 0);
    const totalPrice = normalizedItems.reduce((sum, item) => sum + item.totalPrice, 0);

    // Discount logic → 10% off if totalQuantity >= 10
    const discountPercent = totalQuantity >= 10 ? 10 : 0;
    const discountAmount = (totalPrice * discountPercent) / 100;
    const finalPrice = totalPrice - discountAmount;

    // Update the CustomBox
    await CustomBox.findByIdAndUpdate(
      id,
      {
        boxName,
        boxSize,
        items: normalizedItems,
        message,
        totalPrice,
        discount: discountAmount,
        finalPrice,
      },
      { new: true }
    );

    // ✅ Fetch updated box with populated product titles
    const populatedBox = await CustomBox.findById(id).populate(
      "items.productId",
      "title"
    );

    // Update all carts that have this box
    const updateResult = await Cart.updateMany(
      { "boxes.boxId": id },
      {
        $set: {
          "boxes.$.boxName": boxName,
          "boxes.$.items": normalizedItems,
          "boxes.$.totalPrice": totalPrice,
          "boxes.$.discount": discountAmount,
          "boxes.$.finalPrice": finalPrice,
        },
      }
    );

    res.status(200).json({
      message: "Custom box updated successfully",
      updatedBox: populatedBox,
      cartUpdate: updateResult,
    });
  } catch (error) {
    console.error("Error updating custom box:", error);
    res.status(500).json({
      error: "Failed to update custom box",
      details: error.message,
    });
  }
};




export const deleteCustomBox = async (req, res) => {
  try {
    const { id } = req.params;
    console.log(id)
    const deleted = await CustomBox.findByIdAndDelete(id);

    if (!deleted) {
      return res.status(404).json({ message: "CoustomBox not found." });
    }

    await Cart.updateMany(
      { "boxes.boxId": id },
      { $pull: { boxes: { boxId: id } } }
    );

    return res
      .status(200)
      .json({ success: true, message: "CoustomBox deleted." });
  } catch (error) {
    console.error(error);

    return res.status(500).json({ message: "Could not delete CoustomBox." });
  }
};
