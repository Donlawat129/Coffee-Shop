import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Edit, Trash2, Plus, Minus } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { AddProductDialog } from "@/components/products/AddProductDialog";
import { StockAdjustDialog } from "@/components/products/StockAdjustDialog";

interface Product {
  id: string;
  name: string;
  sku: string;
  category: string;
  supplier: string;
  stock: number;
  price: number;
}

const mockProducts: Product[] = [
  {
    id: "1",
    name: "สวาสว",
    sku: "วลัง",
    category: "นม/ครีม",
    supplier: "ยอสวง",
    stock: 50.3232,
    price: 52485.0,
  },
];

const categories = [
  "ทุกหมวดหมุ่",
  "เบเกอรี่",
  "นม/ครีม",
  "ใช้ขับ",
  "เบเกอรี่",
  "อม่มวีล",
  "อื่นๆ",
];

const Products = () => {
  const [products] = useState<Product[]>(mockProducts);
  const [selectedCategory, setSelectedCategory] = useState("ทุกหมวดหมุ่");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [adjustType, setAdjustType] = useState<"add" | "remove">("add");

  const handleAdjustStock = (product: Product, type: "add" | "remove") => {
    setSelectedProduct(product);
    setAdjustType(type);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">รายการสินค้าในคลัง</h2>
          <div className="flex items-center gap-3">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline">{selectedCategory}</Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                {categories.map((cat) => (
                  <DropdownMenuItem
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                  >
                    {cat}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
            <Button onClick={() => setIsAddDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              เพิ่มสินค้า
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {products.map((product) => (
            <Card key={product.id} className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-lg mb-1">{product.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    {product.category} | รหัส: {product.sku}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    SKU: {product.sku}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    ผู้จำหน่าย: {product.supplier}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button size="icon" variant="ghost">
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button size="icon" variant="ghost">
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                </div>
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">สต๊อก:</span>
                  <span className="text-success font-semibold">
                    {product.stock.toLocaleString("th-TH", {
                      minimumFractionDigits: 0,
                      maximumFractionDigits: 4,
                    })}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">
                    ราคาขาย:
                  </span>
                  <span className="font-semibold">
                    ฿
                    {product.price.toLocaleString("th-TH", {
                      minimumFractionDigits: 2,
                    })}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant="default"
                  className="bg-success hover:bg-success/90"
                  onClick={() => handleAdjustStock(product, "add")}
                >
                  <Plus className="w-4 h-4 mr-1" />
                  เติม
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => handleAdjustStock(product, "remove")}
                >
                  <Minus className="w-4 h-4 mr-1" />
                  ไม้
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </div>

      <AddProductDialog
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
      />

      {selectedProduct && (
        <StockAdjustDialog
          product={selectedProduct}
          type={adjustType}
          open={!!selectedProduct}
          onOpenChange={(open) => !open && setSelectedProduct(null)}
        />
      )}
    </div>
  );
};

export default Products;
