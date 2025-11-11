import { useEffect, useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Edit, Trash2, Plus, Minus } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { AddProductDialog } from "@/components/products/AddProductDialog";
import { StockAdjustDialog } from "@/components/products/StockAdjustDialog";
import {
  onProductsSubscribe,
  addProduct,
  adjustStock,
  deleteProduct,
  updateProduct,
  getProduct,
} from "@/lib/productsApi";

const CATEGORIES = [
  { id: "all", label: "ทุกหมวดหมู่" },
  { id: "bakery", label: "เบเกอรี่" },
  { id: "dairy", label: "นม/ครีม" },
  { id: "beverage", label: "เครื่องดื่ม" },
  { id: "equipment", label: "อุปกรณ์" },
  { id: "other", label: "อื่นๆ" },
];

interface Product {
  id: string;
  name: string;
  sku: string;
  categoryId: string;
  supplier?: string;
  stock: number;
  price: number;
  unit?: string;
  costPrice?: number;
  expiryDate?: string;
  lotNumber?: string;
}

// ✅ ใช้แทน any | null สำหรับค่า initial ของฟอร์มแก้ไข
type ProductFormInitial = {
  name: string;
  category: string;          // categoryId
  sku: string;
  supplier?: string;
  initialQuantity?: string;  // ใช้เฉพาะโหมด create
  unit?: string;
  costPrice?: string;
  sellingPrice?: string;
  expiryDate?: string;
  lotNumber?: string;
};

const Products = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [adjustType, setAdjustType] = useState<"add" | "remove">("add");

  // for edit
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editInitial, setEditInitial] = useState<ProductFormInitial | null>(null); // ✅ fixed
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    const unsub = onProductsSubscribe(setProducts);
    return () => unsub();
  }, []);

  const filteredProducts = useMemo(() => {
    if (selectedCategory === "all") return products;
    return products.filter((p) => p.categoryId === selectedCategory);
  }, [products, selectedCategory]);

  const handleAdjustStock = (product: Product, type: "add" | "remove") => {
    setSelectedProduct(product);
    setAdjustType(type);
  };

  const handleCreateProduct = async (data: {
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
  }) => {
    await addProduct(data);
  };

  const handleAdjustCommit = async (
    productId: string,
    type: "add" | "remove",
    qty: number,
    note?: string
  ) => {
    await adjustStock(productId, type, qty, note);
  };

  const handleDelete = async (id: string) => {
    if (confirm("ยืนยันลบสินค้านี้?")) await deleteProduct(id);
  };

  const labelOf = (catId: string) =>
    CATEGORIES.find((c) => c.id === catId)?.label ?? catId;

  const openEdit = async (p: Product) => {
    setEditingId(p.id);
    const full = await getProduct(p.id).catch(() => null);
    const v = full || p;

    setEditInitial({
      name: v.name || "",
      category: v.categoryId || "",
      sku: v.sku || "",
      supplier: v.supplier || "",
      unit: v.unit || "",
      costPrice: v.costPrice != null ? String(v.costPrice) : "",
      sellingPrice: v.price != null ? String(v.price) : "",
      expiryDate: v.expiryDate || "",
      lotNumber: v.lotNumber || "",
      initialQuantity: "", // not used in edit
    });
    setIsEditDialogOpen(true);
  };

  const handleUpdateProduct = async (data: {
    name: string;
    categoryId: string;
    sku: string;
    supplier?: string;
    unit: string;
    costPrice: number;
    sellingPrice: number;
    expiryDate?: string;
    lotNumber?: string;
  }) => {
    if (!editingId) return;
    await updateProduct(editingId, {
      name: data.name,
      sku: data.sku,
      categoryId: data.categoryId,
      supplier: data.supplier || null,
      unit: data.unit || null,
      costPrice: Number.isFinite(data.costPrice) ? data.costPrice : 0,
      price: Number.isFinite(data.sellingPrice) ? data.sellingPrice : 0,
      expiryDate: data.expiryDate || null,
      lotNumber: data.lotNumber || null,
    });
    setIsEditDialogOpen(false);
    setEditInitial(null);
    setEditingId(null);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">รายการสินค้าในคลัง</h2>
          <div className="flex items-center gap-3">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline">
                  {CATEGORIES.find((c) => c.id === selectedCategory)?.label ??
                    "ทุกหมวดหมู่"}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                {CATEGORIES.map((cat) => (
                  <DropdownMenuItem
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                  >
                    {cat.label}
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
          {filteredProducts.map((product) => (
            <Card key={product.id} className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-lg mb-1">{product.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    {labelOf(product.categoryId)} | รหัส: {product.sku}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    ผู้จำหน่าย: {product.supplier || "-"}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button size="icon" variant="ghost" onClick={() => openEdit(product)}>
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => handleDelete(product.id)}
                  >
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
                  <span className="text-sm text-muted-foreground">ราคาขาย:</span>
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
                  เติมสต๊อก
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => handleAdjustStock(product, "remove")}
                >
                  <Minus className="w-4 h-4 mr-1" />
                  ตัดสต๊อก
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Create dialog */}
      <AddProductDialog
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        mode="create"
        onCreate={handleCreateProduct}
      />

      {/* Edit dialog */}
      <AddProductDialog
        open={isEditDialogOpen}
        onOpenChange={(o) => {
          setIsEditDialogOpen(o);
          if (!o) { setEditInitial(null); setEditingId(null); }
        }}
        mode="edit"
        initial={editInitial ?? undefined}
        onUpdate={handleUpdateProduct}
      />

      {selectedProduct && (
        <StockAdjustDialog
          product={selectedProduct}
          type={adjustType}
          open={!!selectedProduct}
          onOpenChange={(open) => !open && setSelectedProduct(null)}
          onAdjust={(qty, note) =>
            handleAdjustCommit(selectedProduct.id, adjustType, qty, note)
          }
        />
      )}
    </div>
  );
};

export default Products;
