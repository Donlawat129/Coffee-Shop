import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const stockCutSchema = z.object({
  quantity: z
    .string()
    .min(1, "กรุณากรอกจำนวน")
    .refine((val) => !isNaN(Number(val)) && Number(val) > 0, {
      message: "จำนวนต้องมากกว่า 0",
    }),
  note: z.string().max(500, "หมายเหตุต้องไม่เกิน 500 ตัวอักษร").optional(),
});

type StockCutForm = z.infer<typeof stockCutSchema>;

interface Product {
  id: string;
  name: string;
  sku: string;
  stock: number;
}

interface SingleStockCutDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: Product | null;
  onConfirm: (productId: string, quantity: number, note: string) => void;
}

export const SingleStockCutDialog = ({
  open,
  onOpenChange,
  product,
  onConfirm,
}: SingleStockCutDialogProps) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
  } = useForm<StockCutForm>({
    resolver: zodResolver(stockCutSchema),
  });

  const quantity = watch("quantity");

  const onSubmit = (data: StockCutForm) => {
    if (!product) return;
    
    const cutAmount = Number(data.quantity);
    if (cutAmount > product.stock) {
      return;
    }

    onConfirm(product.id, cutAmount, data.note || "");
    reset();
    onOpenChange(false);
  };

  const handleClose = () => {
    reset();
    onOpenChange(false);
  };

  if (!product) return null;

  const cutAmount = Number(quantity) || 0;
  const remainingStock = product.stock - cutAmount;
  const isExceedingStock = cutAmount > product.stock;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">ตัดสต๊อกสินค้า</DialogTitle>
          <DialogDescription>
            กรอกจำนวนที่ต้องการตัดออกจากสต๊อก
          </DialogDescription>
        </DialogHeader>

        <div className="bg-muted p-4 rounded-lg mb-4">
          <h3 className="font-medium mb-3">สินค้าที่เลือก (1 รายการ):</h3>
          <div className="flex justify-between items-center text-sm bg-background p-3 rounded">
            <span className="font-medium">{product.name}</span>
            <span className="text-muted-foreground">
              สต๊อก:{" "}
              {product.stock.toLocaleString("th-TH", {
                minimumFractionDigits: 0,
                maximumFractionDigits: 4,
              })}
            </span>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="quantity">
              จำนวนที่ต้องการตัด (จากแต่ละรายการ){" "}
              <span className="text-destructive">*</span>
            </Label>
            <Input
              id="quantity"
              type="number"
              step="0.0001"
              placeholder="0"
              {...register("quantity")}
              className={errors.quantity || isExceedingStock ? "border-destructive" : ""}
            />
            {errors.quantity && (
              <p className="text-sm text-destructive">{errors.quantity.message}</p>
            )}
            {isExceedingStock && !errors.quantity && (
              <p className="text-sm text-destructive">
                จำนวนที่ต้องการตัดมากกว่าสต๊อกที่มีอยู่
              </p>
            )}
            {cutAmount > 0 && !isExceedingStock && (
              <p className="text-sm text-muted-foreground">
                สต๊อกคงเหลือหลังตัด:{" "}
                <span className="font-medium">
                  {remainingStock.toLocaleString("th-TH", {
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 4,
                  })}
                </span>
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="note">หมายเหตุ</Label>
            <Textarea
              id="note"
              placeholder="ระบุเหตุผลในการตัดสต๊อก (ถ้ามี)"
              {...register("note")}
              rows={4}
            />
            {errors.note && (
              <p className="text-sm text-destructive">{errors.note.message}</p>
            )}
          </div>

          <div className="flex gap-3 justify-end pt-4">
            <Button type="button" variant="outline" onClick={handleClose}>
              ยกเลิก
            </Button>
            <Button
              type="submit"
              className="bg-secondary hover:bg-secondary/90"
              disabled={isExceedingStock}
            >
              ตัดสต๊อก
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
