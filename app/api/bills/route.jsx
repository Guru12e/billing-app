import { connectDB } from "@/lib/mongodb";
import Bill from "@/models/Bill";
import { NextResponse } from "next/server";

export async function POST(req) {
  await connectDB();

  const body = await req.json();

  const bill = await Bill.create(body);

  return NextResponse.json(bill);
}
import { connectDB } from "@/lib/mongodb";
import Bill from "@/models/Bill";
import Product from "@/models/Product";
import { NextResponse } from "next/server";

export async function POST(req) {
  await connectDB();

  const body = await req.json();

  const bill = await Bill.create(body);

  for (const item of body.items) {
    await Product.findByIdAndUpdate(item.productId, {
      $inc: { stock: -item.qty },
    });
  }

  return NextResponse.json(bill);
}
