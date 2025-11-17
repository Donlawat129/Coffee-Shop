// src/pages/Products.tsx
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

interface Product {
  id: string;
  name: string;
  sku: string;
  unit?: string;
  stock: number;
  expiryDate?: string;
  lotNumber?: string;
}

// ใช้เมื่อดึงจาก backend ซึ่งอาจมี field เสริมเข้ามา
type FullProduct = Product & {
  supplier?: string | null;
  costPrice?: number | null;
  price?: number | null;
};

// ฟอร์มเริ่มต้นตอนแก้ไข (ใช้ category เก็บ unit ตาม UI เดิม)
type ProductFormInitial = {
  name: string;
  category: string;   // เก็บ "unit" ที่เลือก
  sku: string;
  unit?: string;
  stock?: number;     // แก้เป็น number ให้ตรงกับ AddProductDialog.initial
  expiryDate?: string;
  lotNumber?: string;
};

const Products = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedUnit, setSelectedUnit] = useState<string>("all");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [adjustType, setAdjustType] = useState<"add" | "remove">("add");

  // for edit
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editInitial, setEditInitial] = useState<ProductFormInitial | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    const unsub = onProductsSubscribe(setProducts);
    return () => unsub();
  }, []);

  // รายการหน่วยนับจากสินค้าจริง (dynamic)
  const unitOptions = useMemo(() => {
    const set = new Set<string>();
    products.forEach((p) => { if (p.unit) set.add(p.unit); });
    return ["all", ...Array.from(set)];
  }, [products]);

  const filteredProducts = useMemo(() => {
    if (selectedUnit === "all") return products;
    return products.filter((p) => (p.unit || "") === selectedUnit);
  }, [products, selectedUnit]);

  const handleAdjustStock = (product: Product, type: "add" | "remove") => {
    setSelectedProduct(product);
    setAdjustType(type);
  };

  // ใช้ shape ใหม่จาก AddProductDialog
  const handleCreateProduct = async (data: {
    name: string;
    sku: string;
    unit: string;
    stock: number;
    expiryDate?: string;
    lotNumber?: string;
  }) => {
    // map ให้เข้ากับ API เดิม (ถ้า backend ยังรออัปเดต)
    await addProduct({
      name: data.name,
      sku: data.sku,
      unit: data.unit,
      categoryId: data.unit,          // เพื่อ compatibility กับสคีมาเดิม
      initialQuantity: data.stock,    // สต๊อกเริ่มต้น
      costPrice: 0,                   // ยังไม่ใช้ราคา/ต้นทุน → 0 ไว้ก่อน
      sellingPrice: 0,
      expiryDate: data.expiryDate,
      lotNumber: data.lotNumber,
    });
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

  const labelUnit = (u?: string) => u || "-";

  const openEdit = async (p: Product) => {
    setEditingId(p.id);
    const full = (await getProduct(p.id).catch(() => null)) as FullProduct | null;
    const v: FullProduct = full ?? (p as FullProduct);

    setEditInitial({
      name: v.name || "",
      category: v.unit || "",      // ใช้เก็บ unit ที่เลือก
      sku: v.sku || "",
      unit: v.unit || "",
      stock: v.stock ?? 0,         // ส่งเป็น number ให้ dialog
      expiryDate: v.expiryDate || "",
      lotNumber: v.lotNumber || "",
    });
    setIsEditDialogOpen(true);
  };

  // ใช้ shape ใหม่จาก AddProductDialog ตอนแก้ไข
  const handleUpdateProduct = async (data: {
    name: string;
    sku: string;
    unit: string;
    stock: number;
    expiryDate?: string;
    lotNumber?: string;
  }) => {
    if (!editingId) return;
    await updateProduct(editingId, {
      name: data.name,
      sku: data.sku,
      categoryId: data.unit,                   // map เพื่อเข้ากับ backend เดิม หากยังไม่ได้อัป
      unit: data.unit || null,
      stock: Number.isFinite(data.stock) ? data.stock : 0,
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
                  {selectedUnit === "all" ? "ทุกหน่วยนับ" : selectedUnit}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                {unitOptions.map((u) => (
                  <DropdownMenuItem
                    key={u}
                    onClick={() => setSelectedUnit(u)}
                  >
                    {u === "all" ? "ทุกหน่วยนับ" : u}
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
                    หน่วย: {labelUnit(product.unit)} | รหัส: {product.sku}
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
