import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface DeleteConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  productCount: number;
  productNames?: string[];
}

export const DeleteConfirmDialog = ({
  open,
  onOpenChange,
  onConfirm,
  productCount,
  productNames = [],
}: DeleteConfirmDialogProps) => {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>ยืนยันการลบสินค้า</AlertDialogTitle>
          <AlertDialogDescription className="space-y-2">
            <p>
              คุณต้องการลบสินค้า {productCount} รายการใช่หรือไม่?
            </p>
            {productNames.length > 0 && (
              <div className="bg-muted p-3 rounded-md mt-2">
                <p className="font-medium mb-1">รายการที่จะลบ:</p>
                <ul className="list-disc list-inside text-sm">
                  {productNames.map((name, index) => (
                    <li key={index}>{name}</li>
                  ))}
                </ul>
              </div>
            )}
            <p className="text-destructive font-medium">
              การดำเนินการนี้ไม่สามารถย้อนกลับได้
            </p>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>ยกเลิก</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className="bg-destructive hover:bg-destructive/90"
          >
            ลบสินค้า
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
