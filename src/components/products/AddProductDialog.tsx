import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

interface AddProductDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode?: "create" | "edit";
  initial?: {
    name: string;
    category: string; // ใช้เป็น "unit" ที่เลือก
    sku: string;
    unit?: string;
    stock?: number;
    expiryDate?: string;
    lotNumber?: string;
    note?: string;         // ✅ new
  };
  onCreate?: (data: {
    name: string;
    sku: string;
    unit: string;
    stock: number;
    expiryDate?: string;
    lotNumber?: string;
    note?: string;         // ✅ new
  }) => Promise<void>;
  onUpdate?: (data: {
    name: string;
    sku: string;
    unit: string;
    stock: number;
    expiryDate?: string;
    lotNumber?: string;
    note?: string;         // ✅ new
  }) => Promise<void>;
}

export const AddProductDialog = ({
  open,
  onOpenChange,
  mode = "create",
  initial,
  onCreate,
  onUpdate,
}: AddProductDialogProps) => {
  const [formData, setFormData] = useState({
    name: "",
    category: "", // เก็บ unit ที่เลือก
    sku: "",
    unit: "",
    stock: "",
    expiryDate: "",
    lotNumber: "",
    note: "",          // ✅ new
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open && initial) {
      setFormData({
        name: initial.name ?? "",
        category: initial.category ?? "",
        sku: initial.sku ?? "",
        unit: initial.unit ?? initial.category ?? "",
        stock: initial.stock != null ? String(initial.stock) : "",
        expiryDate: initial.expiryDate ?? "",
        lotNumber: initial.lotNumber ?? "",
        note: initial.note ?? "",   // ✅ new
      });
    }
  }, [open, initial]);

  const m = mode;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.category) return alert("กรุณาเลือกหน่วยนับ");

    const stockNum = Number(formData.stock);
    if (!Number.isFinite(stockNum) || stockNum < 0) {
      return alert("กรุณาใส่สต๊อกเริ่มต้นให้ถูกต้อง (ต้องเป็นตัวเลขและไม่ติดลบ)");
    }

    setSubmitting(true);
    try {
      const payload = {
        name: formData.name.trim(),
        sku: formData.sku.trim(),
        unit: (formData.category || formData.unit).trim(),
        stock: stockNum,
        expiryDate: formData.expiryDate || undefined,
        lotNumber: formData.lotNumber.trim() || undefined,
        note: formData.note.trim() || undefined,      // ✅ new
      };

      if (m === "create") {
        if (!onCreate) return;
        await onCreate(payload);
      } else {
        if (!onUpdate) return;
        await onUpdate(payload);
      }

      onOpenChange(false);
      setFormData({
        name: "",
        category: "",
        sku: "",
        unit: "",
        stock: "",
        expiryDate: "",
        lotNumber: "",
        note: "",         // ✅ reset
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">
            {m === "create" ? "เพิ่มสินค้าใหม่" : "แก้ไขสินค้า"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">
                ชื่อสินค้า <span className="text-destructive">*</span>
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="sku">
                SKU <span className="text-destructive">*</span>
              </Label>
              <Input
                id="sku"
                value={formData.sku}
                onChange={(e) =>
                  setFormData({ ...formData, sku: e.target.value })
                }
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="stock">
                สต๊อกเริ่มต้น <span className="text-destructive">*</span>
              </Label>
              <Input
                id="stock"
                type="number"
                step="0.0001"
                min="0"
                placeholder="0"
                value={formData.stock}
                onChange={(e) =>
                  setFormData({ ...formData, stock: e.target.value })
                }
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">
                หน่วยนับ <span className="text-destructive">*</span>
              </Label>
              <Select
                value={formData.category}
                onValueChange={(value) =>
                  setFormData({ ...formData, category: value, unit: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="เลือกหน่วยนับ" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="กิโลกรัม">กิโลกรัม</SelectItem>
                  <SelectItem value="กรัม">กรัม</SelectItem>
                  <SelectItem value="ลิตร">ลิตร</SelectItem>
                  <SelectItem value="มิลลิลิตร">มิลลิลิตร</SelectItem>
                  <SelectItem value="ชิ้น">ชิ้น</SelectItem>
                  <SelectItem value="กล่อง">กล่อง</SelectItem>
                  <SelectItem value="แพ็ค">แพ็ค</SelectItem>
                  <SelectItem value="ซอง">ซอง</SelectItem>
                  <SelectItem value="อื่นๆ"> อื่นๆ</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="expiryDate">วันหมดอายุ</Label>
              <Input
                id="expiryDate"
                type="date"
                value={formData.expiryDate}
                onChange={(e) =>
                  setFormData({ ...formData, expiryDate: e.target.value })
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="lotNumber">หมายเลขล็อต</Label>
              <Input
                id="lotNumber"
                value={formData.lotNumber}
                onChange={(e) =>
                  setFormData({ ...formData, lotNumber: e.target.value })
                }
              />
            </div>

            {/* ✅ หมายเหตุสินค้า */}
            <div className="space-y-2 col-span-2">
              <Label htmlFor="note">หมายเหตุสินค้า</Label>
              <Textarea
                id="note"
                rows={3}
                value={formData.note}
                onChange={(e) =>
                  setFormData({ ...formData, note: e.target.value })
                }
                placeholder='เช่น "สินค้ากลุ่มคั่วอ่อน" หรือ "เก็บแยกจากความชื้น"'
              />
            </div>
          </div>

          <div className="flex gap-3 justify-end pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={submitting}
            >
              ยกเลิก
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting
                ? "กำลังบันทึก..."
                : m === "create"
                ? "บันทึก"
                : "บันทึกการแก้ไข"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
