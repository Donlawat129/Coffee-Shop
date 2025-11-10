import { ReactNode } from "react";
import { NavLink } from "@/components/NavLink";
import { Coffee, Home, Package, FileText, BarChart3, ClipboardList } from "lucide-react";

interface LayoutProps {
  children: ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-primary text-primary-foreground shadow-md">
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-3 py-4">
            <div className="w-10 h-10 rounded-full bg-primary-foreground/20 flex items-center justify-center">
              <Coffee className="w-6 h-6" />
            </div>
            <h1 className="text-xl font-bold">ระบบจัดการสต๊อกร้านคาเฟ่</h1>
          </div>
          <nav className="flex gap-1 -mb-px">
            <NavLink
              to="/"
              className="flex items-center gap-2 px-4 py-3 text-primary-foreground/80 hover:text-primary-foreground hover:bg-primary-foreground/10 rounded-t-lg transition-colors"
              activeClassName="!text-primary-foreground bg-primary-foreground/20 border-b-2 border-primary-foreground"
            >
              <Home className="w-4 h-4" />
              <span className="text-sm font-medium">สินค้า</span>
            </NavLink>
            <NavLink
              to="/inventory"
              className="flex items-center gap-2 px-4 py-3 text-primary-foreground/80 hover:text-primary-foreground hover:bg-primary-foreground/10 rounded-t-lg transition-colors"
              activeClassName="!text-primary-foreground bg-primary-foreground/20 border-b-2 border-primary-foreground"
            >
              <Package className="w-4 h-4" />
              <span className="text-sm font-medium">คลังสินค้า</span>
            </NavLink>
            <NavLink
              to="/lots"
              className="flex items-center gap-2 px-4 py-3 text-primary-foreground/80 hover:text-primary-foreground hover:bg-primary-foreground/10 rounded-t-lg transition-colors"
              activeClassName="!text-primary-foreground bg-primary-foreground/20 border-b-2 border-primary-foreground"
            >
              <ClipboardList className="w-4 h-4" />
              <span className="text-sm font-medium">เพิ่มล๊อต</span>
            </NavLink>
            <NavLink
              to="/history"
              className="flex items-center gap-2 px-4 py-3 text-primary-foreground/80 hover:text-primary-foreground hover:bg-primary-foreground/10 rounded-t-lg transition-colors"
              activeClassName="!text-primary-foreground bg-primary-foreground/20 border-b-2 border-primary-foreground"
            >
              <FileText className="w-4 h-4" />
              <span className="text-sm font-medium">ประวัติ</span>
            </NavLink>
            <NavLink
              to="/reports"
              className="flex items-center gap-2 px-4 py-3 text-primary-foreground/80 hover:text-primary-foreground hover:bg-primary-foreground/10 rounded-t-lg transition-colors"
              activeClassName="!text-primary-foreground bg-primary-foreground/20 border-b-2 border-primary-foreground"
            >
              <BarChart3 className="w-4 h-4" />
              <span className="text-sm font-medium">รายงาน</span>
            </NavLink>
          </nav>
        </div>
      </header>
      <main className="flex-1">{children}</main>
    </div>
  );
};

export default Layout;
