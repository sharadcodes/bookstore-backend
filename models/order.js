const mongoose = require("mongoose");
const { ObjectId } = mongoose.Schema;

const productCartSchema = new mongoose.Schema({
  product: {
    type: ObjectId,
    ref: "Product"
  },
  name: String,
  count: Number,
  discount: Number,
  price: Number
});

const orderSchema = new mongoose.Schema(
  {
    products: [productCartSchema],
    transaction_id: {},
    amount: { type: Number },
    address: { type: String },
    updated: Date,
    status: {
      type: String,
      default: "Accepted",
      enum: [
        "Cancelled",
        "Delivered",
        "Shipped",
        "Processing",
        "Received",
        "Accepted"
      ]
    },
    user: {
      type: ObjectId,
      ref: "User"
    }
  },
  { timestamps: true }
);

const ProductCart = mongoose.model("ProductCart", productCartSchema);
const Order = mongoose.model("Order", orderSchema);

module.exports = { ProductCart, Order };
