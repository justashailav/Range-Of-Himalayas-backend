import { Products } from "../models/AdminModel/productsModel.js";
import { Cart } from "../models/cartModel.js";
import { CustomBox } from "../models/customBox.js";


export const addToCart = async (req, res) => {
  try {
    const { userId, productId, quantity, size, weight } = req.body;
    console.log(size)
    if (!userId || !productId || !quantity || !size || !weight) {
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

    // ✅ Find the selected variant in product
    const variant = product.variants.find(
      (v) => v.size === size && v.weight === weight
    );

    if (!variant) {
      return res.status(400).json({
        success: false,
        message: "Selected product variant does not exist",
      });
    }

    if (variant.stock < quantity) {
      return res.status(400).json({
        success: false,
        message: `Only ${variant.stock} items available for this variant`,
      });
    }
    let cart = await Cart.findOne({ userId });
    if (!cart) {
      cart = new Cart({ userId, items: [] });
    }
    const existingItemIndex = cart.items.findIndex(
      (item) =>
        item.productId.toString() === productId.toString() &&
        item.size === size &&
        item.weight === weight
    );

    if (existingItemIndex === -1) {
      // ➕ Add new item with prices from product variant
      cart.items.push({
        productId,
        quantity,
        size,
        weight,
        price: variant.price,
        salesPrice: variant.salesPrice || 0,
      });
    } else {
      // 🔄 Update quantity if already exists
      const newQuantity = cart.items[existingItemIndex].quantity + quantity;

      if (newQuantity > variant.stock) {
        return res.status(400).json({
          success: false,
          message: `Only ${variant.stock} items available for this variant`,
        });
      }

      cart.items[existingItemIndex].quantity = newQuantity;
    }

    // ✅ Save cart
    await cart.save();

    res.status(200).json({
      success: true,
      message: "Product added to cart successfully",
      cart,
    });
  } catch (error) {
    console.error(error)
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};


export const fetchCartItems = async (req, res) => {
  try {
    const { userId } = req.params;
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "User id is mandatory!",
      });
    }

    const cart = await Cart.findOne({ userId }).populate({
      path: "items.productId",
      select: "image title variants",
    });

    console.log("Populated Cart:", JSON.stringify(cart, null, 2));

    if (!cart) {
      return res.status(404).json({
        success: false,
        message: "Cart not found!",
      });
    }

    // Remove invalid items
    const validItems = cart.items.filter((productItem) => productItem.productId);
    if (validItems.length < cart.items.length) {
      cart.items = validItems;
      await cart.save();
    }

    const populatedCartItems = validItems.map((item) => {
      const product = item.productId;

      const variantObj = product.variants?.find(
        (v) => v.size === item.size && v.weight === item.weight
      );

      return {
        productId: product._id,
        image: product.image,
        title: product.title,
        price: variantObj?.price ?? 0,
        salesPrice: variantObj?.salesPrice ?? 0,
        quantity: item.quantity,
        size: item.size,
        weight: item.weight,
      };
    });

    res.status(200).json({
      success: true,
      data: {
        ...cart._doc,
        items: populatedCartItems,
      },
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      success: false,
      message: "Error fetching cart",
    });
  }
};

export const updateCartItemQty = async (req, res) => {
  try {
    const { userId, productId, quantity, size, weight } = req.body;

    console.log("Request body:", { userId, productId, quantity, size, weight });

    if (!userId || !productId || quantity <= 0 || !size || !weight) {
      console.log("Invalid data provided!");
      return res.status(400).json({
        success: false,
        message: "Invalid data provided!",
      });
    }

    const cart = await Cart.findOne({ userId }).populate({
      path: "items.productId",
      select: "image title variants",
    });

    console.log("Populated Cart:", JSON.stringify(cart, null, 2));

    if (!cart) {
      console.log("Cart not found!");
      return res.status(404).json({
        success: false,
        message: "Cart not found!",
      });
    }

    // Find the specific item by productId + size + weight
    const itemIndex = cart.items.findIndex(
      (item) => {
        const match =
          item.productId?._id.toString() === productId &&
          item.size === size &&
          item.weight === weight;
        if (!match) {
          console.log("Item does not match:", {
            itemProductId: item.productId?._id.toString(),
            size: item.size,
            weight: item.weight,
          });
        }
        return match;
      }
    );

    if (itemIndex === -1) {
      console.log("Cart item not found!");
      return res.status(404).json({
        success: false,
        message: "Cart item not found!",
      });
    }

    console.log("Updating item at index:", itemIndex, "with quantity:", quantity);

    // Update quantity
    cart.items[itemIndex].quantity = quantity;
    await cart.save();

    // Map items with variant pricing
    const populatedItems = cart.items.map((item) => {
      const product = item.productId;

      // Find matching variant by size + weight
      const variant = product.variants?.find(
        (v) => v.size === item.size && v.weight === item.weight
      );

      return {
        productId: product._id,
        image: product.image ?? null,
        title: product.title ?? "Unnamed Product",
        price: variant?.price ?? 0,
        salesPrice: variant?.salesPrice ?? 0,
        quantity: item.quantity,
        size: item.size,
        weight: item.weight,
      };
    });

    console.log("Updated Cart Items:", populatedItems);

    res.status(200).json({
      success: true,
      data: {
        ...cart._doc,
        items: populatedItems,
      },
    });
  } catch (error) {
    console.error("Error in updateCartItemQty:", error);
    res.status(500).json({
      success: false,
      message: "Error updating cart item",
    });
  }
};

export const deleteCartItem = async (req, res) => {
  try {
    const { userId, productId } = req.params;
    const { size, weight } = req.body;

    if (!userId || !productId || !size || !weight) {
      return res.status(400).json({
        success: false,
        message: "Invalid data provided!",
      });
    }

    const cart = await Cart.findOne({ userId }).populate({
      path: "items.productId",
      select: "image title variants",
    });

    if (!cart) {
      return res.status(404).json({
        success: false,
        message: "Cart not found!",
      });
    }

    cart.items = cart.items.filter(
      (item) =>
        item.productId?._id.toString() !== productId ||
        item.size !== size ||
        item.weight !== weight
    );

    await cart.save();

    // Repopulate to return updated cart
    await cart.populate({
      path: "items.productId",
      select: "image title variants",
    });

    const populatedItems = cart.items.map((item) => {
      const product = item.productId;

      if (!product) {
        return {
          productId: null,
          image: null,
          title: "Product not found",
          price: 0,
          salesPrice: 0,
          quantity: item.quantity,
          size: item.size,
          weight: item.weight,
        };
      }

      const variant = product.variants?.find(
        (v) => v.size === item.size && v.weight === item.weight
      );

      return {
        productId: product._id,
        image: product.image ?? null,
        title: product.title ?? "Unnamed Product",
        price: variant?.price ?? 0,
        salesPrice: variant?.salesPrice ?? 0,
        quantity: item.quantity,
        size: item.size,
        weight: item.weight,
      };
    });

    res.status(200).json({
      success: true,
      data: {
        ...cart._doc,
        items: populatedItems,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Error deleting cart item",
    });
  }
};
export const addBoxToCart = async (req, res) => {
  try {
    const { userId, id: boxId } = req.body;

    if (!userId || !boxId) {
      return res.status(400).json({
        success: false,
        message: "userId and boxId are required",
      });
    }

    // Fetch the box by ID
    const box = await CustomBox.findById(boxId).populate("items.productId");
    if (!box) {
      return res.status(404).json({
        success: false,
        message: "Box not found",
      });
    }

    // Find or create the cart for the user
    let cart = await Cart.findOne({ userId });
    if (!cart) {
      cart = new Cart({ userId, items: [], boxes: [] });
    }

    // Prevent duplicate
    const boxExists = cart.boxes.some(
      (b) => b.boxId.toString() === boxId.toString()
    );
    if (boxExists) {
      return res.status(400).json({
        success: false,
        message: "Box already added to cart",
      });
    }

    // Calculate box total
    const boxTotal = (box.items || []).reduce((sum, item) => {
      const product = item.productId;
      if (!product || !product.sizes) return sum;

      // Always fallback to item.size
      const sizeKey = item.size || item.selectedSize || "";
      const sizeObj = product.sizes.find(
        (s) => s.size?.toLowerCase() === sizeKey.toLowerCase()
      );

      const price = sizeObj?.salesPrice ?? sizeObj?.price ?? 0;
      const quantity = Number(item.quantity) || 0;

      return sum + price * quantity;
    }, 0);

    // Push to cart (normalize selectedSize → size)
    cart.boxes.push({
      boxId: box._id,
      boxName: box.boxName,
      items: box.items.map((item) => ({
        productId: item.productId._id,
        size: item.size || item.selectedSize, // ✅ normalize
        quantity: item.quantity,
      })),
      boxTotal,
    });

    await cart.save();

    return res.status(200).json({
      success: true,
      message: "Box added to cart successfully",
      cart,
    });
  } catch (error) {
    console.error("Error in addBoxToCart:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to add box to cart",
    });
  }
};



export const deleteBoxFromCart = async (req, res) => {
  try {
    const { userId, id } = req.body;

    if (!userId || !id) {
      return res.status(400).json({
        success: false,
        message: "userId and boxId are required",
      });
    }

    const box = await CustomBox.findById(id);
    if (!box) {
      return res.status(404).json({
        success: false,
        message: "Box not found",
      });
    }

    const cart = await Cart.findOne({ userId });
    if (!cart) {
      return res.status(404).json({
        success: false,
        message: "Cart not found",
      });
    }

    // Filter out all items in the cart that are in the box (matching productId & size)
    cart.items = cart.items.filter((cartItem) => {
      return !box.items.some(
        (boxItem) =>
          boxItem.productId.toString() === cartItem.productId.toString() &&
          boxItem.selectedSize === cartItem.size
      );
    });

    await cart.save();

    res.status(200).json({
      success: true,
      message: "Box items removed from cart",
      cart,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      success: false,
      message: "Failed to remove box from cart",
    });
  }
};
