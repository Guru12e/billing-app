"use client";

import Link from "next/link";
import { Home, Receipt, Package, BarChart3 } from "lucide-react";

export default function BottomNav() {
  return (
    <div className="grid grid-cols-4 fixed bottom-0 w-full max-w-md border-t bg-white p-2">
      <Link href="/" className="flex flex-col items-center text-xs">
        <Home size={20} />
        Home
      </Link>

      <Link href="/billing" className="flex flex-col items-center text-xs">
        <Receipt size={20} />
        Billing
      </Link>

      <Link href="/products" className="flex flex-col items-center text-xs">
        <Package size={20} />
        Products
      </Link>

      <Link href="/sales" className="flex flex-col items-center text-xs">
        <BarChart3 size={20} />
        Sales
      </Link>
    </div>
  );
}
