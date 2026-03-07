"use client";

import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";
import { Card, CardContent } from "@/components/ui/card";
import { useEffect, useState } from "react";

export default function Dashboard() {
  const [data, setData] = useState({
    totalSales: 0,
    billCount: 0,
    products: 0,
    profit: 0,
  });

  useEffect(() => {
    loadDashboard();
  }, []);

  async function loadDashboard() {
    const res = await fetch("/api/dashboard");
    const result = await res.json();
    setData(result);
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Header />

      <div className="p-4 space-y-4 flex-1">
        <div className="grid grid-cols-2 gap-4">
          <Card className="bg-indigo-500 text-white rounded-2xl">
            <CardContent className="p-4">
              <p className="text-sm">Today's Sales</p>
              <h2 className="text-xl font-bold">₹{data.totalSales}</h2>
            </CardContent>
          </Card>

          <Card className="bg-emerald-500 text-white rounded-2xl">
            <CardContent className="p-4">
              <p className="text-sm">Bills</p>
              <h2 className="text-xl font-bold">{data.billCount}</h2>
            </CardContent>
          </Card>

          <Card className="bg-purple-500 text-white rounded-2xl">
            <CardContent className="p-4">
              <p className="text-sm">Products</p>
              <h2 className="text-xl font-bold">{data.products}</h2>
            </CardContent>
          </Card>

          <Card className="bg-orange-500 text-white rounded-2xl">
            <CardContent className="p-4">
              <p className="text-sm">Profit</p>
              <h2 className="text-xl font-bold">₹{data.profit}</h2>
            </CardContent>
          </Card>
        </div>

        <Card className="rounded-2xl border-2 border-indigo-100">
          <CardContent className="p-4">
            <h3 className="font-semibold text-indigo-600 mb-2">AI Insight</h3>

            <p className="text-sm text-gray-600">
              Your shop generated ₹{data.totalSales} today across{" "}
              {data.billCount} bills. Consider promoting your best-selling
              products to increase sales tomorrow.
            </p>
          </CardContent>
        </Card>
      </div>

      <BottomNav />
    </div>
  );
}
