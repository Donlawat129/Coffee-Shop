// src\pages\History.tsx
import { useEffect, useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Coffee, FilterX } from "lucide-react";

import {
  collectionGroup,
  onSnapshot,
  orderBy,
  query,
  limit,
  Timestamp,
  QueryDocumentSnapshot,
  DocumentData,
} from "firebase/firestore";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { db } from "@/lib/firebase";
import { onProductsSubscribe } from "@/lib/productsApi";

/* ---------- Types ---------- */
type MovementType = "init" | "add" | "remove";

type MovementDoc = {
  type: MovementType;
  qty: number;
  note?: string | null;
  at: Timestamp;
};

type ProductRow = {
  id: string;
  name: string;
  sku: string;
  unit?: string;
  categoryId?: string;
  lotNumber?: string;
};

type HistoryItem = {
  id: string;        // movement doc id
  productId: string; // parent product id
  type: MovementType;
  qty: number;
  note?: string | null;
  atISO: string;
};

/* ---------- Helpers ---------- */
function movementToDelta(m: Pick<MovementDoc, "type" | "qty">): number {
  if (m.type === "remove") return -Math.abs(Number(m.qty || 0));
  return Math.abs(Number(m.qty || 0)); // init/add เป็นบวก
}

const TYPE_LABEL: Record<MovementType, string> = {
  init: "ตั้งต้น",
  add: "เพิ่มสต๊อก",
  remove: "ลดสต๊อก",
};

// ข้อความปฏิบัติการบนบรรทัด timestamp (ต้องการคำว่า "ตัดสต๊อก" ตามรีเควส)
const STAMP_ACTION: Record<MovementType, string> = {
  init: "ตั้งต้น",
  add: "เพิ่มสต๊อก",
  remove: "ตัดสต๊อก",
};

const TYPE_BADGE: Record<
  MovementType,
  "default" | "secondary" | "destructive" | "outline"
> = {
  init: "secondary",
  add: "default",
  remove: "destructive",
};

const MAX_ROWS = 500;
const ADMIN_EMAILS = new Set(["admin@gmail.com", "superadmin@gmail.com"]);

// format dd/mm/yyyy (คำนวณจากเวลาในเครื่อง/เขตเวลาโลคัล)
function formatDMY(d: Date): string {
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = String(d.getFullYear());
  return `${dd}/${mm}/${yyyy}`;
}

// ดึงเฉพาะ "ส่วนเนื้อหา" ของหมายเหตุ ถ้า note ถูกปั๊ม stamp มาแล้ว เช่น "01/12/2025 - ตัดสต๊อก • ข้อความผู้ใช้"
function extractUserNote(note?: string | null): string {
  if (!note) return "";
  const m = note.match(
    /^(\d{2}\/\d{2}\/\d{4})\s*-\s*(ตัดสต๊อก|เพิ่มสต๊อก|ตั้งต้น)\s*(?:•\s*)?(.*)$/
  );
  if (m) {
    return (m[3] || "").trim();
  }
  return note.trim();
}

/* ---------- Component ---------- */
export default function History() {
  const [authReady, setAuthReady] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  const [products, setProducts] = useState<ProductRow[]>([]);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [errorText, setErrorText] = useState<string | null>(null);

  // ฟิลเตอร์
  const [q, setQ] = useState("");
  const [typeFilter, setTypeFilter] = useState<MovementType | "all">("all");
  const [fromDate, setFromDate] = useState<string>(""); // YYYY-MM-DD
  const [toDate, setToDate] = useState<string>("");     // YYYY-MM-DD

  // auth ready + เก็บ email
  useEffect(() => {
    const auth = getAuth();
    const unsub = onAuthStateChanged(auth, (u) => {
      setUserEmail(u?.email ?? null);
      setAuthReady(true);
    });
    return () => unsub();
  }, []);

  const isAdmin = !!(userEmail && ADMIN_EMAILS.has(userEmail));

  // product map (ไว้ join)
  const productMap = useMemo(() => {
    const m = new Map<string, ProductRow>();
    for (const p of products) m.set(p.id, p);
    return m;
  }, [products]);

  // subscribe products realtime (ทุกคนที่ล็อกอินอ่านได้)
  useEffect(() => {
    if (!authReady) return;
    const unsub = onProductsSubscribe((rows) => {
      const mapped: ProductRow[] = rows.map((r) => ({
        id: r.id,
        name: r.name,
        sku: r.sku,
        unit: r.unit,
        categoryId: r.categoryId,
        lotNumber: r.lotNumber,
      }));
      setProducts(mapped);
    });
    return () => unsub();
  }, [authReady]);

  // subscribe movements (collectionGroup) เฉพาะ admin/superadmin เท่านั้น
  useEffect(() => {
    if (!authReady) return;

    // ถ้าไม่ใช่ admin/superadmin: ไม่ยิง query เลย
    if (!isAdmin) {
      setHistory([]);
      setErrorText("คุณไม่มีสิทธิ์ดูประวัติการเปลี่ยนแปลงสต๊อก");
      return;
    }

    setErrorText(null);
    const qMov = query(
      collectionGroup(db, "movements"),
      orderBy("at", "desc"),
      limit(MAX_ROWS)
    );

    const unsub = onSnapshot(
      qMov,
      (snap) => {
        const rows: HistoryItem[] = snap.docs.map(
          (d: QueryDocumentSnapshot<DocumentData>) => {
            const data = d.data() as MovementDoc;
            const parent = d.ref.parent.parent; // products/{productId}
            const productId = parent ? parent.id : "";
            const at =
              data.at && "toDate" in data.at ? data.at.toDate() : new Date();
            return {
              id: d.id,
              productId,
              type: data.type,
              qty: Number(data.qty || 0),
              note: data.note ?? null,
              atISO: at.toISOString(),
            };
          }
        );
        setHistory(rows);
      },
      (err) => {
        if ((err as { code?: string }).code === "permission-denied") {
          setErrorText("คุณไม่มีสิทธิ์ดูประวัติการเปลี่ยนแปลงสต๊อก");
        } else {
          setErrorText(
            (err as Error)?.message || "เกิดข้อผิดพลาดในการโหลดประวัติ"
          );
        }
      }
    );

    return () => unsub();
  }, [authReady, isAdmin]);

  // กรอง movement ของสินค้าที่ถูกลบ + ฟิลเตอร์อื่น ๆ
  const filtered = useMemo(() => {
    const existing = new Set(products.map((p) => p.id));

    const qLower = q.trim().toLowerCase();
    const fromISO = fromDate
      ? new Date(fromDate + "T00:00:00.000Z").toISOString()
      : "";
    const toISO = toDate
      ? new Date(toDate + "T23:59:59.999Z").toISOString()
      : "";

    return history
      .filter((h) => existing.has(h.productId)) // ทิ้ง movement ของสินค้าที่ถูกลบ
      .filter((h) => {
        if (typeFilter !== "all" && h.type !== typeFilter) return false;
        if (fromISO && h.atISO < fromISO) return false;
        if (toISO && h.atISO > toISO) return false;

        if (qLower) {
          const p = productMap.get(h.productId);
          const hay = `${p?.name ?? ""} ${p?.sku ?? ""} ${p?.lotNumber ?? ""}`;
          if (!hay.toLowerCase().includes(qLower)) return false;
        }
        return true;
      });
  }, [history, products, typeFilter, fromDate, toDate, q, productMap]);

  const clearFilters = () => {
    setQ("");
    setTypeFilter("all");
    setFromDate("");
    setToDate("");
  };

  // ---------- Render ----------
  if (!authReady) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="p-6 text-sm text-muted-foreground">
            กำลังเตรียมสิทธิ์เข้าใช้งาน…
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="p-6 text-sm text-destructive">
            คุณไม่มีสิทธิ์ดูประวัติการเปลี่ยนแปลงสต๊อก
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">ประวัติการเปลี่ยนแปลงสต๊อก</h2>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
            <div className="md:col-span-2">
              <Input
                placeholder="ค้นหา ชื่อสินค้า / SKU / เลขล๊อต"
                value={q}
                onChange={(e) => setQ(e.target.value)}
              />
            </div>

            <div>
              <select
                className="w-full h-10 border rounded-md px-3 bg-background"
                value={typeFilter}
                onChange={(e) =>
                  setTypeFilter(e.target.value as MovementType | "all")
                }
              >
                <option value="all">ทุกประเภท</option>
                <option value="add">เพิ่มสต๊อก</option>
                <option value="remove">ลดสต๊อก</option>
                <option value="init">ตั้งต้น</option>
              </select>
            </div>

            <div>
              <Input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                placeholder="จากวัน"
              />
            </div>

            <div className="flex gap-2">
              <Input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                placeholder="ถึงวัน"
              />
              <Button
                variant="outline"
                onClick={clearFilters}
                title="ล้างตัวกรอง"
              >
                <FilterX className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Error / Empty / List */}
      {errorText ? (
        <Card>
          <CardContent className="p-6 text-sm text-destructive">
            {errorText}
          </CardContent>
        </Card>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-sm text-muted-foreground">
            ไม่พบข้อมูลตามตัวกรอง
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filtered.map((item) => {
            const p = productMap.get(item.productId);
            const delta = movementToDelta({ type: item.type, qty: item.qty });
            const isPlus = delta >= 0;
            const qtyStr = `${isPlus ? "+" : ""}${delta.toLocaleString(
              "th-TH",
              { maximumFractionDigits: 4 }
            )}`;

            // บรรทัด timestamp ตามรีเควส: "dd/mm/yyyy - ตัดสต๊อก" (หรือ เพิ่มสต๊อก/ตั้งต้น)
            const at = new Date(item.atISO);
            const stampLine = `${formatDMY(at)} - ${STAMP_ACTION[item.type]}`;

            // หมายเหตุ: ตัด prefix ที่อาจถูกปั๊มไว้แล้ว เพื่อไม่ให้ซ้ำกับบรรทัด timestamp
            const userNote = extractUserNote(item.note);

            return (
              <Card key={`${item.productId}_${item.id}`}>
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center">
                      <Coffee className="w-6 h-6 text-muted-foreground" />
                    </div>

                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold">
                          {p?.name ?? "ไม่พบสินค้า"}
                          {p?.unit ? ` (${p.unit})` : ""}
                        </h3>
                        <Badge variant={TYPE_BADGE[item.type]}>
                          {TYPE_LABEL[item.type]}
                        </Badge>
                      </div>

                      <div className="space-y-1 text-sm">
                        {/* บรรทัด timestamp ใหม่ */}
                        <p className="text-xs font-medium">{stampLine}</p>

                        <p className="text-muted-foreground">
                          SKU: {p?.sku ?? "-"}
                        </p>

                        <p
                          className={
                            isPlus
                              ? "text-success font-semibold text-lg"
                              : "text-destructive font-semibold text-lg"
                          }
                        >
                          {qtyStr}
                        </p>

                        <p className="text-muted-foreground">
                          ล๊อต: {p?.lotNumber || "-"}
                        </p>

                        <p className="text-muted-foreground">
                          หมายเหตุ: {userNote !== "" ? userNote : "-"}
                        </p>

                        {/* ถ้าต้องการแสดงวันเวลาเต็มเดิมเก็บไว้ได้:
                        <p className="text-muted-foreground text-xs">
                          {new Date(item.atISO).toLocaleString("th-TH")}
                        </p>
                        */}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
