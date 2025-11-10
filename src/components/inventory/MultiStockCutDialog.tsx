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

interface MultiStockCutDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedProducts: Product[];
}

export const MultiStockCutDialog = ({
  open,
  onOpenChange,
  selectedProducts,
}: MultiStockCutDialogProps) => {
  const [quantity, setQuantity] = useState("");
  const [note, setNote] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Multi stock cut:", { selectedProducts, quantity, note });
    onOpenChange(false);
    setQuantity("");
    setNote("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">
            ตัดสต๊อกหลายรายการ
          </DialogTitle>
        </DialogHeader>

        <div className="bg-muted p-4 rounded-lg mb-4">
          <h3 className="font-medium mb-3">
            สินค้าที่เลือก ({selectedProducts.length} รายการ):
          </h3>
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {selectedProducts.map((product) => (
              <div
                key={product.id}
                className="flex justify-between items-center text-sm bg-background p-2 rounded"
              >
                <span className="font-medium">{product.name}</span>
                <span className="text-muted-foreground">
                  สต๊อก:{" "}
                  {product.stock.toLocaleString("th-TH", {
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 4,
                  })}
                </span>
              </div>
            ))}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="quantity">
              จำนวนที่ต้องการตัด (จากแต่ละรายการ){" "}
              <span className="text-destructive">*</span>
            </Label>
            <Input
              id="quantity"
              type="number"
              step="0.0001"
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
              rows={4}
            />
          </div>

          <div className="flex gap-3 justify-end pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              ยกเลิก
            </Button>
            <Button type="submit" className="bg-secondary hover:bg-secondary/90">
              ตัดสต๊อก
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
