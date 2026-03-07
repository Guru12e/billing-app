import { connectDB } from "@/lib/mongodb";
import Bill from "@/models/Bill";
import { NextResponse } from "next/server";

export async function GET() {
  await connectDB();

  const bills = await Bill.find();

  const weekly = {};
  const productSales = {};

  bills.forEach((bill) => {
    const day = new Date(bill.createdAt).toLocaleDateString("en-US", {
      weekday: "short",
    });

    weekly[day] = (weekly[day] || 0) + bill.total;

    bill.items.forEach((item) => {
      productSales[item.name] = (productSales[item.name] || 0) + item.qty;
    });
  });

  const weeklyData = Object.keys(weekly).map((day) => ({
    day,
    sales: weekly[day],
  }));

  const topProducts = Object.keys(productSales)
    .map((name) => ({
      name,
      sales: productSales[name],
    }))
    .sort((a, b) => b.sales - a.sales)
    .slice(0, 5);

  return NextResponse.json({
    weeklyData,
    topProducts,
  });
}
