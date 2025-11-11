import { Coffee } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const History = () => {
  // Mock data - replace with real data later
  const historyItems = [
    {
      id: 1,
      productName: "สวาบง",
      type: "โค้ดลิดอก",
      sku: "วสว7",
      change: -13232,
      lot: "01",
      note: "จอคก ยยเช็ก",
      date: "4 พ.ย. 2568 15:15",
    },
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      <h2 className="text-2xl font-bold mb-6">ประวัติการเปลี่ยนแปลงสต๊อก</h2>

      <div className="space-y-4">
        {historyItems.map((item) => (
          <Card key={item.id}>
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center">
                  <Coffee className="w-6 h-6 text-muted-foreground" />
                </div>
                
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-semibold">{item.productName}</h3>
                    <Badge variant="destructive">{item.type}</Badge>
                  </div>
                  
                  <div className="space-y-1 text-sm">
                    <p className="text-muted-foreground">SKU: {item.sku}</p>
                    <p className="text-destructive font-semibold text-lg">
                      {item.change > 0 ? "+" : ""}{item.change.toLocaleString()}
                    </p>
                    <p className="text-muted-foreground">ล๊อต: {item.lot}</p>
                    <p className="text-muted-foreground">หมายเหตุ: {item.note}</p>
                    <p className="text-muted-foreground text-xs">{item.date}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default History;
