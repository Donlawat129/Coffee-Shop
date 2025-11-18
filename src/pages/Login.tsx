import { useEffect, useState, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  getAuth,
  setPersistence,
  browserLocalPersistence,
  browserSessionPersistence,
  signInWithEmailAndPassword,
  onAuthStateChanged,
} from "firebase/auth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";

    function mapAuthError(code: string): string {
    switch (code) {
        case "auth/invalid-email":
        return "อีเมลไม่ถูกต้อง";
        case "auth/user-disabled":
        return "บัญชีผู้ใช้นี้ถูกระงับ";
        case "auth/user-not-found":
        case "auth/wrong-password":
        return "อีเมลหรือรหัสผ่านไม่ถูกต้อง";
        case "auth/too-many-requests":
        return "พยายามเข้าสู่ระบบหลายครั้งเกินไป ลองใหม่ภายหลัง";
        default:
        return "เข้าสู่ระบบไม่สำเร็จ กรุณาลองใหม่";
    }
    }

    export default function Login() {
    const nav = useNavigate();
    const location = useLocation();
    const { toast } = useToast();
    const didNavRef = useRef(false);

    const [email, setEmail] = useState<string>("");
    const [password, setPassword] = useState<string>("");
    const [remember, setRemember] = useState<boolean>(true);
    const [loading, setLoading] = useState<boolean>(false);
    

    // ถ้า login อยู่แล้ว ให้เด้งออกจากหน้า login
    useEffect(() => {
        const auth = getAuth();
        const unsub = onAuthStateChanged(auth, (u) => {
        if (u && !didNavRef.current) {
            didNavRef.current = true;
            // ถ้ามี state.from เดิม ให้กลับไปหน้านั้น
        const from = (location.state as { from?: string } | null)?.from || "/products";
        nav(from, { replace: true });
        }
        });
        return () => unsub();
    }, [location.state, nav]);

    const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
        const auth = getAuth();
        await setPersistence(
        auth,
        remember ? browserLocalPersistence : browserSessionPersistence
        );
        await signInWithEmailAndPassword(auth, email.trim(), password);
        toast({ title: "เข้าสู่ระบบสำเร็จ", description: "ยินดีต้อนรับกลับมา" });
        if (!didNavRef.current) {
            didNavRef.current = true;
            const from = (location.state as { from?: string } | null)?.from || "/products";
            nav(from, { replace: true });
        }
    } catch (err) {
        const code = (err as { code?: string })?.code || "";
        toast({
        title: "เกิดข้อผิดพลาด",
        description: mapAuthError(code),
        variant: "destructive",
        });
    } finally {
        setLoading(false);
    }
    };

  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      {/* แถบหัวสีแบรนด์ */}
      <div className="fixed top-0 left-0 right-0 h-1 bg-[#F97415]" />

      <Card className="w-full max-w-md p-8 shadow-lg border">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 h-12 w-12 rounded-full bg-[#F97415] flex items-center justify-center text-white text-xl font-bold">
            ☕
          </div>
          <h1 className="text-2xl font-bold text-gray-900">เข้าสู่ระบบ</h1>
          <p className="text-sm text-gray-500 mt-1">โปรดลงชื่อเข้าใช้เพื่อดำเนินการต่อ</p>
        </div>

        <form onSubmit={onSubmit} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="email">อีเมล</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="bg-white"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">รหัสผ่าน</Label>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="bg-white"
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Checkbox
                id="remember"
                checked={remember}
                onCheckedChange={(v) => setRemember(Boolean(v))}
              />
              <Label htmlFor="remember" className="text-sm text-gray-700">
                จำการเข้าสู่ระบบ
              </Label>
            </div>
            {/* ไม่ทำลืมรหัสตามที่ขอ */}
            <span className="text-xs text-gray-400 select-none">v1.0</span>
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="w-full bg-[#F97415] hover:bg-[#e0640d] text-white"
          >
            {loading ? "กำลังเข้าสู่ระบบ..." : "เข้าสู่ระบบ"}
          </Button>
        </form>
      </Card>
    </div>
  );
}
