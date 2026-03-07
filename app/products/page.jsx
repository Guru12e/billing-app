"use client";

import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Plus } from "lucide-react";
import { useEffect, useState } from "react";
import AddProductModal from "@/components/AddProductModal";

export default function ProductsPage() {
  const [products, setProducts] = useState([]);
  const [open, setOpen] = useState(false);

  async function fetchProducts() {
    const res = await fetch("/api/products");
    const data = await res.json();
    setProducts(data);
  }

  useEffect(() => {
    fetchProducts();
  }, []);

  return (
    <div className="flex flex-col min-h-screen">
      <Header />

      <div className="flex-1 p-4 space-y-4 overflow-y-auto">
        <Input placeholder="Search product..." className="rounded-xl" />

        {products.map((product) => (
          <Card
            key={product._id}
            className="p-3 flex justify-between items-center rounded-xl"
          >
            <div>
              <p className="font-medium">{product.name}</p>
              <p className="text-xs text-gray-500">Stock: {product.stock}</p>
            </div>

            <div className="text-right">
              <p className="font-semibold text-indigo-600">₹{product.price}</p>
            </div>
          </Card>
        ))}
      </div>

      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-20 right-5 bg-linear-to-r from-indigo-500 to-emerald-500 text-white p-4 rounded-full shadow-lg"
      >
        <Plus size={22} />
      </button>

      {open && (
        <AddProductModal
          onClose={() => setOpen(false)}
          refresh={fetchProducts}
        />
      )}

      <BottomNav />
    </div>
  );
}
