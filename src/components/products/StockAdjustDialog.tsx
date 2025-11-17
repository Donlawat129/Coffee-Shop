import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface Product {
  id: string;
  name: string;
  sku: string;
  stock: number;
}

interface StockAdjustDialogProps {
  product: Product;
  type: "add" | "remove";
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdjust: (qty: number, note?: string) => Promise<void>;
}

export const StockAdjustDialog = ({
  product,
  type,
  open,
  onOpenChange,
  onAdjust,
}: StockAdjustDialogProps) => {
  const [quantity, setQuantity] = useState("");
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const q = Number(quantity);
    if (!Number.isFinite(q) || q <= 0) return alert("กรุณาใส่จำนวนที่มากกว่า 0");
    if (type === "remove" && q > product.stock) {
      return alert("จำนวนตัดมากกว่าสต๊อกคงเหลือ");
    }

    setSubmitting(true);
    try {
      await onAdjust(q, note || undefined);
      onOpenChange(false);
      setQuantity("");
      setNote("");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">
            {type === "add" ? "เติมสต๊อก" : "ตัดสต๊อก"}
          </DialogTitle>
        </DialogHeader>

        <div className="bg-muted p-3 rounded-lg mb-4">
          <div className="flex justify-between items-center">
            <span className="font-medium">{product.name}</span>
            <span className="text-sm text-muted-foreground">
              สต๊อกปัจจุบัน:{" "}
              {product.stock.toLocaleString("th-TH", {
                minimumFractionDigits: 0,
                maximumFractionDigits: 4,
              })}
            </span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="quantity">
              จำนวน <span className="text-destructive">*</span>
            </Label>
            <Input
              id="quantity"
              type="number"
              step="0.0001"
              min="0.0001"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="note">หมายเหตุ</Label>
            <Textarea
              id="note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
            />
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
            <Button
              type="submit"
              variant={type === "add" ? "default" : "destructive"}
              className={type === "add" ? "bg-success hover:bg-success/90" : ""}
              disabled={submitting}
            >
              {submitting ? "กำลังบันทึก..." : type === "add" ? "เติมสต๊อก" : "ตัดสต๊อก"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
