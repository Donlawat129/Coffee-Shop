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

interface AddProductDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode?: "create" | "edit";
  initial?: {
    name: string;
    category: string; // categoryId
    sku: string;
    supplier?: string;
    initialQuantity?: string;
    unit?: string;
    costPrice?: string;
    sellingPrice?: string;
    expiryDate?: string;
    lotNumber?: string;
  };
  onCreate?: (data: {
    name: string;
    categoryId: string;
    sku: string;
    supplier?: string;
    initialQuantity: number;
    unit: string;
    costPrice: number;
    sellingPrice: number;
    expiryDate?: string;
    lotNumber?: string;
  }) => Promise<void>;
  onUpdate?: (data: {
    name: string;
    categoryId: string;
    sku: string;
    supplier?: string;
    unit: string;
    costPrice: number;
    sellingPrice: number;
    expiryDate?: string;
    lotNumber?: string;
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
    category: "",
    sku: "",
    supplier: "",
    initialQuantity: "",
    unit: "",
    costPrice: "",
    sellingPrice: "",
    expiryDate: "",
    lotNumber: "",
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open && initial) {
      setFormData({
        name: initial.name ?? "",
        category: initial.category ?? "",
        sku: initial.sku ?? "",
        supplier: initial.supplier ?? "",
        initialQuantity: initial.initialQuantity ?? "",
        unit: initial.unit ?? "",
        costPrice: initial.costPrice ?? "",
        sellingPrice: initial.sellingPrice ?? "",
        expiryDate: initial.expiryDate ?? "",
        lotNumber: initial.lotNumber ?? "",
      });
    }
  }, [open, initial]);

  const m = mode;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.category) return alert("กรุณาเลือกหมวดหมู่");

    setSubmitting(true);
    try {
      if (m === "create") {
        if (!onCreate) return;
        await onCreate({
          name: formData.name.trim(),
          categoryId: formData.category,
          sku: formData.sku.trim(),
          supplier: formData.supplier.trim() || undefined,
          initialQuantity: Number(formData.initialQuantity || 0),
          unit: formData.unit.trim(),
          costPrice: Number(formData.costPrice || 0),
          sellingPrice: Number(formData.sellingPrice || 0),
          expiryDate: formData.expiryDate || undefined,
          lotNumber: formData.lotNumber.trim() || undefined,
        });
      } else {
        if (!onUpdate) return;
        await onUpdate({
          name: formData.name.trim(),
          categoryId: formData.category,
          sku: formData.sku.trim(),
          supplier: formData.supplier.trim() || undefined,
          unit: formData.unit.trim(),
          costPrice: Number(formData.costPrice || 0),
          sellingPrice: Number(formData.sellingPrice || 0),
          expiryDate: formData.expiryDate || undefined,
          lotNumber: formData.lotNumber.trim() || undefined,
        });
      }
      onOpenChange(false);
      setFormData({
        name: "",
        category: "",
        sku: "",
        supplier: "",
        initialQuantity: "",
        unit: "",
        costPrice: "",
        sellingPrice: "",
        expiryDate: "",
        lotNumber: "",
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
              <Label htmlFor="category">
                หมวดหมู่ <span className="text-destructive">*</span>
              </Label>
              <Select
                value={formData.category}
                onValueChange={(value) =>
                  setFormData({ ...formData, category: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="เลือกหมวดหมู่" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="bakery">เบเกอรี่</SelectItem>
                  <SelectItem value="dairy">นม/ครีม</SelectItem>
                  <SelectItem value="beverage">เครื่องดื่ม</SelectItem>
                  <SelectItem value="equipment">อุปกรณ์</SelectItem>
                  <SelectItem value="other">อื่นๆ</SelectItem>
                </SelectContent>
              </Select>
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
              <Label htmlFor="supplier">ผู้จำหน่าย</Label>
              <Input
                id="supplier"
                value={formData.supplier}
                onChange={(e) =>
                  setFormData({ ...formData, supplier: e.target.value })
                }
              />
            </div>

            {m === "create" && (
              <div className="space-y-2">
                <Label htmlFor="initialQuantity">
                  จำนวนเริ่มต้น <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="initialQuantity"
                  type="number"
                  step="0.0001"
                  value={formData.initialQuantity}
                  onChange={(e) =>
                    setFormData({ ...formData, initialQuantity: e.target.value })
                  }
                  required
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="unit">
                หน่วย <span className="text-destructive">*</span>
              </Label>
              <Input
                id="unit"
                placeholder="กก., ลิตร, ชิ้น"
                value={formData.unit}
                onChange={(e) =>
                  setFormData({ ...formData, unit: e.target.value })
                }
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="costPrice">
                ราคาต้นทุน <span className="text-destructive">*</span>
              </Label>
              <Input
                id="costPrice"
                type="number"
                step="0.01"
                value={formData.costPrice}
                onChange={(e) =>
                  setFormData({ ...formData, costPrice: e.target.value })
                }
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="sellingPrice">
                ราคาขาย <span className="text-destructive">*</span>
              </Label>
              <Input
                id="sellingPrice"
                type="number"
                step="0.01"
                value={formData.sellingPrice}
                onChange={(e) =>
                  setFormData({ ...formData, sellingPrice: e.target.value })
                }
                required
              />
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
