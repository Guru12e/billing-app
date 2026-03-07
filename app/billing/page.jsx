"use client";

import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

import { Card, CardContent } from "@/components/ui/card";
import { Plus, Minus, Mic, Trash2, Scan } from "lucide-react";
import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Html5QrcodeScanner } from "html5-qrcode";

export default function BillingPage() {
  const [items, setItems] = useState([]);
  const [productName, setProductName] = useState("");
  const [price, setPrice] = useState("");
  const [products, setProducts] = useState([]);

  useEffect(() => {
    fetchProducts();
  }, []);

  async function fetchProducts() {
    const res = await fetch("/api/products");
    const data = await res.json();
    setProducts(data);
  }

  const addProduct = (name, productPrice) => {
    if (!name || !productPrice) return;

    const existingIndex = items.findIndex(
      (item) => item.name.toLowerCase() === name.toLowerCase(),
    );

    if (existingIndex !== -1) {
      const updated = [...items];
      updated[existingIndex].qty += 1;
      setItems(updated);
    } else {
      setItems([
        ...items,
        {
          name,
          price: Number(productPrice),
          qty: 1,
        },
      ]);
    }

    setProductName("");
    setPrice("");
  };

  const handleProductSelect = (name) => {
    const product = products.find(
      (p) => p.name.toLowerCase() === name.toLowerCase(),
    );

    if (product) {
      setProductName(product.name);
      setPrice(product.price);
    }
  };

  const increaseQty = (index) => {
    const updated = [...items];
    updated[index].qty += 1;
    setItems(updated);
  };

  const decreaseQty = (index) => {
    const updated = [...items];

    if (updated[index].qty > 1) {
      updated[index].qty -= 1;
      setItems(updated);
    }
  };

  const removeItem = (index) => {
    const updated = items.filter((_, i) => i !== index);
    setItems(updated);
  };

  function startScanner() {
    const scanner = new Html5QrcodeScanner(
      "reader",
      { fps: 10, qrbox: 250 },
      false,
    );

    scanner.render(async (decodedText) => {
      const res = await fetch("/api/products");
      const data = await res.json();

      const product = data.find((p) => p.barcode === decodedText);

      if (product) {
        addProduct(product.name, product.price);
      }

      scanner.clear();
    });
  }

  function startVoice() {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    const recognition = new SpeechRecognition();

    recognition.onresult = (event) => {
      const text = event.results[0][0].transcript.toLowerCase();

      const words = text.split(" ");

      for (let i = 0; i < words.length; i++) {
        const qty = parseInt(words[i]);

        if (!isNaN(qty)) {
          const name = words[i + 1];

          const product = products.find((p) =>
            p.name.toLowerCase().includes(name),
          );

          if (product) {
            for (let j = 0; j < qty; j++) {
              addProduct(product.name, product.price);
            }
          }
        }
      }
    };

    recognition.start();
  }

  const subtotal = items.reduce((sum, item) => {
    return sum + item.price * item.qty;
  }, 0);

  const gst = Math.round(subtotal * 0.05);
  const total = subtotal + gst;

  async function generateInvoice() {
    await fetch("/api/bills", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        items,
        subtotal,
        gst,
        total,
      }),
    });

    const doc = new jsPDF();

    doc.setFontSize(18);
    doc.text("Billing Invoice", 14, 20);

    doc.setFontSize(10);
    doc.text(`Date: ${new Date().toLocaleString()}`, 14, 28);

    const tableData = items.map((item) => [
      item.name,
      `₹${item.price}`,
      item.qty,
      `₹${item.price * item.qty}`,
    ]);

    autoTable(doc, {
      startY: 35,
      head: [["Item", "Price", "Qty", "Total"]],
      body: tableData,
    });

    const finalY = doc.lastAutoTable.finalY + 10;

    doc.text(`Subtotal: ₹${subtotal}`, 14, finalY);
    doc.text(`GST: ₹${gst}`, 14, finalY + 6);
    doc.text(`Total: ₹${total}`, 14, finalY + 12);

    doc.save("invoice.pdf");
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Header />

      <div className="p-4 space-y-4 flex-1">
        <div className="space-y-2 mb-4">
          <div className="flex gap-2">
            <Input
              list="products"
              placeholder="Product name"
              value={productName}
              onChange={(e) => {
                setProductName(e.target.value);
                handleProductSelect(e.target.value);
              }}
              className="rounded-xl"
            />

            <datalist id="products">
              {products.map((p) => (
                <option key={p._id} value={p.name} />
              ))}
            </datalist>

            <button
              onClick={startVoice}
              className="bg-indigo-500 text-white p-3 rounded-xl"
            >
              <Mic size={18} />
            </button>

            <button
              onClick={startScanner}
              className="bg-green-500 text-white p-3 rounded-xl"
            >
              <Scan size={18} />
            </button>

            <Button
              onClick={() => addProduct(productName, price)}
              className="rounded-xl"
            >
              Add
            </Button>
          </div>

          <div id="reader"></div>

          <p className="text-xs text-gray-500">Try voice: "2 milk 1 bread"</p>
        </div>

        <div className="space-y-3">
          {items.map((item, index) => (
            <Card key={index} className="rounded-xl">
              <CardContent className="p-3 flex justify-between items-center">
                <div>
                  <p className="font-medium">{item.name}</p>
                  <p className="text-sm text-gray-500">
                    ₹{item.price} × {item.qty}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    className="bg-gray-200 p-1 rounded"
                    onClick={() => decreaseQty(index)}
                  >
                    <Minus size={16} />
                  </button>

                  <span>{item.qty}</span>

                  <button
                    className="bg-indigo-500 text-white p-1 rounded"
                    onClick={() => increaseQty(index)}
                  >
                    <Plus size={16} />
                  </button>

                  <button
                    onClick={() => removeItem(index)}
                    className="bg-red-500 text-white p-1 rounded"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </CardContent>
            </Card>
          ))}

          <Card className="rounded-2xl border-2 border-indigo-100">
            <CardContent className="p-4 space-y-3">
              <div className="flex justify-between text-sm">
                <span>Subtotal</span>
                <span>₹{subtotal}</span>
              </div>

              <div className="flex justify-between text-sm">
                <span>GST (5%)</span>
                <span>₹{gst}</span>
              </div>

              <div className="flex justify-between font-semibold text-lg">
                <span>Total</span>
                <span>₹{total}</span>
              </div>

              <Button
                onClick={generateInvoice}
                className="w-full rounded-xl bg-linear-to-r from-indigo-500 to-emerald-500"
              >
                Generate Invoice
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
