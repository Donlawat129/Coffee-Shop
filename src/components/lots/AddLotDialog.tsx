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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Trash2 } from "lucide-react";
import { Card } from "@/components/ui/card";

interface AddLotDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface ProductItem {
  id: string;
  name: string;
  category: string;
  sku: string;
  quantity: string;
  unit: string;
  costPrice: string;
  sellingPrice: string;
}

export const AddLotDialog = ({ open, onOpenChange }: AddLotDialogProps) => {
  const [lotNumber, setLotNumber] = useState("");
  const [supplier, setSupplier] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [products, setProducts] = useState<ProductItem[]>([
    {
      id: "1",
      name: "",
      category: "",
      sku: "",
      quantity: "",
      unit: "",
      costPrice: "",
      sellingPrice: "",
    },
  ]);

  const addProduct = () => {
    const newProduct: ProductItem = {
      id: Date.now().toString(),
      name: "",
      category: "",
      sku: "",
      quantity: "",
      unit: "",
      costPrice: "",
      sellingPrice: "",
    };
    setProducts([...products, newProduct]);
  };

  const removeProduct = (id: string) => {
    if (products.length > 1) {
      setProducts(products.filter((p) => p.id !== id));
    }
  };

  const updateProduct = (id: string, field: keyof ProductItem, value: string) => {
    setProducts(
      products.map((p) => (p.id === id ? { ...p, [field]: value } : p))
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Lot data:", { lotNumber, supplier, expiryDate, products });
    onOpenChange(false);
    // Reset form
    setLotNumber("");
    setSupplier("");
    setExpiryDate("");
    setProducts([
      {
        id: "1",
        name: "",
        category: "",
        sku: "",
        quantity: "",
        unit: "",
        costPrice: "",
        sellingPrice: "",
      },
    ]);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">
            เพิ่มสินค้าเป็นล๊อต
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* ข้อมูลล๊อต */}
          <div className="bg-muted/30 p-4 rounded-lg">
            <h3 className="font-semibold mb-4">ข้อมูลล๊อต</h3>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="lotNumber">
                  หมายเลขล๊อต <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="lotNumber"
                  value={lotNumber}
                  onChange={(e) => setLotNumber(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="supplier">
                  ผู้จำหน่าย <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="supplier"
                  value={supplier}
                  onChange={(e) => setSupplier(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="expiryDate">วันหมดอายุ</Label>
                <Input
                  id="expiryDate"
                  type="date"
                  value={expiryDate}
                  onChange={(e) => setExpiryDate(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* รายการสินค้า */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">รายการสินค้า</h3>
              <Button
                type="button"
                onClick={addProduct}
                size="sm"
                className="bg-success hover:bg-success/90"
              >
                <Plus className="w-4 h-4 mr-1" />
                เพิ่มสินค้า
              </Button>
            </div>

            <div className="space-y-4">
              {products.map((product, index) => (
                <Card key={product.id} className="p-4 relative">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-medium">สินค้าที่ {index + 1}</h4>
                    {products.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeProduct(product.id)}
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>
                        ชื่อสินค้า <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        value={product.name}
                        onChange={(e) =>
                          updateProduct(product.id, "name", e.target.value)
                        }
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>
                        หมวดหมุ่ <span className="text-destructive">*</span>
                      </Label>
                      <Select
                        value={product.category}
                        onValueChange={(value) =>
                          updateProduct(product.id, "category", value)
                        }
                        required
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="เลือกหมวดหมุ่" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="bakery">เบเกอรี่</SelectItem>
                          <SelectItem value="dairy">นม/ครีม</SelectItem>
                          <SelectItem value="beverage">ใช้ขับ</SelectItem>
                          <SelectItem value="equipment">เบเกอรี่</SelectItem>
                          <SelectItem value="other">อื่นๆ</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>
                        SKU <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        value={product.sku}
                        onChange={(e) =>
                          updateProduct(product.id, "sku", e.target.value)
                        }
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>
                        จำนวน <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        type="number"
                        step="0.0001"
                        value={product.quantity}
                        onChange={(e) =>
                          updateProduct(product.id, "quantity", e.target.value)
                        }
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>
                        หน่วย <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        value={product.unit}
                        onChange={(e) =>
                          updateProduct(product.id, "unit", e.target.value)
                        }
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>
                        ราคาต้นทุน <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={product.costPrice}
                        onChange={(e) =>
                          updateProduct(
                            product.id,
                            "costPrice",
                            e.target.value
                          )
                        }
                        required
                      />
                    </div>

                    <div className="space-y-2 col-span-2">
                      <Label>
                        ราคาขาย <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={product.sellingPrice}
                        onChange={(e) =>
                          updateProduct(
                            product.id,
                            "sellingPrice",
                            e.target.value
                          )
                        }
                        required
                      />
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>

          {/* Buttons */}
          <div className="flex gap-3 justify-end pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              ยกเลิก
            </Button>
            <Button type="submit">บันทึกล๊อต</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
