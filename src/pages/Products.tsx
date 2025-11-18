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
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { useToast } from "@/hooks/use-toast";

interface Product {
  id: string;
  name: string;
  sku: string;
  unit?: string | null;
  stock: number;
  expiryDate?: string | null;
  lotNumber?: string | null;
}

type FullProduct = Product & {
  supplier?: string | null;
  costPrice?: number | null;
  price?: number | null;
};

// ใช้ category เก็บ unit ตาม UI เดิม (ตอนเปิด dialog แก้ไข)
type ProductFormInitial = {
  name: string;
  category: string; // เก็บ "unit"
  sku: string;
  unit?: string;
  stock?: number;
  expiryDate?: string;
  lotNumber?: string;
};

/** อีเมลตามสิทธิ์ */
const ADMIN_EMAILS = new Set(["admin@gmail.com", "superadmin@gmail.com"]);
const OWNER_EMAILS = new Set(["owner@gmail.com"]);
const STAFF_EMAILS = new Set(["staff@gmail.com", "staff2@gmail.com"]);

type Role = "admin" | "owner" | "staff" | "user" | "unknown";

function roleFromEmail(email: string | null | undefined): Role {
  if (!email) return "unknown";
  if (ADMIN_EMAILS.has(email)) return "admin";
  if (OWNER_EMAILS.has(email)) return "owner";
  if (STAFF_EMAILS.has(email)) return "staff";
  return "user";
}

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

  // auth -> role
  const [authReady, setAuthReady] = useState(false);
  const [email, setEmail] = useState<string | null>(null);
  const role = roleFromEmail(email);

  // สิทธิ์บนหน้า Products
  const canEditCatalog = role === "admin" || role === "owner"; // เพิ่ม/แก้/ลบ
  const canAddStock = role === "admin" || role === "owner"; // ปุ่มเติม
  const canRemoveStock = role === "admin" || role === "owner" || role === "staff"; // ปุ่มตัด

  const { toast } = useToast();

  useEffect(() => {
    const unsub = onProductsSubscribe(setProducts);
    return () => unsub();
  }, []);

  useEffect(() => {
    const auth = getAuth();
    const unsub = onAuthStateChanged(auth, (u) => {
      setEmail(u?.email ?? null);
      setAuthReady(true);
    });
    return () => unsub();
  }, []);

  // รายการหน่วยนับจากสินค้าจริง (dynamic)
  const unitOptions = useMemo(() => {
    const set = new Set<string>();
    products.forEach((p) => {
      if (p.unit) set.add(p.unit);
    });
    return ["all", ...Array.from(set)];
  }, [products]);

  const filteredProducts = useMemo(() => {
    if (selectedUnit === "all") return products;
    return products.filter((p) => (p.unit || "") === selectedUnit);
  }, [products, selectedUnit]);

  // ❗️อย่าคืนค่าใดๆ จากฟังก์ชันนี้ เพื่อไม่ให้ชน type Promise<void>
  const denyToast = (): void => {
    toast({
      title: "ไม่มีสิทธิ์ทำรายการ",
      description: "บัญชีของคุณไม่ได้รับอนุญาตให้ทำรายการนี้",
      variant: "destructive",
    });
  };

  const handleAdjustStock = (product: Product, type: "add" | "remove"): void => {
    if (type === "add" && !canAddStock) {
      denyToast();
      return;
    }
    if (type === "remove" && !canRemoveStock) {
      denyToast();
      return;
    }
    setSelectedProduct(product);
    setAdjustType(type);
  };

  const handleCreateProduct = async (data: {
    name: string;
    sku: string;
    unit: string;
    stock: number;
    expiryDate?: string;
    lotNumber?: string;
  }): Promise<void> => {
    if (!canEditCatalog) {
      denyToast();
      return;
    }

    try {
      await addProduct({
        name: data.name,
        sku: data.sku,
        unit: data.unit,
        categoryId: data.unit, // compatibility เดิม
        initialQuantity: data.stock, // สต๊อกเริ่มต้น
        costPrice: 0,
        sellingPrice: 0,
        expiryDate: data.expiryDate,
        lotNumber: data.lotNumber,
      });
      toast({ title: "เพิ่มสินค้าสำเร็จ", description: data.name });
    } catch {
      toast({
        title: "เพิ่มสินค้าไม่สำเร็จ",
        description: "กรุณาลองใหม่หรือตรวจสอบการเชื่อมต่อ",
        variant: "destructive",
      });
    }
  };

  const handleAdjustCommit = async (
    productId: string,
    type: "add" | "remove",
    qty: number,
    note?: string
  ): Promise<void> => {
    if (type === "add" && !canAddStock) {
      denyToast();
      return;
    }
    if (type === "remove" && !canRemoveStock) {
      denyToast();
      return;
    }
    try {
      await adjustStock(productId, type, qty, note);
      toast({
        title: type === "add" ? "เพิ่มสต๊อกสำเร็จ" : "ตัดสต๊อกสำเร็จ",
        description:
          (type === "add" ? "เพิ่ม " : "ตัด ") +
          qty.toLocaleString("th-TH") +
          " หน่วย" +
          (note ? ` • ${note}` : ""),
      });
      setSelectedProduct(null);
    } catch {
      toast({
        title: type === "add" ? "เพิ่มสต๊อกไม่สำเร็จ" : "ตัดสต๊อกไม่สำเร็จ",
        description: "กรุณาลองใหม่",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (id: string): Promise<void> => {
    if (!canEditCatalog) {
      denyToast();
      return;
    }
    const ok = confirm("ยืนยันลบสินค้านี้?");
    if (!ok) return;
    try {
      await deleteProduct(id);
      toast({ title: "ลบสินค้าสำเร็จ" });
    } catch {
      toast({
        title: "ลบสินค้าไม่สำเร็จ",
        description: "กรุณาลองใหม่",
        variant: "destructive",
      });
    }
  };

  const labelUnit = (u?: string | null) => u || "-";

  const openEdit = async (p: Product): Promise<void> => {
    if (!canEditCatalog) {
      denyToast();
      return;
    }

    setEditingId(p.id);
    const full = (await getProduct(p.id).catch(() => null)) as FullProduct | null;
    const v: FullProduct = full ?? (p as FullProduct);

    setEditInitial({
      name: v.name || "",
      category: v.unit || "", // ใช้เก็บ unit ที่เลือก
      sku: v.sku || "",
      unit: v.unit || "",
      stock: v.stock ?? 0,
      expiryDate: v.expiryDate || "",
      lotNumber: v.lotNumber || "",
    });
    setIsEditDialogOpen(true);
  };

  const handleUpdateProduct = async (data: {
    name: string;
    sku: string;
    unit: string;
    stock: number;
    expiryDate?: string;
    lotNumber?: string;
  }): Promise<void> => {
    if (!canEditCatalog || !editingId) {
      denyToast();
      return;
    }

    try {
      await updateProduct(editingId, {
        name: data.name,
        sku: data.sku,
        categoryId: data.unit, // map เพื่อเข้ากับ backend เดิม
        unit: data.unit || null,
        stock: Number.isFinite(data.stock) ? data.stock : 0,
        expiryDate: data.expiryDate || null,
        lotNumber: data.lotNumber || null,
      });
      toast({ title: "อัปเดตสินค้าแล้ว", description: data.name });
      setIsEditDialogOpen(false);
      setEditInitial(null);
      setEditingId(null);
    } catch {
      toast({
        title: "อัปเดตสินค้าไม่สำเร็จ",
        description: "กรุณาลองใหม่",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">รายการสินค้าในคลัง</h2>
          <div className="flex items-center gap-3">
            {/* ตัวกรองหน่วยนับ: ให้เห็นทุก role */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline">
                  {selectedUnit === "all" ? "ทุกหน่วยนับ" : selectedUnit}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                {unitOptions.map((u) => (
                  <DropdownMenuItem key={u} onClick={() => setSelectedUnit(u)}>
                    {u === "all" ? "ทุกหน่วยนับ" : u}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* ปุ่มเพิ่มสินค้า: แสดงเฉพาะ admin/owner (ซ่อน staff) */}
            {authReady && canEditCatalog && (
              <Button onClick={() => setIsAddDialogOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                เพิ่มสินค้า
              </Button>
            )}
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

                {/* ไอคอนแก้/ลบ: แสดงเฉพาะ admin/owner */}
                {authReady && canEditCatalog && (
                  <div className="flex gap-2">
                    <Button size="icon" variant="ghost" onClick={() => openEdit(product)}>
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button size="icon" variant="ghost" onClick={() => handleDelete(product.id)}>
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                )}
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
                {/* ปุ่มเติมสต๊อก: แสดงเฉพาะ admin/owner */}
                {authReady && canAddStock && (
                  <Button
                    variant="default"
                    className="bg-success hover:bg-success/90"
                    onClick={() => handleAdjustStock(product, "add")}
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    เติมสต๊อก
                  </Button>
                )}

                {/* ปุ่มตัดสต๊อก: แสดงทุก role ที่กำหนด (รวม staff) */}
                {authReady && canRemoveStock && (
                  <Button variant="destructive" onClick={() => handleAdjustStock(product, "remove")}>
                    <Minus className="w-4 h-4 mr-1" />
                    ตัดสต๊อก
                  </Button>
                )}
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Create dialog */}
      {authReady && canEditCatalog && (
        <AddProductDialog
          open={isAddDialogOpen}
          onOpenChange={setIsAddDialogOpen}
          mode="create"
          onCreate={handleCreateProduct}
        />
      )}

      {/* Edit dialog */}
      {authReady && canEditCatalog && (
        <AddProductDialog
          open={isEditDialogOpen}
          onOpenChange={(o) => {
            setIsEditDialogOpen(o);
            if (!o) {
              setEditInitial(null);
              setEditingId(null);
            }
          }}
          mode="edit"
          initial={editInitial ?? undefined}
          onUpdate={handleUpdateProduct}
        />
      )}

      {/* Dialog ปรับสต๊อก */}
      {selectedProduct && (
        <StockAdjustDialog
          product={selectedProduct}
          type={adjustType}
          open={!!selectedProduct}
          onOpenChange={(open) => !open && setSelectedProduct(null)}
          onAdjust={(qty, note) => handleAdjustCommit(selectedProduct.id, adjustType, qty, note)}
        />
      )}
    </div>
  );
};

export default Products;
