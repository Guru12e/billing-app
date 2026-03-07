import { connectDB } from "@/lib/mongodb";
import Bill from "@/models/Bill";
import Product from "@/models/Product";
import { NextResponse } from "next/server";

export async function GET() {
  await connectDB();

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const bills = await Bill.find({
    createdAt: { $gte: today },
  });

  const products = await Product.countDocuments();

  let totalSales = 0;

  bills.forEach((bill) => {
    totalSales += bill.total;
  });

  const billCount = bills.length;

  const profit = Math.round(totalSales * 0.25); // simple estimate

  return NextResponse.json({
    totalSales,
    billCount,
    products,
    profit,
  });
}
