import {
  collection,
  addDoc,
  serverTimestamp,
  doc,
  writeBatch,
  updateDoc,
  onSnapshot,
  query,
  orderBy,
  Timestamp,
  getDoc,
  getDocs,
  limit,
  deleteDoc,
  endAt,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

export type LotHeader = {
  lotNumber: string;
  supplier: string;
  expiryDate?: string | null;
  itemsCount?: number;
  createdAt?: Timestamp;
  /** ✅ หมายเหตุหัวล๊อต */
  note?: string | null;
};

export type LotItem = {
  name: string;
  sku: string;
  unit: string;
  stock: number;
  expiryDate?: string | null;
  lotNumber?: string | null;
  productId?: string | null;
  createdAt?: Timestamp;
};

/** สร้างหัวล๊อต แล้วคืน lotId */
export async function addLot(header: {
  lotNumber: string;
  supplier: string;
  expiryDate?: string;
  /** ✅ รับ note */
  note?: string;
}) {
  const ref = await addDoc(collection(db, "lots"), {
    lotNumber: header.lotNumber,
    supplier: header.supplier,
    expiryDate: header.expiryDate ?? null,
    itemsCount: 0,
    /** ✅ บันทึก note ที่หัวล๊อต */
    note: header.note?.trim() || null,
    createdAt: serverTimestamp(),
  });
  return ref.id;
}

/** เพิ่มรายการสินค้าเข้า subcollection /lots/{lotId}/items แบบ batch */
export async function addLotItems(lotId: string, items: LotItem[]) {
  const col = collection(db, "lots", lotId, "items");
  const batch = writeBatch(db);
  items.forEach((it) => {
    const r = doc(col);
    batch.set(r, {
      ...it,
      expiryDate: it.expiryDate ?? null,
      lotNumber: it.lotNumber ?? null,
      productId: it.productId ?? null,
      createdAt: serverTimestamp(),
    });
  });
  await batch.commit();
}

/** อัปเดตจำนวนรายการของล๊อต */
export async function setLotItemsCount(lotId: string, count: number) {
  await updateDoc(doc(db, "lots", lotId), { itemsCount: count });
}

/** ดึงหัวล๊อตครั้งเดียว */
export async function getLot(lotId: string): Promise<(LotHeader & { id: string }) | null> {
  const snap = await getDoc(doc(db, "lots", lotId));
  if (!snap.exists()) return null;
  const v = snap.data() as LotHeader;
  return { id: snap.id, ...v };
}

/** subscribe ลิสต์ล๊อตล่าสุดแบบ realtime */
export function onLotsSubscribe(
  cb: (rows: Array<LotHeader & { id: string }>) => void
) {
  const qy = query(collection(db, "lots"), orderBy("createdAt", "desc"));
  return onSnapshot(qy, (snap) => {
    const data = snap.docs.map((d) => {
      const v = d.data() as LotHeader;
      return { id: d.id, ...v };
    });
    cb(data);
  });
}

/** subscribe รายการสินค้าในล๊อต */
export function onLotItemsSubscribe(
  lotId: string,
  cb: (rows: Array<LotItem & { id: string }>) => void
) {
  const qy = query(collection(db, "lots", lotId, "items"), orderBy("createdAt", "desc"));
  return onSnapshot(qy, (snap) => {
    const data = snap.docs.map((d) => {
      const v = d.data() as LotItem;
      return { id: d.id, ...v };
    });
    cb(data);
  });
}

/** ลบล๊อตแบบถาวร: ลบ subcollection items ทั้งหมดก่อน แล้วค่อยลบหัวล๊อต */
export async function deleteLotHard(lotId: string): Promise<void> {
  const lotRef = doc(db, "lots", lotId);
  const itemsCol = collection(lotRef, "items");

  const BATCH_SIZE = 400; // เผื่อเหลือใต้ลิมิต 500 writes/batch
  while (true) {
    const snap = await getDocs(query(itemsCol, limit(BATCH_SIZE)));
    if (snap.empty) break;
    const batch = writeBatch(db);
    snap.docs.forEach((d) => batch.delete(d.ref));
    await batch.commit();
  }

  await deleteDoc(lotRef);
}

/** ✅ ลบล๊อตทั้งหมดที่ createdAt <= dateISO (yyyy-mm-dd) — คืนจำนวนที่ลบได้ */
export async function deleteLotsBefore(dateISO: string): Promise<number> {
  const endTs = Timestamp.fromDate(new Date(`${dateISO}T23:59:59.999Z`));
  const BATCH = 30; // คุมความเร็ว/โควต้า

  let total = 0;
  while (true) {
    const snap = await getDocs(
      query(collection(db, "lots"), orderBy("createdAt", "asc"), endAt(endTs), limit(BATCH))
    );
    if (snap.empty) break;

    for (const d of snap.docs) {
      await deleteLotHard(d.id);
      total++;
    }
  }
  return total;
}
