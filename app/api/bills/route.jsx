import { connectDB } from "@/lib/mongodb";
import Bill from "@/models/Bill";
import { NextResponse } from "next/server";

export async function POST(req) {
  await connectDB();

  const body = await req.json();

  const bill = await Bill.create(body);

  return NextResponse.json(bill);
}
