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

export default function BillingPage() {
  const [items, setItems] = useState([]);
  const [productName, setProductName] = useState("");
  const [price, setPrice] = useState("");
  const [products, setProducts] = useState([]);
  const [billHistory, setBillHistory] = useState([]);
  const [showDisplayIndex, setShowDisplayIndex] = useState(3);
  const [voiceLang, setVoiceLang] = useState("en-IN"); // English or Tamil
  const [isScanning, setIsScanning] = useState(false);

  // IMPORTANT: Get your FREE Gemini API key from https://aistudio.google.com/app/apikey
  // Add this to your .env.local file:
  // NEXT_PUBLIC_GEMINI_API_KEY=your_actual_key_here
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

  /* ---------------- ADD PRODUCT ---------------- */
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

  /* ---------------- PRODUCT AUTOFILL ---------------- */
  const handleProductSelect = (name) => {
    const product = products.find(
      (p) => p.name.toLowerCase() === name.toLowerCase(),
    );
    if (product) {
      setPrice(product.price);
    }
  };

  /* ---------------- QTY CONTROLS ---------------- */
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

  /* ---------------- BARCODE SCANNER (PROPERLY MANAGED) ---------------- */
  useEffect(() => {
    if (isScanning) {
      // Clear any previous scanner
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
        // Continuous scanning (better UX) - stays open until user stops
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

  /* ---------------- AI VOICE BILLING WITH GOOGLE GEMINI (Free 1.5 Flash) ---------------- */
  async function parseVoiceWithGemini(transcript, availableProducts) {
    if (!GEMINI_API_KEY) {
      alert(
        "Gemini API Key not configured!\n\nAdd NEXT_PUBLIC_GEMINI_API_KEY=your_key to .env.local\nGet free key: https://aistudio.google.com/app/apikey",
      );
      return [];
    }

    const model = "gemini-1.5-flash";
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`;

    const productListStr = availableProducts
      .map((p) => `${p.name} (₹${p.price})`)
      .join("; ");

    const prompt = `You are a smart bilingual billing assistant for an Indian store.

Available products: ${productListStr}

User spoke this (can be English or Tamil): "${transcript}"

Return ONLY a valid JSON array in this exact format:
[{"name": "exact product name from the list above (match even if slightly misspelled or spoken in Tamil)", "qty": number}, ...]

Rules:
- Translate Tamil to English product name automatically.
- If no quantity mentioned, use 1.
- If unclear or no match, return empty array [].
- NEVER add any explanation or text outside the JSON.`;

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.1, maxOutputTokens: 300 },
        }),
      });

      if (!response.ok) throw new Error("Gemini API error");

      const data = await response.json();
      let text = data.candidates?.[0]?.content?.parts?.[0]?.text || "[]";

      // Clean any markdown
      text = text.replace(/```json|```/gi, "").trim();

      const parsed = JSON.parse(text);
      return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
      console.error("Gemini error:", error);
      alert(
        "AI voice parsing failed. Please try speaking clearly or use manual entry.",
      );
      return [];
    }
  }

  function startVoice() {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert("Voice recognition not supported in this browser");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = voiceLang; // en-IN or ta-IN
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

    recognition.onerror = (event) => {
      console.error("Speech error:", event);
      alert("Voice recognition error. Please try again.");
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
        {/* PRODUCT INPUT + AI VOICE + SCANNER */}
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

          {/* Language selector for AI Voice (English / Tamil) */}
          <select
            value={voiceLang}
            onChange={(e) => setVoiceLang(e.target.value)}
            className="bg-white border border-gray-300 text-sm rounded-xl px-3 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="en-IN">🇬🇧 EN</option>
            <option value="ta-IN">🇮🇳 TA</option>
          </select>

          {/* AI Voice Billing Button (Gemini-powered) */}
          <button
            onClick={startVoice}
            className="bg-indigo-500 hover:bg-indigo-600 text-white p-3 rounded-xl transition"
            title="AI Voice Billing (English / Tamil)"
          >
            <Mic size={18} />
          </button>

          {/* Scanner Toggle Button */}
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

        {/* Scanner Container */}
        <div id="reader" className="mt-2" />

        {/* Current Items */}
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

      {/* BILL SUMMARY */}
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

      {/* BILL HISTORY */}
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
