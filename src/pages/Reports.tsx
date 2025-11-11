import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const Reports = () => {
  // Mock data - replace with real data later
  const stats = {
    totalProducts: 1,
    totalValue: 2624250.0,
    lowStock: 0,
    nearExpiry: 0,
  };

  const categories = [
    {
      name: "นม/ครีม",
      count: 1,
      value: 2624250.0,
    },
  ];

  const products = [
    {
      name: "สวาบง",
      category: "นม/ครีม",
      sku: "วสว7",
      stock: 503232,
      price: 52485.0,
      value: 2624250.0,
      expiry: "-",
    },
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      <h2 className="text-2xl font-bold mb-6">รายงานสรุป</h2>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-normal text-muted-foreground">
              จำนวนสินค้าทั้งหมด
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-primary">{stats.totalProducts}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-normal text-muted-foreground">
              มูลค่าสินค้าทั้งหมด
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-success">
              ฿{stats.totalValue.toLocaleString("th-TH", { minimumFractionDigits: 2 })}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-normal text-muted-foreground">
              สินค้าใกล้สิ้นขด
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-destructive">{stats.lowStock}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-normal text-muted-foreground">
              สินค้าใกล้สิ้นขดอายุ
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-destructive">{stats.nearExpiry}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Category Summary */}
        <Card>
          <CardHeader>
            <CardTitle>ศูนย์ควบคุมอนุอนุ</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {categories.map((category) => (
                <div key={category.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Checkbox id={category.name} />
                    <label htmlFor={category.name} className="text-sm font-medium">
                      {category.name}
                    </label>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">{category.count} รายการ</p>
                    <p className="text-sm text-muted-foreground">
                      ฿{category.value.toLocaleString("th-TH", { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Near Expiry */}
        <Card>
          <CardHeader>
            <CardTitle>สินค้าใกล้สิ้นขดอายุ</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground text-center py-8">
              ไม่มีสินค้าใกล้สิ้นขดอายุ
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Products Table */}
      <Card>
        <CardHeader>
          <CardTitle>รายละเอียดสินค้าทั้งหมด</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>สินค้า</TableHead>
                <TableHead>หมวดหมู่</TableHead>
                <TableHead>SKU</TableHead>
                <TableHead>สต๊อก</TableHead>
                <TableHead>ราคาขาย</TableHead>
                <TableHead>มูลค่า</TableHead>
                <TableHead>หมดอายุ</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.map((product) => (
                <TableRow key={product.sku}>
                  <TableCell className="font-medium">{product.name}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">{product.category}</Badge>
                  </TableCell>
                  <TableCell>{product.sku}</TableCell>
                  <TableCell>{product.stock.toLocaleString()}</TableCell>
                  <TableCell>
                    ฿{product.price.toLocaleString("th-TH", { minimumFractionDigits: 2 })}
                  </TableCell>
                  <TableCell>
                    ฿{product.value.toLocaleString("th-TH", { minimumFractionDigits: 2 })}
                  </TableCell>
                  <TableCell>{product.expiry}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default Reports;
