// src/components/Layout.tsx
import { ReactNode, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { NavLink } from "@/components/NavLink";
import { Button } from "@/components/ui/button";
import { Coffee, Home, Package, FileText, BarChart3, ClipboardList, LogOut } from "lucide-react";
import { getAuth, onAuthStateChanged, signOut } from "firebase/auth";
import { roleOfEmail } from "@/lib/roles";

interface LayoutProps {
  children: ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  const [email, setEmail] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const auth = getAuth();
    const unsub = onAuthStateChanged(auth, (u) => setEmail(u?.email ?? null));
    return () => unsub();
  }, []);

  const handleLogout = async () => {
    await signOut(getAuth());
    navigate("/login", { replace: true });
  };

  const role = roleOfEmail(email);

  // สิทธิ์เมนูตามบทบาท
  const canSee = {
    products: ["superadmin", "admin", "owner", "staff"].includes(role),
    inventory: ["superadmin", "admin", "owner"].includes(role),
    lots: ["superadmin", "admin", "owner"].includes(role),
    history: ["superadmin", "admin"].includes(role),
    reports: ["superadmin", "admin"].includes(role),
  };

  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-primary text-primary-foreground shadow-md">
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-3 py-4">
            <div className="w-10 h-10 rounded-full bg-primary-foreground/20 flex items-center justify-center">
              <Coffee className="w-6 h-6" />
            </div>
            <h1 className="text-xl font-bold">ระบบจัดการสต๊อกร้านคาเฟ่</h1>

            <div className="flex-grow" />
            {/* โซนขวา: อีเมลผู้ใช้ + ปุ่มออกจากระบบ */}
              <div className="flex items-center gap-3">
                {email && (
                  <span className="hidden sm:inline text-sm text-primary-foreground/80">
                    {email}
                  </span>
                )}
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleLogout}
                  className="border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10"
                  title="ออกจากระบบ"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  ออกจากระบบ
                </Button>
              </div>
          </div>

          {/* แยกซ้าย(เมนู) / ขวา(โปรไฟล์+ออกจากระบบ) */}
          <nav className="flex items-center justify-between -mb-px">
            {/* กลุ่มเมนูทางซ้าย */}
            <div className="flex gap-1">

              {canSee.products && (
              <NavLink
                to="/products"
                className="flex items-center gap-2 px-4 py-3 text-primary-foreground/80 hover:text-primary-foreground hover:bg-primary-foreground/10 rounded-t-lg transition-colors"
                activeClassName="!text-primary-foreground bg-primary-foreground/20 border-b-2 border-primary-foreground"
              >
                <Home className="w-4 h-4" />
                <span className="text-sm font-medium">สินค้า</span>
              </NavLink>
              )}

              {canSee.inventory && (
              <NavLink
                to="/inventory"
                className="flex items-center gap-2 px-4 py-3 text-primary-foreground/80 hover:text-primary-foreground hover:bg-primary-foreground/10 rounded-t-lg transition-colors"
                activeClassName="!text-primary-foreground bg-primary-foreground/20 border-b-2 border-primary-foreground"
              >
                <Package className="w-4 h-4" />
                <span className="text-sm font-medium">คลังสินค้า</span>
              </NavLink>
              )}

              {canSee.lots && (
              <NavLink
                to="/lots"
                className="flex items-center gap-2 px-4 py-3 text-primary-foreground/80 hover:text-primary-foreground hover:bg-primary-foreground/10 rounded-t-lg transition-colors"
                activeClassName="!text-primary-foreground bg-primary-foreground/20 border-b-2 border-primary-foreground"
              >
                <ClipboardList className="w-4 h-4" />
                <span className="text-sm font-medium">เพิ่มล๊อต</span>
              </NavLink>
              )}

              {canSee.history && ( 
              <NavLink
                to="/history"
                className="flex items-center gap-2 px-4 py-3 text-primary-foreground/80 hover:text-primary-foreground hover:bg-primary-foreground/10 rounded-t-lg transition-colors"
                activeClassName="!text-primary-foreground bg-primary-foreground/20 border-b-2 border-primary-foreground"
              >
                <FileText className="w-4 h-4" />
                <span className="text-sm font-medium">ประวัติ</span>
              </NavLink>
              )}

              {canSee.reports && (
              <NavLink
                to="/reports"
                className="flex items-center gap-2 px-4 py-3 text-primary-foreground/80 hover:text-primary-foreground hover:bg-primary-foreground/10 rounded-t-lg transition-colors"
                activeClassName="!text-primary-foreground bg-primary-foreground/20 border-b-2 border-primary-foreground"
              >
                <BarChart3 className="w-4 h-4" />
                <span className="text-sm font-medium">รายงาน</span>
              </NavLink>
              )}
            </div>
          </nav>
        </div>
      </header>

      <main className="flex-1">{children}</main>
    </div>
  );
};

export default Layout;
