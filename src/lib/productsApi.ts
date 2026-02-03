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

/** โครงสร้างสินค้าใน Firestore */
export type ProductDoc = {
  name: string;
  sku: string;
  categoryId: string;
  supplier?: string | null;
  stock: number;
  unit?: string | null;
  costPrice?: number | null;
  price: number;                // sellingPrice
  expiryDate?: string | null;   // YYYY-MM-DD
  lotNumber?: string | null;
  /** ✅ เพิ่มฟิลด์หมายเหตุสินค้า */
  note?: string | null;

  createdAt: Timestamp;
  updatedAt: Timestamp;
};

const col = collection(db, "products");

/** subscribe รายการสินค้าแบบ realtime */
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
    /** ✅ ส่ง note ออกไปให้ UI ด้วย */
    note?: string;
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
        /** ✅ map note -> string (ถ้าไม่มีให้เป็น "") */
        note: v.note ?? "",
      };
    });
    setState(rows);
  });
}

/** เพิ่มสินค้าใหม่ */
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
  /** ✅ รับ note จาก UI */
  note?: string;
}) {
  const now = serverTimestamp();
  const ref = await addDoc(
    col,
    {
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
      /** ✅ บันทึกหมายเหตุสินค้า */
      note: input.note?.trim() || null,

      createdAt: now,
      updatedAt: now,
    } as Partial<ProductDoc>
  );

  // movement ตั้งต้น
  await addDoc(collection(ref, "movements"), {
    type: "init",
    qty: Number(input.initialQuantity || 0),
    note: "Initial stock",
    at: serverTimestamp(),
  });
}

/** ปรับสต๊อก (เพิ่ม/ตัด) – note จะถูกปั๊มจาก UI แล้ว (เช่น "dd/mm/yyyy - ตัดสต๊อก • ...") */
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

/** ลบสินค้า */
export async function deleteProduct(productId: string) {
  await deleteDoc(doc(col, productId));
}

/** อัปเดตข้อมูลสินค้า (ทั่วไป) */
export async function updateProduct(productId: string, patch: Partial<ProductDoc>) {
  await updateDoc(doc(col, productId), {
    ...patch,
    /** ✅ อนุญาตให้อัปเดต note ได้ (ถ้าไม่ส่งมาก็ไม่แตะ) */
    updatedAt: serverTimestamp(),
  });
}

/** โหลดสินค้าเดี่ยว (สำหรับหน้าแก้ไข) */
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
    /** ✅ ส่ง note ให้หน้าแก้ไขด้วย */
    note: v.note ?? "",
  };
}
