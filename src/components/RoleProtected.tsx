// src/components/RoleProtected.tsx
import { useEffect, useState, type ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { roleOfEmail, type Role } from "@/lib/roles";

export function RoleProtected({
  children,
  allow,
  fallback = "/products",
}: {
  children: ReactNode;
  allow: Role[];         // บทบาทที่ผ่าน
  fallback?: string;     // เด้งไปที่ไหนถ้าไม่ผ่าน
}) {
  const [ready, setReady] = useState(false);
  const [authed, setAuthed] = useState(false);
  const [role, setRole] = useState<Role>("staff");
  const loc = useLocation();

  useEffect(() => {
    const unsub = onAuthStateChanged(getAuth(), (u) => {
      setAuthed(!!u);
      setRole(roleOfEmail(u?.email ?? null));
      setReady(true);
    });
    return () => unsub();
  }, []);

  if (!ready) return null; // ใส่สปินเนอร์ก็ได้

  // ยังไม่ล็อกอิน → เด้งไป /login พร้อมจำ path เดิม
  if (!authed) return <Navigate to="/login" replace state={{ from: loc.pathname }} />;

  // ล็อกอินแล้วแต่ role ไม่อยู่ใน allow → เด้งไป fallback
  if (!allow.includes(role)) return <Navigate to={fallback} replace />;

  return <>{children}</>;
}
