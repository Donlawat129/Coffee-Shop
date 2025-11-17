import { useState } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Plus, Trash2 } from "lucide-react";
import { Card } from "@/components/ui/card";

export type BulkLotItemInput = {
  id: string;        // client-only id สำหรับ list
  name: string;
  sku: string;
  unit: string;
  stock: string;     // เก็บเป็น string ในฟอร์ม แล้วค่อย parse เป็น number ตอน submit
  expiryDate?: string;
  lotNumber?: string;
};

export type BulkLotPayload = {
  lotHeader: {
    lotNumber: string;
    supplier: string;
    expiryDate?: string;
  };
  items: Array<{
    name: string;
    sku: string;
    unit: string;
    stock: number;
    expiryDate?: string;
    lotNumber?: string;
  }>;
};

type AddLotDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onBulkCreate: (payload: BulkLotPayload) => Promise<void>;
};

const UNIT_OPTIONS = [
  "กิโลกรัม", "กรัม", "ลิตร", "มิลลิลิตร", "ชิ้น", "กล่อง", "แพ็ค", "ซอง", "อื่นๆ",
];

export function AddLotDialog({ open, onOpenChange, onBulkCreate }: AddLotDialogProps) {
  const [lotNumber, setLotNumber] = useState("");
  const [supplier, setSupplier] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [products, setProducts] = useState<BulkLotItemInput[]>([
    { id: "1", name: "", sku: "", unit: "", stock: "", expiryDate: "", lotNumber: "" },
  ]);

  const addProductRow = () => {
    setProducts((prev) => [
      ...prev,
      { id: String(Date.now()), name: "", sku: "", unit: "", stock: "", expiryDate: "", lotNumber: "" },
    ]);
  };

  const removeProductRow = (id: string) => {
    setProducts((prev) => (prev.length > 1 ? prev.filter((p) => p.id !== id) : prev));
  };

  const updateProduct = <K extends keyof BulkLotItemInput>(
    id: string,
    field: K,
    value: BulkLotItemInput[K]
  ) => {
    setProducts((prev) => prev.map((p) => (p.id === id ? { ...p, [field]: value } : p)));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // validate basic
    if (!lotNumber.trim() || !supplier.trim()) {
      alert("กรอกหมายเลขล๊อตและผู้จำหน่ายให้ครบ");
      return;
    }
    const mapped = products.map((p) => {
      const stockNum = Number(p.stock);
      return {
        name: p.name.trim(),
        sku: p.sku.trim(),
        unit: p.unit.trim(),
        stock: Number.isFinite(stockNum) ? stockNum : 0,
        expiryDate: (p.expiryDate || undefined) ?? undefined,
        lotNumber: (p.lotNumber || undefined) ?? undefined,
      };
    });

    setSubmitting(true);
    try {
      await onBulkCreate({
        lotHeader: {
          lotNumber: lotNumber.trim(),
          supplier: supplier.trim(),
          expiryDate: expiryDate || undefined,
        },
        items: mapped,
      });

      // reset form
      onOpenChange(false);
      setLotNumber("");
      setSupplier("");
      setExpiryDate("");
      setProducts([{ id: "1", name: "", sku: "", unit: "", stock: "", expiryDate: "", lotNumber: "" }]);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !submitting && onOpenChange(o)}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">เพิ่มสินค้าเป็นล๊อต</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* ข้อมูลล๊อต */}
          <div className="bg-muted/30 p-4 rounded-lg">
            <h3 className="font-semibold mb-4">ข้อมูลล๊อต</h3>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="lotNumber">หมายเลขล๊อต <span className="text-destructive">*</span></Label>
                <Input id="lotNumber" value={lotNumber} onChange={(e) => setLotNumber(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="supplier">ผู้จำหน่าย <span className="text-destructive">*</span></Label>
                <Input id="supplier" value={supplier} onChange={(e) => setSupplier(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="expiryDate">วันหมดอายุ (หัวล๊อต)</Label>
                <Input id="expiryDate" type="date" value={expiryDate} onChange={(e) => setExpiryDate(e.target.value)} />
              </div>
            </div>
          </div>

          {/* รายการสินค้า */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">รายการสินค้า</h3>
              <Button type="button" onClick={addProductRow} size="sm" className="bg-success hover:bg-success/90">
                <Plus className="w-4 h-4 mr-1" />
                เพิ่มสินค้า
              </Button>
            </div>

            <div className="space-y-4">
              {products.map((product, idx) => (
                <Card key={product.id} className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-medium">สินค้าที่ {idx + 1}</h4>
                    {products.length > 1 && (
                      <Button type="button" variant="ghost" size="icon" onClick={() => removeProductRow(product.id)}>
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>ชื่อสินค้า <span className="text-destructive">*</span></Label>
                      <Input
                        value={product.name}
                        onChange={(e) => updateProduct(product.id, "name", e.target.value)}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>SKU <span className="text-destructive">*</span></Label>
                      <Input
                        value={product.sku}
                        onChange={(e) => updateProduct(product.id, "sku", e.target.value)}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>จำนวน <span className="text-destructive">*</span></Label>
                      <Input
                        type="number"
                        step="0.0001"
                        value={product.stock}
                        onChange={(e) => updateProduct(product.id, "stock", e.target.value)}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>หน่วยนับ <span className="text-destructive">*</span></Label>
                      <Select
                        value={product.unit}
                        onValueChange={(v) => updateProduct(product.id, "unit", v)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="เลือกหน่วยนับ" />
                        </SelectTrigger>
                        <SelectContent>
                          {UNIT_OPTIONS.map((u) => (
                            <SelectItem key={u} value={u}>{u}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>วันหมดอายุ (ต่อชิ้น)</Label>
                      <Input
                        type="date"
                        value={product.expiryDate}
                        onChange={(e) => updateProduct(product.id, "expiryDate", e.target.value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>เลขล๊อต (ต่อชิ้น)</Label>
                      <Input
                        value={product.lotNumber}
                        onChange={(e) => updateProduct(product.id, "lotNumber", e.target.value)}
                        placeholder="ไม่ระบุก็จะใช้เลขล๊อตหัวข้อด้านบน"
                      />
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>

          <div className="flex gap-3 justify-end pt-4 border-t">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
              ยกเลิก
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? "กำลังบันทึก..." : "บันทึกล๊อต"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
