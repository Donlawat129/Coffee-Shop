// src/lib/productsApi.ts
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
  Timestamp,
  updateDoc,
  getDoc,
} from "firebase/firestore";
import { db } from "./firebase";

export type ProductDoc = {
  name: string;
  sku: string;
  categoryId: string;
  supplier?: string;
  stock: number;
  unit?: string;
  costPrice?: number;
  price: number; // sellingPrice
  expiryDate?: string; // YYYY-MM-DD
  lotNumber?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
};

const col = collection(db, "products");

export function onProductsSubscribe(
  setState: (rows: Array<{
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
  }>) => void
) {
  const q = query(col, orderBy("createdAt", "desc"));
  return onSnapshot(q, (snap) => {
    const rows = snap.docs.map((d) => {
      const v = d.data() as ProductDoc;
      return {
        id: d.id,
        name: v.name,
        sku: v.sku,
        categoryId: v.categoryId,
        supplier: v.supplier ?? "",
        stock: Number(v.stock ?? 0),
        price: Number(v.price ?? 0),
        unit: v.unit ?? "",
        costPrice: v.costPrice != null ? Number(v.costPrice) : undefined,
        expiryDate: v.expiryDate ?? "",
        lotNumber: v.lotNumber ?? "",
      };
    });
    setState(rows);
  });
}

export async function addProduct(input: {
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
}) {
  const now = serverTimestamp();
  // สร้างสินค้า
  const ref = await addDoc(col, {
    name: input.name,
    sku: input.sku,
    categoryId: input.categoryId,
    supplier: input.supplier || null,
    stock: Number(input.initialQuantity || 0),
    unit: input.unit || null,
    costPrice: Number(input.costPrice || 0),
    price: Number(input.sellingPrice || 0),
    expiryDate: input.expiryDate || null,
    lotNumber: input.lotNumber || null,
    createdAt: now,
    updatedAt: now,
  } as Partial<ProductDoc>);

  // บันทึก movement เริ่มต้น (optional)
  await addDoc(collection(ref, "movements"), {
    type: "init",
    qty: Number(input.initialQuantity || 0),
    note: "Initial stock",
    at: serverTimestamp(),
  });
}

export async function adjustStock(
  productId: string,
  type: "add" | "remove",
  qty: number,
  note?: string
) {
  const ref = doc(col, productId);
  await runTransaction(db, async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists()) throw new Error("ไม่พบสินค้า");

    const data = snap.data() as ProductDoc;
    const current = Number(data.stock || 0);
    const delta = type === "add" ? qty : -qty;
    const next = current + delta;

    if (next < 0) throw new Error("สต๊อกติดลบไม่ได้");

    tx.update(ref, { stock: next, updatedAt: serverTimestamp() });
  });

  await addDoc(collection(ref, "movements"), {
    type,
    qty,
    note: note || null,
    at: serverTimestamp(),
  });
}

export async function deleteProduct(productId: string) {
  await deleteDoc(doc(col, productId));
}

// (option) แก้ไขข้อมูลทั่วไปสินค้า
export async function updateProduct(productId: string, patch: Partial<ProductDoc>) {
  await updateDoc(doc(col, productId), { ...patch, updatedAt: serverTimestamp() });
}

// ✅ โหลดข้อมูลเต็มของสินค้า 1 รายการ (ใช้พรีฟิลตอนกด Edit)
export async function getProduct(productId: string) {
  const ref = doc(col, productId);
  const s = await getDoc(ref);
  if (!s.exists()) throw new Error("ไม่พบสินค้า");
  const v = s.data() as ProductDoc;
  return {
    id: s.id,
    name: v.name,
    sku: v.sku,
    categoryId: v.categoryId,
    supplier: v.supplier ?? "",
    stock: Number(v.stock ?? 0),
    price: Number(v.price ?? 0),
    unit: v.unit ?? "",
    costPrice: v.costPrice != null ? Number(v.costPrice) : undefined,
    expiryDate: v.expiryDate ?? "",
    lotNumber: v.lotNumber ?? "",
  };
}
