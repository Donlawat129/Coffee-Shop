import { useEffect, useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PackagePlus, Lightbulb, Pencil, Trash2 } from "lucide-react";
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
  deleteLotHard,
  deleteLotsBefore, // ✅ new
} from "@/lib/lotsApi";
import { db } from "@/lib/firebase";
import { doc, updateDoc, serverTimestamp } from "firebase/firestore";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

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

  // ====== Edit header dialog state ======
  const [editOpen, setEditOpen] = useState(false);
  const [editLotNumber, setEditLotNumber] = useState("");
  const [editExpiry, setEditExpiry] = useState("");
  const [editType, setEditType] = useState<"new" | "existing">("new");
  const [editNote, setEditNote] = useState(""); // ✅ note
  const editLabel = editType === "new" ? "ล๊อตใหม่" : "ล๊อตเดิม";

  // ====== Bulk delete dialog state ======
  const [bulkOpen, setBulkOpen] = useState(false);
  const [bulkDate, setBulkDate] = useState("");
  const [bulkDeleting, setBulkDeleting] = useState(false);

  // ลิสต์ล๊อตทั้งหมด (realtime)
  useEffect(() => {
    const unsub = onLotsSubscribe((rows: Array<LotHeader & { id: string }>) => {
      const mapped: UiLotRow[] = rows.map((r) => ({
        id: r.id,
        lotNumber: r.lotNumber,
        supplier: r.supplier ?? "",
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

    let cancelled = false;
    (async () => {
      const hd = await getLot(selectedLotId);
      if (!cancelled) setDetailLot(hd);
    })();

    const unsubItems = onLotItemsSubscribe(selectedLotId, (rows) => setDetailItems(rows));
    return () => {
      cancelled = true;
      unsubItems();
    };
  }, [selectedLotId]);

  const existingLotsForDialog = useMemo(
    () => lots.map(l => ({ id: l.id, lotNumber: l.lotNumber, expiryDate: l.expiryDate ?? undefined })),
    [lots]
  );

  const handleBulkCreate = async ({ mode, existingLotId, lotHeader, items }: BulkLotPayload) => {
    let lotId = existingLotId || "";

    // 1) ถ้าเป็นล๊อตใหม่ → สร้างหัวล๊อต (ใช้ supplier เก็บ "ล๊อตใหม่")
    if (mode === "new") {
      lotId = await addLot({
        lotNumber: lotHeader.lotNumber,
        supplier: "ล๊อตใหม่",
        expiryDate: lotHeader.expiryDate,
        /** ✅ บันทึกหมายเหตุหัวล๊อต */
        note: lotHeader.note,
      });
    }

    // 2) เพิ่มสินค้าเข้าคลัง (Products) ทีละตัว
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
      productId: null,
    }));
    await addLotItems(lotId, lotItems);

    // 4) อัปเดตจำนวนรายการ (เพิ่มตามจำนวนที่ใส่เข้ามา)
    await setLotItemsCount(lotId, (detailLot?.itemsCount ?? 0) + items.length);

    toast({
      title: mode === "new" ? "สร้างล๊อตใหม่สำเร็จ" : "เพิ่มสินค้าเข้า 'ล๊อตเดิม' สำเร็จ",
      description: `เพิ่มสินค้า ${items.length} รายการ`,
    });
    setIsAddLotDialogOpen(false);
    setSelectedLotId(lotId);
  };

  // ====== เปิด dialog แก้ไขหัวล๊อต ======
  const openEditHeader = () => {
    if (!detailLot) return;
    setEditLotNumber(detailLot.lotNumber || "");
    setEditExpiry(detailLot.expiryDate || "");
    setEditType((detailLot.supplier ?? "ล๊อตใหม่") === "ล๊อตเดิม" ? "existing" : "new");
    setEditNote(detailLot.note ?? ""); // ✅ โหลด note เดิม
    setEditOpen(true);
  };

  const saveEditHeader = async () => {
    if (!detailLot) return;
    const ref = doc(db, "lots", detailLot.id);
    await updateDoc(ref, {
      lotNumber: editLotNumber.trim(),
      expiryDate: editExpiry || null,
      supplier: editLabel, // "ล๊อตใหม่"/"ล๊อตเดิม"
      /** ✅ บันทึก note */
      note: editNote.trim() || null,
      updatedAt: serverTimestamp(),
    });
    setEditOpen(false);
    toast({ title: "อัปเดตหัวล๊อตแล้ว", description: "แก้ไขข้อมูลหัวล๊อตสำเร็จ" });
  };

  const deleteCurrentLot = async () => {
    if (!detailLot) return;
    const ok = confirm(
      "ยืนยันลบล๊อตนี้พร้อมรายการสินค้าทั้งหมดในล๊อต?\n(ลบถาวรและไม่สามารถกู้คืนได้)"
    );
    if (!ok) return;

    await deleteLotHard(detailLot.id);
    setEditOpen(false);
    setSelectedLotId(null);
    toast({
      title: "ลบล๊อตสำเร็จ",
      description: "ลบหัวล๊อตและรายการทั้งหมดภายใต้ล๊อตแล้ว",
    });
  };

  // ====== ลบล๊อตเก่าตามวันที่ ======
  const doBulkDelete = async () => {
    if (!bulkDate) {
      alert("กรุณาเลือกวันที่");
      return;
    }
    setBulkDeleting(true);
    try {
      const n = await deleteLotsBefore(bulkDate);
      setBulkOpen(false);
      setBulkDate("");
      toast({
        title: "ลบล๊อตเก่าแล้ว",
        description: `ลบ ${n} ล๊อตที่สร้างก่อนหรือในวันที่ ${bulkDate}`,
      });
      // รีเฟรช state: onLotsSubscribe จะอัปเดตให้อัตโนมัติ
    } finally {
      setBulkDeleting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 space-y-6">
        {/* header */}
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">เพิ่มสินค้าเป็นล๊อต</h2>
          <div className="flex gap-2">
            <Button onClick={() => setIsAddLotDialogOpen(true)} className="bg-success hover:bg-success/90">
              <PackagePlus className="w-4 h-4 mr-2" />
              เพิ่มล๊อตใหม่ / ใช้ล๊อตเดิม
            </Button>
            {/* ✅ ปุ่มลบล๊อตเก่า */}
            <Button variant="outline" onClick={() => setBulkOpen(true)}>
              <Trash2 className="w-4 h-4 mr-2" />
              ลบล๊อตเก่า…
            </Button>
          </div>
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
                          <span className="text-muted-foreground"> • ประเภท: {lot.supplier || "-"}</span>
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
                <li className="flex items-start gap-2"><span className="text-primary mt-1">•</span><span>เลือก “ล๊อตเดิม” เมื่อต้องการเพิ่มสินค้าเข้าสู่ล๊อตที่มีอยู่</span></li>
                <li className="flex items-start gap-2"><span className="text-primary mt-1">•</span><span>เลือก “ล๊อตใหม่” เมื่อเริ่มล็อตสินค้าใหม่</span></li>
                <li className="flex items-start gap-2"><span className="text-primary mt-1">•</span><span>ตั้งวันหมดอายุที่หัวล๊อต แล้วปรับรายรายการได้</span></li>
              </ul>
            </Card>
          </div>
        </div>

        {/* โซนล่าง: รายละเอียดล๊อตที่เลือก */}
        {selectedLotId && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-semibold">รายละเอียดล๊อต</h3>
              <div className="flex gap-2">
                <Button variant="outline" onClick={openEditHeader}>
                  <Pencil className="w-4 h-4 mr-1" />
                  แก้ไขหัวล๊อต
                </Button>
                <Button variant="outline" onClick={() => setSelectedLotId(null)}>
                  ปิดรายละเอียด
                </Button>
              </div>
            </div>

            {detailLot ? (
              <Card className="p-6 space-y-4">
                <div className="grid md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <div className="text-muted-foreground">เลขล๊อต</div>
                    <div className="font-medium">{detailLot.lotNumber}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">ประเภท</div>
                    <div className="font-medium">{detailLot.supplier ?? "-"}</div>
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

                {/* ✅ แสดงหมายเหตุหัวล๊อต */}
                <div className="text-sm">
                  <div className="text-muted-foreground">หมายเหตุ</div>
                  <div className="font-medium whitespace-pre-wrap">{detailLot.note || "-"}</div>
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
        existingLots={existingLotsForDialog}
      />

      {/* ===== Edit Header Dialog ===== */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>แก้ไขหัวล๊อต</DialogTitle>
          </DialogHeader>

          <div className="space-y-3">
            <div className="space-y-2">
              <Label>ประเภทล๊อต</Label>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant={editType === "new" ? "default" : "outline"}
                  onClick={() => setEditType("new")}
                >
                  ล๊อตใหม่
                </Button>
                <Button
                  variant={editType === "existing" ? "default" : "outline"}
                  onClick={() => setEditType("existing")}
                >
                  ล๊อตเดิม
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label>หมายเลขล๊อต</Label>
              <Input value={editLotNumber} onChange={(e) => setEditLotNumber(e.target.value)} />
            </div>

            <div className="space-y-2">
              <Label>วันหมดอายุ</Label>
              <Input type="date" value={editExpiry} onChange={(e) => setEditExpiry(e.target.value)} />
            </div>

            {/* ✅ แก้ไขหมายเหตุหัวล๊อต */}
            <div className="space-y-2">
              <Label>หมายเหตุ</Label>
              <Textarea rows={3} value={editNote} onChange={(e) => setEditNote(e.target.value)} />
            </div>

            <div className="flex justify-between items-center gap-2 pt-2">
              <Button variant="destructive" onClick={deleteCurrentLot}>
                ลบล๊อตนี้
              </Button>

              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setEditOpen(false)}>ยกเลิก</Button>
                <Button onClick={saveEditHeader}>บันทึก</Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ===== Bulk Delete Old Lots Dialog ===== */}
      <Dialog open={bulkOpen} onOpenChange={(o) => !bulkDeleting && setBulkOpen(o)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>ลบล๊อตเก่า</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-2">
              <Label>ลบล๊อตที่สร้างก่อนหรือในวันที่</Label>
              <Input type="date" value={bulkDate} onChange={(e) => setBulkDate(e.target.value)} />
            </div>
            <p className="text-sm text-muted-foreground">
              ระบบจะลบหัวล๊อตและรายการภายในล๊อตทั้งหมดที่สร้างก่อนหรือภายในวันที่ที่เลือก (ลบถาวร)
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setBulkOpen(false)} disabled={bulkDeleting}>
                ยกเลิก
              </Button>
              <Button variant="destructive" onClick={doBulkDelete} disabled={bulkDeleting || !bulkDate}>
                {bulkDeleting ? "กำลังลบ…" : "ลบล๊อตเก่า"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Lots;
