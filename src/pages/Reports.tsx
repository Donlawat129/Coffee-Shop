// src/pages/Reports.tsx
import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { onProductsSubscribe } from "@/lib/productsApi";

/* ---------- Types from productsApi shape ---------- */
type UIProduct = {
  id: string;
  name: string;
  sku: string;
  unit?: string;
  categoryId?: string;
  stock: number;
  expiryDate?: string;  // YYYY-MM-DD | "" | undefined
  lotNumber?: string;
};

function parseISODateOnly(d?: string): Date | null {
  if (!d) return null;
  const s = d.trim();
  if (!s || !/^\d{4}-\d{2}-\d{2}$/.test(s)) return null;
  return new Date(`${s}T00:00:00`);
}

function daysUntil(dateStr?: string): number | null {
  const d = parseISODateOnly(dateStr);
  if (!d) return null;
  const now = new Date();
  const dn = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const dd = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const diff = (dd.getTime() - dn.getTime()) / (1000 * 60 * 60 * 24);
  return Math.round(diff);
}

export default function Reports() {
  const [rows, setRows] = useState<UIProduct[]>([]);
  const [lowStockThreshold] = useState<number>(5);   // สินค้าใกล้หมด: stock ≤ 5
  const [nearExpiryDays] = useState<number>(30);     // ใกล้หมดอายุภายใน 30 วัน

  // subscribe products realtime
  useEffect(() => {
    const unsub = onProductsSubscribe((ps) => {
      const mapped: UIProduct[] = ps.map((p) => ({
        id: p.id,
        name: p.name,
        sku: p.sku,
        unit: p.unit,
        categoryId: p.categoryId,
        stock: p.stock,
        expiryDate: p.expiryDate,
        lotNumber: p.lotNumber,
      }));
      setRows(mapped);
    });
    return () => unsub();
  }, []);

  // หมวดหมู่/หน่วย สำหรับแสดงและกรอง (ใช้ unit ก่อน ถ้าไม่มี fallback เป็น categoryId)
  const categories = useMemo(() => {
    const map = new Map<string, { name: string; count: number }>();
    for (const p of rows) {
      const label = (p.unit && p.unit.trim()) || (p.categoryId || "อื่นๆ");
      const cur = map.get(label) || { name: label, count: 0 };
      cur.count += 1;
      map.set(label, cur);
    }
    return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name, "th"));
  }, [rows]);

  // เซ็ตตัวกรองหมวดหมู่ (ติ๊กหลายอันได้)
  const [selectedCats, setSelectedCats] = useState<Set<string>>(new Set());
  const toggleCat = (name: string, checked: boolean) => {
    setSelectedCats((prev) => {
      const next = new Set(prev);
      if (checked) next.add(name);
      else next.delete(name);
      return next;
    });
  };
  const useFilter = selectedCats.size > 0;

  // product ที่ผ่านตัวกรองหมวดหมู่
  const filteredRows = useMemo(() => {
    if (!useFilter) return rows;
    return rows.filter((p) => {
      const label = (p.unit && p.unit.trim()) || (p.categoryId || "อื่นๆ");
      return selectedCats.has(label);
    });
  }, [rows, selectedCats, useFilter]);

  // สถิติ (ตัดราคาขาย/มูลค่าออก เหลือ 3 การ์ด)
  const stats = useMemo(() => {
    const totalProducts = filteredRows.length;
    const lowStock = filteredRows.reduce((cnt, p) => cnt + (p.stock <= lowStockThreshold ? 1 : 0), 0);
    const nearExpiry = filteredRows.reduce((cnt, p) => {
      const d = daysUntil(p.expiryDate);
      return cnt + (d !== null && d >= 0 && d <= nearExpiryDays ? 1 : 0);
    }, 0);
    return { totalProducts, lowStock, nearExpiry };
  }, [filteredRows, lowStockThreshold, nearExpiryDays]);

  // รายการใกล้หมดอายุ (โชว์ 8 รายการล่าสุด)
  const nearExpiryList = useMemo(() => {
    const list = filteredRows
      .map((p) => ({ p, d: daysUntil(p.expiryDate) }))
      .filter((x) => x.d !== null && (x.d as number) >= 0 && (x.d as number) <= nearExpiryDays)
      .sort((a, b) => (a.d as number) - (b.d as number))
      .slice(0, 8);
    return list;
  }, [filteredRows, nearExpiryDays]);

  // ตารางสินค้า (ไม่แสดงราคา/มูลค่า)
  const tableRows = useMemo(() => {
    return filteredRows
      .map((p) => ({
        ...p,
        expiryLabel: p.expiryDate && parseISODateOnly(p.expiryDate)
          ? p.expiryDate
          : "-",
        catLabel: (p.unit && p.unit.trim()) || (p.categoryId || "อื่นๆ"),
      }))
      .sort((a, b) => a.name.localeCompare(b.name, "th"));
  }, [filteredRows]);

  return (
    <div className="container mx-auto px-4 py-8">
      <h2 className="text-2xl font-bold mb-6">รายงานสรุป</h2>

      {/* สรุปสถิติ (3 การ์ด) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-normal text-muted-foreground">
              จำนวนสินค้าทั้งหมด {useFilter ? "(ตามตัวกรอง)" : ""}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-primary">{stats.totalProducts}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-normal text-muted-foreground">
              สินค้าใกล้หมด (≤ {lowStockThreshold})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-destructive">{stats.lowStock}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-normal text-muted-foreground">
              สินค้าใกล้หมดอายุ (≤ {nearExpiryDays} วัน)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-destructive">{stats.nearExpiry}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* สรุปตามหมวดหมู่/หน่วย + filter (ไม่มีมูลค่าแล้ว) */}
        <Card>
          <CardHeader>
            <CardTitle>สรุปตามหมวดหมู่/หน่วย</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {categories.length === 0 ? (
                <p className="text-sm text-muted-foreground">ยังไม่มีสินค้า</p>
              ) : (
                categories.map((category) => {
                  const checked = selectedCats.has(category.name);
                  return (
                    <div key={category.name} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Checkbox
                          id={category.name}
                          checked={checked}
                          onCheckedChange={(v) => toggleCat(category.name, Boolean(v))}
                        />
                        <label htmlFor={category.name} className="text-sm font-medium cursor-pointer">
                          {category.name}
                        </label>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">{category.count} รายการ</p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </CardContent>
        </Card>

        {/* ใกล้หมดอายุ */}
        <Card>
          <CardHeader>
            <CardTitle>สินค้าใกล้หมดอายุ (≤ {nearExpiryDays} วัน)</CardTitle>
          </CardHeader>
          <CardContent>
            {nearExpiryList.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                ไม่มีสินค้าใกล้หมดอายุ
              </p>
            ) : (
              <div className="space-y-3">
                {nearExpiryList.map(({ p, d }) => (
                  <div
                    key={p.id}
                    className="flex items-center justify-between p-3 rounded-lg border"
                  >
                    <div>
                      <div className="font-medium">{p.name}</div>
                      <div className="text-xs text-muted-foreground">
                        SKU: {p.sku} {p.lotNumber ? `• ล็อต: ${p.lotNumber}` : ""}
                      </div>
                    </div>
                    <Badge variant="destructive">
                      เหลือ {d} วัน
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ตารางสินค้า (ไม่มีคอลัมน์ราคาขาย/มูลค่า) */}
      <Card>
        <CardHeader>
          <CardTitle>รายละเอียดสินค้าทั้งหมด{useFilter ? " (ตามตัวกรอง)" : ""}</CardTitle>
        </CardHeader>
        <CardContent>
          {tableRows.length === 0 ? (
            <p className="text-sm text-muted-foreground">ยังไม่มีรายการ</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>สินค้า</TableHead>
                  <TableHead>หมวดหมู่/หน่วย</TableHead>
                  <TableHead>SKU</TableHead>
                  <TableHead className="text-right">สต๊อก</TableHead>
                  <TableHead>หมดอายุ</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tableRows.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium">{p.name}</TableCell>
                    <TableCell><Badge variant="secondary">{p.catLabel}</Badge></TableCell>
                    <TableCell>{p.sku}</TableCell>
                    <TableCell className="text-right">
                      {p.stock.toLocaleString("th-TH", { maximumFractionDigits: 4 })}
                    </TableCell>
                    <TableCell>{p.expiryLabel}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
