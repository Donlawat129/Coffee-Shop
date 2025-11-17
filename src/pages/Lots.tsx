// src/pages/Lots.tsx
import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PackagePlus, Lightbulb } from "lucide-react";
import { AddLotDialog, type BulkLotPayload } from "@/components/lots/AddLotDialog";
import { useToast } from "@/hooks/use-toast";
import { addProduct } from "@/lib/productsApi";
import {
  addLot,
  addLotItems,
  setLotItemsCount,
  onLotsSubscribe,
  onLotItemsSubscribe,
  getLot,
  type LotHeader,
  type LotItem,
} from "@/lib/lotsApi";

type UiLotRow = {
  id: string;
  lotNumber: string;
  supplier: string;
  expiryDate?: string | null;
  itemsCount: number;
  createdAtISO: string;
};

type UiLotDetail = (LotHeader & { id: string }) | null;
type UiItem = LotItem & { id: string };

const Lots = () => {
  const [isAddLotDialogOpen, setIsAddLotDialogOpen] = useState(false);
  const [lots, setLots] = useState<UiLotRow[]>([]);
  const [selectedLotId, setSelectedLotId] = useState<string | null>(null);
  const [detailLot, setDetailLot] = useState<UiLotDetail>(null);
  const [detailItems, setDetailItems] = useState<UiItem[]>([]);
  const { toast } = useToast();

  // ลิสต์ล๊อตทั้งหมด (realtime)
  useEffect(() => {
    const unsub = onLotsSubscribe((rows: Array<LotHeader & { id: string }>) => {
      const mapped: UiLotRow[] = rows.map((r) => ({
        id: r.id,
        lotNumber: r.lotNumber,
        supplier: r.supplier,
        expiryDate: r.expiryDate ?? null,
        itemsCount: r.itemsCount ?? 0,
        createdAtISO:
          r.createdAt && "toDate" in r.createdAt
            ? r.createdAt.toDate().toISOString()
            : new Date().toISOString(),
      }));
      setLots(mapped);
    });
    return () => unsub();
  }, []);

  // รายละเอียดล๊อตที่ถูกเลือก (realtime)
  useEffect(() => {
    if (!selectedLotId) {
      setDetailLot(null);
      setDetailItems([]);
      return;
    }

    // ป้องกัน set state หลัง unmount/เปลี่ยน lot
    let cancelled = false;

    // โหลดหัวล๊อตครั้งเดียว
    (async () => {
      const hd = await getLot(selectedLotId);
      if (!cancelled) setDetailLot(hd);
    })();

    // subscribe รายการสินค้าในล๊อตแบบ realtime
    const unsubItems = onLotItemsSubscribe(selectedLotId, (rows) => setDetailItems(rows));

    // cleanup
    return () => {
      cancelled = true;
      unsubItems();
    };
  }, [selectedLotId]);


  const handleBulkCreate = async ({ lotHeader, items }: BulkLotPayload) => {
    // 1) สร้างหัวล๊อต
    const lotId = await addLot({
      lotNumber: lotHeader.lotNumber,
      supplier: lotHeader.supplier,
      expiryDate: lotHeader.expiryDate,
    });

    // 2) ยิงเพิ่มสินค้าแบบหน้า Products ทีละตัว
    await Promise.all(
      items.map((it) =>
        addProduct({
          name: it.name,
          sku: it.sku,
          unit: it.unit,
          categoryId: it.unit, // compatibility
          initialQuantity: it.stock,
          costPrice: 0,
          sellingPrice: 0,
          expiryDate: it.expiryDate ?? lotHeader.expiryDate,
          lotNumber: it.lotNumber ?? lotHeader.lotNumber,
          supplier: lotHeader.supplier,
        })
      )
    );

    // 3) บันทึกรายการเข้า subcollection lots/{id}/items
    const lotItems: LotItem[] = items.map((it) => ({
      name: it.name,
      sku: it.sku,
      unit: it.unit,
      stock: it.stock,
      expiryDate: it.expiryDate ?? lotHeader.expiryDate ?? null,
      lotNumber: it.lotNumber ?? lotHeader.lotNumber ?? null,
      productId: null, // สามารถปรับให้เก็บ productId จริงได้ถ้า addProduct คืน id
    }));
    await addLotItems(lotId, lotItems);

    // 4) อัปเดตจำนวนรายการ
    await setLotItemsCount(lotId, items.length);

    toast({
      title: "บันทึกล๊อตสำเร็จ",
      description: `เพิ่มสินค้า ${items.length} รายการ`,
    });
    setIsAddLotDialogOpen(false);

    // เปิดรายละเอียดล๊อตที่เพิ่งสร้างด้านล่างทันที
    setSelectedLotId(lotId);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 space-y-6">
        {/* header */}
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">เพิ่มสินค้าเป็นล๊อต</h2>
          <Button onClick={() => setIsAddLotDialogOpen(true)} className="bg-success hover:bg-success/90">
            <PackagePlus className="w-4 h-4 mr-2" />
            เพิ่มล๊อตใหม่
          </Button>
        </div>

        {/* grid บน: ล็อตล่าสุด + ทิปส์ */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* ลิสต์ล๊อตล่าสุด */}
          <div className="lg:col-span-2">
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">ล๊อตล่าสุด</h3>
              {lots.length === 0 ? (
                <p className="text-sm text-muted-foreground">ยังไม่มีข้อมูลล๊อต</p>
              ) : (
                <div className="space-y-3">
                  {lots.map((lot) => (
                    <div
                      key={lot.id}
                      className="flex items-center justify-between p-4 rounded-lg border hover:bg-muted/40 transition-colors"
                    >
                      <div>
                        <div className="font-medium">
                          ล๊อต: {lot.lotNumber}
                          <span className="text-muted-foreground"> • ผู้จำหน่าย: {lot.supplier}</span>
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          สินค้า: {lot.itemsCount} รายการ
                          {lot.expiryDate ? ` • หมดอายุ: ${lot.expiryDate}` : ""} •
                          เพิ่มเมื่อ: {new Date(lot.createdAtISO).toLocaleString("th-TH")}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant={selectedLotId === lot.id ? "default" : "outline"}
                          onClick={() => setSelectedLotId(lot.id)}
                        >
                          {selectedLotId === lot.id ? "กำลังแสดง" : "ดูสินค้า"}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>

          {/* ทิปส์ */}
          <div className="lg:col-span-1">
            <Card className="p-6 bg-accent/10 border-accent/20">
              <div className="flex items-center gap-2 mb-4">
                <Lightbulb className="w-5 h-5 text-primary" />
                <h3 className="font-semibold">เคล็ดลับ</h3>
              </div>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-start gap-2"><span className="text-primary mt-1">•</span><span>เหมาะกับสินค้าเข้าพร้อมกันจากผู้จำหน่ายเดียวกัน</span></li>
                <li className="flex items-start gap-2"><span className="text-primary mt-1">•</span><span>ตั้งวันหมดอายุที่หัวล๊อต แล้วปรับรายรายการได้</span></li>
                <li className="flex items-start gap-2"><span className="text-primary mt-1">•</span><span>ช่วยเพิ่มสินค้าจำนวนมากได้รวดเร็ว</span></li>
                <li className="flex items-start gap-2"><span className="text-primary mt-1">•</span><span>ติดตามย้อนกลับด้วยเลขล๊อตได้ง่าย</span></li>
              </ul>
            </Card>
          </div>
        </div>

        {/* โซนล่าง: รายละเอียดล๊อตที่เลือก */}
        {selectedLotId && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-semibold">รายละเอียดล๊อต</h3>
              <Button variant="outline" onClick={() => setSelectedLotId(null)}>
                ปิดรายละเอียด
              </Button>
            </div>

            {detailLot ? (
              <Card className="p-6">
                <div className="grid md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <div className="text-muted-foreground">เลขล๊อต</div>
                    <div className="font-medium">{detailLot.lotNumber}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">ผู้จำหน่าย</div>
                    <div className="font-medium">{detailLot.supplier}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">วันหมดอายุ</div>
                    <div className="font-medium">{detailLot.expiryDate || "-"}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">จำนวนสินค้า</div>
                    <div className="font-medium">
                      {detailLot.itemsCount ?? detailItems.length} รายการ
                    </div>
                  </div>
                </div>
              </Card>
            ) : (
              <Card className="p-6">
                <p className="text-sm text-muted-foreground">กำลังโหลดหัวล๊อต…</p>
              </Card>
            )}

            <Card className="p-6">
              <h4 className="text-lg font-semibold mb-4">สินค้าทั้งหมดในล๊อต</h4>
              {detailItems.length === 0 ? (
                <p className="text-sm text-muted-foreground">ยังไม่มีสินค้าในล๊อตนี้</p>
              ) : (
                <div className="space-y-2">
                  {detailItems.map((it) => (
                    <div
                      key={it.id}
                      className="grid md:grid-cols-6 gap-3 p-3 rounded-lg border hover:bg-muted/40"
                    >
                      <div className="md:col-span-2">
                        <div className="font-medium">{it.name}</div>
                        <div className="text-xs text-muted-foreground">SKU: {it.sku}</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground text-xs">หน่วย</div>
                        <div className="font-medium">{it.unit}</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground text-xs">จำนวน</div>
                        <div className="font-medium">
                          {it.stock.toLocaleString("th-TH", { maximumFractionDigits: 4 })}
                        </div>
                      </div>
                      <div>
                        <div className="text-muted-foreground text-xs">หมดอายุ</div>
                        <div className="font-medium">{it.expiryDate || "-"}</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground text-xs">เลขล๊อต</div>
                        <div className="font-medium">{it.lotNumber || "-"}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>
        )}
      </div>

      <AddLotDialog
        open={isAddLotDialogOpen}
        onOpenChange={setIsAddLotDialogOpen}
        onBulkCreate={handleBulkCreate}
      />
    </div>
  );
};

export default Lots;
