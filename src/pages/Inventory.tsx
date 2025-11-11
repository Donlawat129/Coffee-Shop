import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Package,
  Scissors,
  Trash2,
  Edit,
  Plus,
  Minus,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { AddProductDialog } from "@/components/products/AddProductDialog";
import { MultiStockCutDialog } from "@/components/inventory/MultiStockCutDialog";
import { SingleStockCutDialog } from "@/components/inventory/SingleStockCutDialog";
import { DeleteConfirmDialog } from "@/components/inventory/DeleteConfirmDialog";
import { useToast } from "@/hooks/use-toast";

interface Product {
  id: string;
  name: string;
  sku: string;
  category: string;
  stock: number;
  price: number;
}

const mockProducts: Product[] = [
  {
    id: "1",
    name: "สวาสว",
    sku: "วลัง",
    category: "นม/ครีม",
    stock: 50.3232,
    price: 52485.0,
  },
];

const Inventory = () => {
  const [products, setProducts] = useState<Product[]>(mockProducts);
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isSingleCutDialogOpen, setIsSingleCutDialogOpen] = useState(false);
  const [isMultiCutDialogOpen, setIsMultiCutDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<string[]>([]);
  const [cutTarget, setCutTarget] = useState<Product | null>(null);
  const [selectedSort, setSelectedSort] = useState("ทุกหมวดหมุ่");
  const { toast } = useToast();

  const toggleProductSelection = (productId: string) => {
    setSelectedProducts((prev) =>
      prev.includes(productId)
        ? prev.filter((id) => id !== productId)
        : [...prev, productId]
    );
  };

  const handleMultiStockCut = () => {
    if (selectedProducts.length === 0) {
      toast({
        title: "กรุณาเลือกสินค้า",
        description: "กรุณาเลือกสินค้าที่ต้องการตัดสต๊อกก่อน",
        variant: "destructive",
      });
      return;
    }
    setIsMultiCutDialogOpen(true);
  };

  const handleOpenDeleteDialog = (productIds: string[]) => {
    if (productIds.length === 0) {
      toast({
        title: "กรุณาเลือกสินค้า",
        description: "กรุณาเลือกสินค้าที่ต้องการลบก่อน",
        variant: "destructive",
      });
      return;
    }
    setDeleteTarget(productIds);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = () => {
    setProducts((prev) => prev.filter((p) => !deleteTarget.includes(p.id)));
    toast({
      title: "ลบสินค้าสำเร็จ",
      description: `ลบสินค้า ${deleteTarget.length} รายการเรียบร้อยแล้ว`,
    });
    setSelectedProducts([]);
    setDeleteTarget([]);
    setIsDeleteDialogOpen(false);
  };

  const handleSingleDelete = (productId: string) => {
    handleOpenDeleteDialog([productId]);
  };

  const handleMultiDelete = () => {
    handleOpenDeleteDialog(selectedProducts);
  };

  const handleSelectAll = () => {
    setSelectedProducts(products.map((p) => p.id));
  };

  const handleDeselectAll = () => {
    setSelectedProducts([]);
  };

  const handleSingleStockCut = (product: Product) => {
    setCutTarget(product);
    setIsSingleCutDialogOpen(true);
  };

  const handleSingleCutConfirm = (
    productId: string,
    quantity: number,
    note: string
  ) => {
    setProducts((prev) =>
      prev.map((p) =>
        p.id === productId ? { ...p, stock: p.stock - quantity } : p
      )
    );
    toast({
      title: "ตัดสต๊อกสำเร็จ",
      description: `ตัดสต๊อก ${quantity.toLocaleString("th-TH")} หน่วยเรียบร้อยแล้ว`,
    });
  };

  const handleMultiCutConfirm = (
    productIds: string[],
    quantity: number,
    note: string
  ) => {
    setProducts((prev) =>
      prev.map((p) =>
        productIds.includes(p.id) ? { ...p, stock: p.stock - quantity } : p
      )
    );
    toast({
      title: "ตัดสต๊อกสำเร็จ",
      description: `ตัดสต๊อก ${productIds.length} รายการเรียบร้อยแล้ว`,
    });
    setSelectedProducts([]);
  };

  const selectedProductsData = products.filter((p) =>
    selectedProducts.includes(p.id)
  );

  const deleteTargetProducts = products.filter((p) =>
    deleteTarget.includes(p.id)
  );

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">จัดการคลังสินค้า</h2>
          <div className="flex gap-3">
            <Button
              variant="default"
              className="bg-accent hover:bg-accent/90"
              onClick={handleMultiStockCut}
            >
              <Scissors className="w-4 h-4 mr-2" />
              ตัดสต๊อกหลายรายการ
            </Button>
            <Button variant="destructive" onClick={handleMultiDelete}>
              <Trash2 className="w-4 h-4 mr-2" />
              ลบหลายรายการ
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card className="p-6 text-center hover:shadow-lg transition-shadow cursor-pointer">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                <Package className="w-8 h-8 text-primary" />
              </div>
            </div>
            <h3 className="font-semibold text-lg mb-2">เพิ่มสินค้าใหม่</h3>
            <p className="text-sm text-muted-foreground mb-4">
              เพิ่มสินค้าใหม่เข้าสู่คลัง
            </p>
            <Button className="w-full" onClick={() => setIsAddDialogOpen(true)}>
              เพิ่มสินค้า
            </Button>
          </Card>

          <Card className="p-6 text-center hover:shadow-lg transition-shadow cursor-pointer">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 rounded-full bg-secondary/10 flex items-center justify-center">
                <Scissors className="w-8 h-8 text-secondary" />
              </div>
            </div>
            <h3 className="font-semibold text-lg mb-2">ตัดสต๊อกสินค้า</h3>
            <p className="text-sm text-muted-foreground mb-4">
              ลดจำนวนสต๊อกสินค้าที่มีอยู่
            </p>
            <Button
              variant="default"
              className="w-full bg-secondary hover:bg-secondary/90"
              onClick={handleMultiStockCut}
              disabled={selectedProducts.length === 0}
            >
              ตัดสต๊อก
            </Button>
          </Card>

          <Card className="p-6 text-center hover:shadow-lg transition-shadow cursor-pointer">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center">
                <Trash2 className="w-8 h-8 text-destructive" />
              </div>
            </div>
            <h3 className="font-semibold text-lg mb-2">ลบสินค้า</h3>
            <p className="text-sm text-muted-foreground mb-4">
              ลบสินค้าออกจากคลัง
            </p>
            <Button
              variant="destructive"
              className="w-full"
              onClick={handleMultiDelete}
              disabled={selectedProducts.length === 0}
            >
              ลบสินค้า
            </Button>
          </Card>
        </div>

        {selectedProducts.length > 0 && (
          <Card className="p-4 mb-4 bg-accent/10">
            <div className="flex items-center justify-between">
              <span className="font-medium">
                เลือกแล้ว: {selectedProducts.length} รายการ
              </span>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  className="bg-secondary hover:bg-secondary/90"
                  onClick={handleMultiStockCut}
                >
                  ตัดสต๊อก
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={handleMultiDelete}
                >
                  ลบ
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setSelectedProducts([])}
                >
                  ยกเลิก
                </Button>
              </div>
            </div>
          </Card>
        )}

        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">รายการสินค้าทั้งหมด</h3>
            <div className="flex gap-2 items-center">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    {selectedSort}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={() => setSelectedSort("ทุกหมวดหมุ่")}>
                    ทุกหมวดหมุ่
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <Button variant="outline" size="sm" onClick={handleSelectAll}>
                เลือกทั้งหมด
              </Button>
              <Button variant="outline" size="sm" onClick={handleDeselectAll}>
                ยกเลิกการเลือก
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            {products.map((product) => (
              <div
                key={product.id}
                className="flex items-center gap-4 p-4 rounded-lg border hover:bg-muted/50 transition-colors"
              >
                <Checkbox
                  checked={selectedProducts.includes(product.id)}
                  onCheckedChange={() => toggleProductSelection(product.id)}
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-semibold">{product.name}</h4>
                    <Badge variant="secondary" className="bg-accent text-accent-foreground">
                      {product.category}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    SKU: {product.sku}
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-success font-semibold mb-1">
                    {product.stock.toLocaleString("th-TH", {
                      minimumFractionDigits: 0,
                      maximumFractionDigits: 4,
                    })}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    ฿
                    {product.price.toLocaleString("th-TH", {
                      minimumFractionDigits: 2,
                    })}
                  </div>
                </div>
                <div className="flex gap-1">
                  <Button size="icon" variant="ghost">
                    <Edit className="w-4 h-4 text-primary" />
                  </Button>
                  <Button size="icon" variant="ghost" title="เพิ่มสต๊อก">
                    <Plus className="w-4 h-4 text-success" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    title="ตัดสต๊อก"
                    onClick={() => handleSingleStockCut(product)}
                  >
                    <Minus className="w-4 h-4 text-secondary" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => handleSingleDelete(product.id)}
                  >
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <AddProductDialog
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
      />

      <SingleStockCutDialog
        open={isSingleCutDialogOpen}
        onOpenChange={setIsSingleCutDialogOpen}
        product={cutTarget}
        onConfirm={handleSingleCutConfirm}
      />

      <MultiStockCutDialog
        open={isMultiCutDialogOpen}
        onOpenChange={setIsMultiCutDialogOpen}
        selectedProducts={selectedProductsData}
        onConfirm={handleMultiCutConfirm}
      />

      <DeleteConfirmDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        onConfirm={handleDeleteConfirm}
        productCount={deleteTarget.length}
        productNames={deleteTargetProducts.map((p) => p.name)}
      />
    </div>
  );
};

export default Inventory;
