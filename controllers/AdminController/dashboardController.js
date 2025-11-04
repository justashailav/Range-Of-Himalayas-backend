import { Products } from "../../models/AdminModel/productsModel.js";
import { Order } from "../../models/Order.js";
import { User } from "../../models/userModel.js";

export const getDashboardStats = async (req, res) => {
  try {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const dayOfWeek = startOfToday.getDay(); 
    const startOfWeek = new Date(startOfToday);
    startOfWeek.setDate(startOfToday.getDate() - dayOfWeek);
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const countOrdersInRange = async (startDate, endDate = now) => {
      return await Order.countDocuments({
        orderDate: { $gte: startDate, $lte: endDate },
      });
    };
    const sumRevenueInRange = async (startDate, endDate = now) => {
      const result = await Order.aggregate([
        {
          $match: {
            paymentStatus: "paid",
            orderDate: { $gte: startDate, $lte: endDate },
          },
        },
        {
          $group: {
            _id: null,
            totalRevenue: { $sum: "$totalAmount" },
          },
        },
      ]);
      return result[0]?.totalRevenue || 0;
    };

    const ordersToday = await countOrdersInRange(startOfToday);
    const ordersThisWeek = await countOrdersInRange(startOfWeek);

    const revenueToday = await sumRevenueInRange(startOfToday);
    const revenueThisMonth = await sumRevenueInRange(startOfMonth);
    const totalUsers = await User.countDocuments();

    const totalStockAggregate = await Products.aggregate([
      {
        $group: {
          _id: null,
          totalStock: { $sum: "$totalStock" },
        },
      },
    ]);
    const totalStock = totalStockAggregate[0]?.totalStock || 0;

    res.status(200).json({
      success: true,
      data: {
        ordersToday,
        ordersThisWeek,
        revenueToday,
        revenueThisMonth,
        totalUsers,
        totalStock,
      },
    });
  } catch (error) {
    console.error("Dashboard stats error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch dashboard stats",
    });
  }
};
