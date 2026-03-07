import mongoose from "mongoose";

const BillSchema = new mongoose.Schema(
  {
    items: [
      {
        name: String,
        price: Number,
        qty: Number,
      },
    ],
    subtotal: Number,
    gst: Number,
    total: Number,
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true },
);

export default mongoose.models.Bill || mongoose.model("Bill", BillSchema);
