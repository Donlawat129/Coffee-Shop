// src/pages/Inventory.tsx
import { useEffect, useState } from "react";
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
import { StockAdjustDialog } from "@/components/products/StockAdjustDialog";
import { DeleteConfirmDialog } from "@/components/inventory/DeleteConfirmDialog";
import { useToast } from "@/hooks/use-toast";

// ✅ ใช้ API จริงจาก Firestore
import {
  onProductsSubscribe,
  addProduct,
  adjustStock,
  deleteProduct,
  updateProduct,
  type ProductDoc,
} from "@/lib/productsApi";

type UIProduct = {
  id: string;
  name: string;
  sku: string;
  category: string; // แสดงแทน unit/categoryId
  stock: number;
  price: number;
  unit?: string;
  expiryDate?: string;
  lotNumber?: string;
};

const Inventory = () => {
  const [products, setProducts] = useState<UIProduct[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

  // --- Edit / Adjust dialogs ---
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editInitial, setEditInitial] = useState<{
    name: string; category: string; sku: string; unit?: string; stock?: number;
    expiryDate?: string; lotNumber?: string;
  } | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [isAddStockDialogOpen, setIsAddStockDialogOpen] = useState(false);
  const [isRemoveStockDialogOpen, setIsRemoveStockDialogOpen] = useState(false);
  const [adjustTarget, setAdjustTarget] = useState<UIProduct | null>(null);

  // bulk cut
  const [isMultiCutDialogOpen, setIsMultiCutDialogOpen] = useState(false);

  // delete confirm
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<string[]>([]);

  const [selectedSort, setSelectedSort] = useState("ทุกหมวดหมุ่");
  const { toast } = useToast();

  // 🔄 สมัคร realtime products
  useEffect(() => {
    const unsub = onProductsSubscribe((rows) => {
      const mapped: UIProduct[] = rows.map((r) => ({
        id: r.id,
        name: r.name,
        sku: r.sku,
        // โชว์หน่วยเป็น badge (ถ้าไม่มีหน่วยจะ fallback เป็น categoryId)
        category: r.unit || r.categoryId || "-",
        stock: Number(r.stock ?? 0),
        price: Number(r.price ?? 0),
        unit: r.unit,
        expiryDate: r.expiryDate,
        lotNumber: r.lotNumber,
      }));
      setProducts(mapped);
    });
    return () => unsub();
  }, []);

  const toggleProductSelection = (productId: string) => {
    setSelectedProducts((prev) =>
      prev.includes(productId)
        ? prev.filter((id) => id !== productId)
        : [...prev, productId]
    );
  };

  // เปิด “ตัดสต๊อกหลายรายการ” จากการ์ด
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

  const handleDeleteConfirm = async () => {
    await Promise.all(deleteTarget.map((id) => deleteProduct(id)));
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

  const handleSelectAll = () => {
    setSelectedProducts(products.map((p) => p.id));
  };

  // === open dialogs per row ===
  const openEdit = (product: UIProduct) => {
    setEditingId(product.id);
    setEditInitial({
      name: product.name,
      category: product.unit || product.category,
      sku: product.sku,
      unit: product.unit,
      stock: product.stock,
      expiryDate: product.expiryDate,
      lotNumber: product.lotNumber,
    });
    setIsEditDialogOpen(true);
  };

  const openAddStock = (product: UIProduct) => {
    setAdjustTarget(product);
    setIsAddStockDialogOpen(true);
  };

  const openRemoveStock = (product: UIProduct) => {
    setAdjustTarget(product);
    setIsRemoveStockDialogOpen(true);
  };

  // === dialog handlers ===
  const handleEditUpdate = async (patch: {
    name: string; category?: string; sku: string;
    unit?: string; expiryDate?: string; lotNumber?: string;
  }) => {
    if (!editingId) return;
    // map เข้า ProductDoc
    const update: Partial<ProductDoc> = {
      name: patch.name,
      sku: patch.sku,
      unit: patch.unit ?? patch.category ?? null,
      expiryDate: patch.expiryDate ?? null,
      lotNumber: patch.lotNumber ?? null,
      // ถ้าจะอัปเดต categoryId แยกเองภายหลัง (ตอนนี้ใช้ unit เป็นตัวแสดง)
    };
    await updateProduct(editingId, update);
    setIsEditDialogOpen(false);
    setEditInitial(null);
    setEditingId(null);
    toast({ title: "บันทึกการแก้ไขแล้ว" });
  };

  const handleAddStockConfirm = async (qty: number, note?: string) => {
    if (!adjustTarget || qty <= 0) return;
    await adjustStock(adjustTarget.id, "add", qty, note);
    toast({
      title: "เพิ่มสต๊อกสำเร็จ",
      description: `เพิ่ม ${qty.toLocaleString("th-TH")} หน่วย`,
    });
  };

  const handleRemoveStockConfirm = async (qty: number, note?: string) => {
    if (!adjustTarget || qty <= 0) return;
    // ฝั่ง service กันติดลบให้แล้ว ถ้าจะกันฝั่งหน้า ก็เช็คได้จาก adjustTarget.stock
    await adjustStock(adjustTarget.id, "remove", qty, note);
    toast({
      title: "ตัดสต๊อกสำเร็จ",
      description: `ตัด ${qty.toLocaleString("th-TH")} หน่วย`,
    });
  };

  // ตัดสต๊อกหลายรายการ (ทีละจำนวนเท่ากัน)
  const handleMultiCutConfirm = async (
    productIds: string[],
    quantity: number,
    note: string
  ) => {
    if (quantity <= 0 || productIds.length === 0) return;
    await Promise.all(
      productIds.map((id) => adjustStock(id, "remove", quantity, note))
    );
    toast({
      title: "ตัดสต๊อกสำเร็จ",
      description: `ตัดสต๊อก ${productIds.length} รายการ รายการละ ${quantity.toLocaleString("th-TH")} หน่วย`,
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
        {/* แถบบนสุด: ไม่มีปุ่มแล้ว */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold">จัดการคลังสินค้า</h2>
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

          {/* ใช้การ์ดนี้เป็นจุดหลักสำหรับตัดสต๊อกแบบหลายรายการจากการติ๊กเลือก */}
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

          {/* การ์ดลบสินค้า: ใช้สินค้าที่ติ๊กเลือกไว้ */}
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
              onClick={() => handleOpenDeleteDialog(selectedProducts)}
              disabled={selectedProducts.length === 0}
            >
              ลบสินค้า
            </Button>
          </Card>
        </div>

        {/* แถบสรุปรายการที่เลือก: แสดงเฉยๆ */}
        {selectedProducts.length > 0 && (
          <Card className="p-4 mb-4 bg-accent/10">
            <div className="flex items-center justify-between">
              <span className="font-medium">
                เลือกแล้ว: {selectedProducts.length} รายการ
              </span>
              <span className="text-sm text-muted-foreground">
                ไปที่ “ตัดสต๊อกสินค้า” หรือ “ลบสินค้า” เพื่อดำเนินการ
              </span>
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
              {/* เอาปุ่ม ยกเลิกการเลือก ออกตาม requirement */}
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
                  <Button size="icon" variant="ghost" onClick={() => openEdit(product)}>
                    <Edit className="w-4 h-4 text-primary" />
                  </Button>
                  <Button size="icon" variant="ghost" title="เพิ่มสต๊อก" onClick={() => openAddStock(product)}>
                    <Plus className="w-4 h-4 text-success" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    title="ตัดสต๊อก"
                    onClick={() => openRemoveStock(product)}
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

      {/* เพิ่มสินค้า (create) */}
      <AddProductDialog
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        mode="create"
        onCreate={async (data) => {
          // map ตาม productsApi
          await addProduct({
            name: data.name,
            sku: data.sku,
            unit: data.unit,
            categoryId: data.unit,        // compatibility
            initialQuantity: data.stock,  // สต๊อกเริ่มต้น
            costPrice: 0,
            sellingPrice: 0,
            expiryDate: data.expiryDate,
            lotNumber: data.lotNumber,
          });
          toast({ title: "เพิ่มสินค้าสำเร็จ" });
        }}
      />

      {/* แก้ไข */}
      <AddProductDialog
        open={isEditDialogOpen}
        onOpenChange={(o) => {
          setIsEditDialogOpen(o);
          if (!o) { setEditInitial(null); setEditingId(null); }
        }}
        mode="edit"
        initial={editInitial ?? undefined}
        onUpdate={handleEditUpdate}
      />

      {/* เพิ่มสต๊อก */}
      <StockAdjustDialog
        product={adjustTarget ?? { id: "", name: "", sku: "", stock: 0 }}
        type="add"
        open={isAddStockDialogOpen}
        onOpenChange={(o) => {
          setIsAddStockDialogOpen(o);
          if (!o) setAdjustTarget(null);
        }}
        onAdjust={async (qty, note) => {
          await handleAddStockConfirm(qty, note);
          setIsAddStockDialogOpen(false);
          setAdjustTarget(null);
        }}
      />

      {/* ลดสต๊อก */}
      <StockAdjustDialog
        product={adjustTarget ?? { id: "", name: "", sku: "", stock: 0 }}
        type="remove"
        open={isRemoveStockDialogOpen}
        onOpenChange={(o) => {
          setIsRemoveStockDialogOpen(o);
          if (!o) setAdjustTarget(null);
        }}
        onAdjust={async (qty, note) => {
          await handleRemoveStockConfirm(qty, note);
          setIsRemoveStockDialogOpen(false);
          setAdjustTarget(null);
        }}
      />

      {/* ตัดสต๊อก “หลายรายการ” จากการ์ด */}
      <MultiStockCutDialog
        open={isMultiCutDialogOpen}
        onOpenChange={setIsMultiCutDialogOpen}
        selectedProducts={selectedProductsData}
        onConfirm={handleMultiCutConfirm}
      />

      {/* ลบรายการ */}
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
