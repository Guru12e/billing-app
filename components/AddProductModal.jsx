"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Html5QrcodeScanner } from "html5-qrcode";

export default function AddProductModal({ onClose, refresh }) {
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [stock, setStock] = useState("");
  const [barcode, setBarcode] = useState("");

  async function addProduct() {
    await fetch("/api/products", {
      method: "POST",
      body: JSON.stringify({
        name,
        price,
        stock,
        barcode,
      }),
    });

    refresh();
    onClose();
  }

  function startScanner() {
    const scanner = new Html5QrcodeScanner(
      "reader",
      { fps: 10, qrbox: 250 },
      false,
    );

    scanner.render((decodedText) => {
      setBarcode(decodedText);
      scanner.clear();
    });
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-end">
      <div className="bg-white w-full rounded-t-2xl p-5 space-y-3">
        <h2 className="font-semibold text-lg">Add Product</h2>

        <Input
          placeholder="Product Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

        <Input
          placeholder="Price"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
        />

        <Input
          placeholder="Stock"
          value={stock}
          onChange={(e) => setStock(e.target.value)}
        />

        <Input
          placeholder="Barcode"
          value={barcode}
          onChange={(e) => setBarcode(e.target.value)}
        />

        <Button onClick={startScanner} className="w-full">
          Scan Barcode
        </Button>

        <div id="reader"></div>

        <Button onClick={addProduct} className="w-full">
          Add Product
        </Button>
      </div>
    </div>
  );
}
