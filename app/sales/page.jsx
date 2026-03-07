"use client";

import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";
import { LineChart, Line, XAxis, Tooltip, ResponsiveContainer } from "recharts";
import { Card } from "@/components/ui/card";
import { Sparkles } from "lucide-react";
import { useEffect, useState } from "react";

export default function SalesPage() {
  const [data, setData] = useState([]);
  const [products, setProducts] = useState([]);

  useEffect(() => {
    loadSales();
  }, []);

  async function loadSales() {
    const res = await fetch("/api/sales");
    const result = await res.json();

    setData(result.weeklyData);
    setProducts(result.topProducts);
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Header />

      <div className="flex-1 p-4 space-y-4 overflow-y-auto">
        <Card className="p-4 rounded-xl">
          <p className="font-semibold mb-2">Weekly Sales</p>

          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={data}>
              <XAxis dataKey="day" />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="sales"
                stroke="#6366f1"
                strokeWidth={3}
              />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        <Card className="p-4 rounded-xl">
          <p className="font-semibold mb-3">🔥 Top Products</p>

          <div className="space-y-2">
            {products.map((p, i) => (
              <div key={i} className="flex justify-between text-sm">
                <span>{p.name}</span>
                <span>{p.sales} sold</span>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-4 rounded-xl border-2 border-indigo-100">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles size={18} className="text-indigo-500" />
            <p className="font-semibold text-indigo-600">AI Business Insight</p>
          </div>

          <p className="text-sm text-gray-600">
            Your highest selling product this week is{" "}
            <b>{products[0]?.name || "..."}</b>. Consider increasing stock to
            maximize profit.
          </p>
        </Card>
      </div>

      <BottomNav />
    </div>
  );
}
