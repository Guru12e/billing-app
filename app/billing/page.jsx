"use client";

import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

import { Card, CardContent } from "@/components/ui/card";
import { Plus, Minus, Mic, Trash2, Scan, X } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Html5QrcodeScanner } from "html5-qrcode";
import { parseVoiceWithGemini } from "@/lib/gemini";

export default function BillingPage() {
  const [items, setItems] = useState([]);
  const [productName, setProductName] = useState("");
  const [price, setPrice] = useState("");
  const [products, setProducts] = useState([]);
  const [billHistory, setBillHistory] = useState([]);
  const [showDisplayIndex, setShowDisplayIndex] = useState(3);
  const [isScanning, setIsScanning] = useState(false);

  const GEMINI_API_KEY = process.env.NEXT_PUBLIC_GEMINI_API_KEY || "";

  const scannerRef = useRef(null);

  useEffect(() => {
    fetchProducts();
    fetchBills();
  }, []);

  async function fetchProducts() {
    const res = await fetch("/api/products");
    const data = await res.json();
    setProducts(data);
  }

  async function fetchBills() {
    const res = await fetch("/api/bills");
    const data = await res.json();
    setBillHistory(data);
  }

  const addProduct = (name, productPrice) => {
    if (!name || !productPrice) return;

    setItems((prev) => {
      const existingIndex = prev.findIndex(
        (item) => item.name.toLowerCase() === name.toLowerCase(),
      );

      if (existingIndex !== -1) {
        const updated = [...prev];
        updated[existingIndex].qty += 1;
        return updated;
      } else {
        return [
          ...prev,
          {
            name,
            price: Number(productPrice),
            qty: 1,
          },
        ];
      }
    });

    setProductName("");
    setPrice("");
  };

  const handleProductSelect = (name) => {
    const product = products.find(
      (p) => p.name.toLowerCase() === name.toLowerCase(),
    );
    if (product) {
      setPrice(product.price);
    }
  };

  const increaseQty = (index) => {
    setItems((prev) => {
      const updated = [...prev];
      updated[index].qty += 1;
      return updated;
    });
  };

  const decreaseQty = (index) => {
    setItems((prev) => {
      const updated = [...prev];
      if (updated[index].qty > 1) {
        updated[index].qty -= 1;
      }
      return updated;
    });
  };

  const removeItem = (index) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  useEffect(() => {
    if (isScanning) {
      if (scannerRef.current) {
        scannerRef.current.clear();
      }

      const newScanner = new Html5QrcodeScanner(
        "reader",
        { fps: 10, qrbox: 250 },
        false,
      );

      newScanner.render((decodedText) => {
        const product = products.find((p) => p.barcode === decodedText);
        if (product) {
          addProduct(product.name, product.price);
        }
      });

      scannerRef.current = newScanner;
    } else {
      if (scannerRef.current) {
        scannerRef.current.clear();
        scannerRef.current = null;
      }
    }

    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear();
        scannerRef.current = null;
      }
    };
  }, [isScanning, products]);

  function startVoice() {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert("Voice recognition not supported in this browser");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onresult = async (event) => {
      const transcript = event.results[0][0].transcript.trim();
      console.log(`Voice input (${voiceLang}):`, transcript);

      const parsedItems = await parseVoiceWithGemini(transcript, products);

      for (const item of parsedItems) {
        const product = products.find(
          (p) => p.name.toLowerCase() === item.name.toLowerCase(),
        );

        if (product) {
          for (let j = 0; j < (item.qty || 1); j++) {
            addProduct(product.name, product.price);
          }
        } else {
          console.warn(`Product "${item.name}" not found in database`);
        }
      }
    };

    recognition.start();
  }

  /* ---------------- BILL CALCULATION ---------------- */
  const subtotal = items.reduce((sum, item) => sum + item.price * item.qty, 0);
  const gst = Math.round(subtotal * 0.05);
  const total = subtotal + gst;

  /* ---------------- INVOICE ---------------- */
  async function generateInvoice() {
    if (items.length === 0) return;

    // Save to backend first
    const res = await fetch("/api/bills", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        items,
        subtotal,
        gst,
        total,
      }),
    });

    if (res.ok) {
      fetchBills();
      setItems([]); // Clear cart after successful save

      // Generate PDF
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
      doc.text(`GST (5%): ₹${gst}`, 14, finalY + 6);
      doc.text(`Total: ₹${total}`, 14, finalY + 12);

      doc.save("invoice.pdf");
    } else {
      alert("Failed to save bill to history");
    }
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Header />

      <div className="p-4 space-y-4 flex-1">
        <div className="flex gap-2 items-center">
          <Input
            list="products"
            placeholder="Product name"
            value={productName}
            onChange={(e) => {
              setProductName(e.target.value);
              handleProductSelect(e.target.value);
            }}
            className="rounded-xl flex-1"
          />

          <datalist id="products">
            {products.map((p) => (
              <option key={p._id} value={p.name} />
            ))}
          </datalist>

          <button
            onClick={startVoice}
            className="bg-indigo-500 hover:bg-indigo-600 text-white p-3 rounded-xl transition"
            title="AI Voice Billing (English / Tamil)"
          >
            <Mic size={18} />
          </button>

          <button
            onClick={() => setIsScanning(!isScanning)}
            className={`p-3 rounded-xl transition ${
              isScanning
                ? "bg-red-500 hover:bg-red-600"
                : "bg-green-500 hover:bg-green-600"
            } text-white`}
            title={isScanning ? "Stop Scanner" : "Start Barcode Scanner"}
          >
            {isScanning ? <X size={18} /> : <Scan size={18} />}
          </button>

          <Button
            onClick={() => addProduct(productName, price)}
            className="rounded-xl"
          >
            Add
          </Button>
        </div>

        <div id="reader" className="mt-2" />

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
                <span className="font-medium w-6 text-center">{item.qty}</span>
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
      </div>

      <Card className="rounded-2xl border-2 border-indigo-100 mt-5">
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
            Generate &amp; Save Invoice
          </Button>
        </CardContent>
      </Card>

      <Card className="rounded-2xl my-5">
        <CardContent className="p-4 space-y-3">
          <h3 className="font-semibold">Bill History</h3>

          {billHistory.slice(0, showDisplayIndex).map((bill) => (
            <div key={bill._id} className="border rounded-xl p-3 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">
                  {new Date(bill.createdAt).toLocaleDateString()}
                </span>
                <span className="font-semibold text-indigo-600">
                  ₹{bill.total}
                </span>
              </div>

              <div className="text-xs text-gray-600 space-y-1">
                {bill.items.slice(0, 2).map((item, i) => (
                  <div key={i} className="flex justify-between">
                    <span>
                      {item.name} × {item.qty}
                    </span>
                    <span>₹{item.price * item.qty}</span>
                  </div>
                ))}
                {bill.items.length > 2 && (
                  <p className="text-gray-400">
                    +{bill.items.length - 2} more items
                  </p>
                )}
              </div>
            </div>
          ))}

          {billHistory.length > 3 && (
            <Button
              variant="outline"
              className="w-full rounded-xl"
              onClick={() =>
                setShowDisplayIndex((prev) =>
                  prev < billHistory.length ? prev + 3 : 3,
                )
              }
            >
              {billHistory.length < showDisplayIndex
                ? "View Less"
                : "View More"}
            </Button>
          )}
        </CardContent>
      </Card>

      <BottomNav />
    </div>
  );
}
