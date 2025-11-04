import { Products } from "../models/AdminModel/productsModel.js";

export const getProductDetails = async (req, res) => {
  try {
    let { id } = req.params;
    id = id.trim();
    console.log("Product Id", id);
    const product = await Products.findById(id);

    if (!product)
      return res.status(404).json({
        success: false,
        message: "Product not found!",
      });

    res.status(200).json({
      success: true,
      product,
    });
  } catch (error) {
    console.log(error); 
    res.status(500).json({
      success: false,
      message: "Some error occured",
    });
  }
};
