import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PackagePlus, Lightbulb } from "lucide-react";
import { AddLotDialog } from "@/components/lots/AddLotDialog";

const Lots = () => {
  const [isAddLotDialogOpen, setIsAddLotDialogOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">เพิ่มสินค้าเป็นล๊อต</h2>
          <Button
            onClick={() => setIsAddLotDialogOpen(true)}
            className="bg-success hover:bg-success/90"
          >
            <PackagePlus className="w-4 h-4 mr-2" />
            เพิ่มล๊อตใหม่
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">
                วิธีการเพิ่มสินค้าเป็นล๊อต
              </h3>
              <div className="space-y-4">
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-semibold">
                    1
                  </div>
                  <div>
                    <p className="font-medium">
                      คลิก "เพิ่มล๊อตใหม่" เพื่อเริ่มต้น
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-semibold">
                    2
                  </div>
                  <div>
                    <p className="font-medium">
                      กรอกข้อมูลล๊อต เช่น ผู้จำหน่าย วันที่หมดอายุ
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-semibold">
                    3
                  </div>
                  <div>
                    <p className="font-medium">
                      เพิ่มสินค้าหลายรายการในล๊อตเดียวกัน
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-semibold">
                    4
                  </div>
                  <div>
                    <p className="font-medium">
                      บันทึกล๊อตและเพิ่มสินค้าทั้งหมดพร้อมกัน
                    </p>
                  </div>
                </div>
              </div>
            </Card>
          </div>

          <div className="lg:col-span-1">
            <Card className="p-6 bg-accent/10 border-accent/20">
              <div className="flex items-center gap-2 mb-4">
                <Lightbulb className="w-5 h-5 text-primary" />
                <h3 className="font-semibold">เคล็ดลับ</h3>
              </div>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-1">•</span>
                  <span>ใช้สำหรับสินค้าที่มารวมกันจากผู้จำหน่ายเดียวกัน</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-1">•</span>
                  <span>
                    เพมะสำหรับสินค้าที่มีวันหมดอายุเดียวกัน
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-1">•</span>
                  <span>ช่วยประหยัดเวลาในการเพิ่มสินค้าจำนวนมาก</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-1">•</span>
                  <span>สามารถติดสามล๊อตสินค้าได้ง่าย</span>
                </li>
              </ul>
            </Card>
          </div>
        </div>
      </div>

      <AddLotDialog
        open={isAddLotDialogOpen}
        onOpenChange={setIsAddLotDialogOpen}
      />
    </div>
  );
};

export default Lots;
