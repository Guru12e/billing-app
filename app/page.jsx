import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";
import { Card, CardContent } from "@/components/ui/card";

export default function Dashboard() {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />

      <div className="p-4 space-y-4 flex-1">
        <div className="grid grid-cols-2 gap-4">
          <Card className="bg-indigo-500 text-white rounded-2xl">
            <CardContent className="p-4">
              <p className="text-sm">Today's Sales</p>
              <h2 className="text-xl font-bold">₹12,450</h2>
            </CardContent>
          </Card>

          <Card className="bg-emerald-500 text-white rounded-2xl">
            <CardContent className="p-4">
              <p className="text-sm">Bills</p>
              <h2 className="text-xl font-bold">42</h2>
            </CardContent>
          </Card>

          <Card className="bg-purple-500 text-white rounded-2xl">
            <CardContent className="p-4">
              <p className="text-sm">Products</p>
              <h2 className="text-xl font-bold">124</h2>
            </CardContent>
          </Card>

          <Card className="bg-orange-500 text-white rounded-2xl">
            <CardContent className="p-4">
              <p className="text-sm">Profit</p>
              <h2 className="text-xl font-bold">₹3,240</h2>
            </CardContent>
          </Card>
        </div>
        <Card className="rounded-2xl border-2 border-indigo-100">
          <CardContent className="p-4">
            <h3 className="font-semibold text-indigo-600 mb-2">AI Insight</h3>

            <p className="text-sm text-gray-600">
              Milk sales increase by 30% in the morning. Consider stocking more
              tomorrow.
            </p>
          </CardContent>
        </Card>
      </div>

      <BottomNav />
    </div>
  );
}
