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

interface MultiStockCutDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedProducts: Product[];
  onConfirm: (productIds: string[], quantity: number, note: string) => void;
}

// ✅ helper: format dd/mm/yyyy (Gregorian)
function formatDMY(d = new Date()): string {
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = String(d.getFullYear());
  return `${dd}/${mm}/${yyyy}`;
}

export const MultiStockCutDialog = ({
  open,
  onOpenChange,
  selectedProducts,
  onConfirm,
}: MultiStockCutDialogProps) => {
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
    const cutAmount = Number(data.quantity);

    // check stock ไม่ติดลบ
    const hasExceededStock = selectedProducts.some((product) => cutAmount > product.stock);
    if (hasExceededStock) {
      return;
    }

    // ✅ stamp note สำหรับตัดหลายรายการ
    const stampedNote = `${formatDMY()} - ตัดสต๊อก${data.note ? ` • ${data.note}` : ""}`;

    onConfirm(
      selectedProducts.map((p) => p.id),
      cutAmount,
      stampedNote
    );
    reset();
    onOpenChange(false);
  };

  const handleClose = () => {
    reset();
    onOpenChange(false);
  };

  const cutAmount = Number(quantity) || 0;
  const productsExceedingStock = selectedProducts.filter((p) => cutAmount > p.stock);

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">ตัดสต๊อกหลายรายการ</DialogTitle>
          <DialogDescription>กรอกจำนวนที่ต้องการตัดออกจากสต๊อกของแต่ละรายการ</DialogDescription>
        </DialogHeader>

        <div className="bg-muted p-4 rounded-lg mb-4">
          <h3 className="font-medium mb-3">สินค้าที่เลือก ({selectedProducts.length} รายการ):</h3>
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {selectedProducts.map((product) => (
              <div key={product.id} className="flex justify-between items-center text-sm bg-background p-2 rounded">
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

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="quantity">
              จำนวนที่ต้องการตัด (จากแต่ละรายการ) <span className="text-destructive">*</span>
            </Label>
            <Input
              id="quantity"
              type="number"
              step="0.0001"
              placeholder="0"
              {...register("quantity")}
              className={errors.quantity || productsExceedingStock.length > 0 ? "border-destructive" : ""}
            />
            {errors.quantity && <p className="text-sm text-destructive">{errors.quantity.message}</p>}
            {productsExceedingStock.length > 0 && !errors.quantity && (
              <div className="text-sm text-destructive space-y-1">
                <p className="font-medium">สินค้าต่อไปนี้มีสต๊อกไม่เพียงพอ:</p>
                <ul className="list-disc list-inside">
                  {productsExceedingStock.map((product) => (
                    <li key={product.id}>
                      {product.name} (สต๊อกคงเหลือ: {product.stock.toLocaleString("th-TH")})
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="note">หมายเหตุ</Label>
            <Textarea id="note" placeholder="เหตุผล (ถ้ามี)" {...register("note")} rows={4} />
            {errors.note && <p className="text-sm text-destructive">{errors.note.message}</p>}
          </div>

          <div className="flex gap-3 justify-end pt-4">
            <Button type="button" variant="outline" onClick={handleClose}>
              ยกเลิก
            </Button>
            <Button
              type="submit"
              className="bg-secondary hover:bg-secondary/90"
              disabled={productsExceedingStock.length > 0}
            >
              ตัดสต๊อก
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
