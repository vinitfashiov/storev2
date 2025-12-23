import { useRef } from 'react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { FileText, Download, Printer } from 'lucide-react';

interface OrderItem {
  id: string;
  name: string;
  qty: number;
  unit_price: number;
  line_total: number;
}

interface OrderInvoiceProps {
  order: {
    id: string;
    order_number: string;
    customer_name: string;
    customer_phone: string;
    customer_email: string | null;
    shipping_address: Record<string, string>;
    subtotal: number;
    discount_total: number;
    delivery_fee: number;
    total: number;
    status: string;
    payment_status: string;
    payment_method: string;
    created_at: string;
    coupon_code?: string | null;
  };
  items: OrderItem[];
  storeName: string;
  storeAddress?: string;
  storePhone?: string;
  storeEmail?: string;
}

export default function OrderInvoice({ order, items, storeName, storeAddress, storePhone, storeEmail }: OrderInvoiceProps) {
  const invoiceRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    const printContent = invoiceRef.current;
    if (!printContent) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Invoice - ${order.order_number}</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: system-ui, -apple-system, sans-serif; padding: 40px; color: #333; }
            .invoice-header { display: flex; justify-content: space-between; margin-bottom: 40px; }
            .store-info h1 { font-size: 24px; margin-bottom: 8px; }
            .store-info p { font-size: 12px; color: #666; }
            .invoice-meta { text-align: right; }
            .invoice-meta h2 { font-size: 28px; color: #6366f1; margin-bottom: 8px; }
            .invoice-meta p { font-size: 12px; color: #666; }
            .section { margin-bottom: 30px; }
            .section-title { font-size: 12px; font-weight: 600; color: #666; margin-bottom: 8px; text-transform: uppercase; }
            .customer-info p { margin-bottom: 4px; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
            th { background: #f5f5f5; padding: 12px 8px; text-align: left; font-size: 12px; font-weight: 600; text-transform: uppercase; color: #666; }
            td { padding: 12px 8px; border-bottom: 1px solid #eee; }
            .text-right { text-align: right; }
            .totals { margin-left: auto; width: 250px; }
            .totals-row { display: flex; justify-content: space-between; padding: 8px 0; }
            .totals-row.total { font-weight: bold; font-size: 18px; border-top: 2px solid #333; padding-top: 12px; }
            .discount { color: #16a34a; }
            .footer { margin-top: 60px; text-align: center; font-size: 12px; color: #666; }
            .badge { display: inline-block; padding: 4px 8px; border-radius: 4px; font-size: 10px; font-weight: 600; text-transform: uppercase; }
            .badge-paid { background: #dcfce7; color: #166534; }
            .badge-unpaid { background: #fef3c7; color: #92400e; }
          </style>
        </head>
        <body>
          ${printContent.innerHTML}
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  const address = order.shipping_address;

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <FileText className="w-4 h-4 mr-2" /> View Invoice
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Invoice #{order.order_number}</span>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handlePrint}>
                <Printer className="w-4 h-4 mr-2" /> Print
              </Button>
              <Button size="sm" onClick={handlePrint}>
                <Download className="w-4 h-4 mr-2" /> Download
              </Button>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div ref={invoiceRef} className="p-6 bg-background">
          {/* Header */}
          <div className="flex justify-between mb-10">
            <div className="store-info">
              <h1 className="text-2xl font-bold">{storeName}</h1>
              {storeAddress && <p className="text-sm text-muted-foreground">{storeAddress}</p>}
              {storePhone && <p className="text-sm text-muted-foreground">{storePhone}</p>}
              {storeEmail && <p className="text-sm text-muted-foreground">{storeEmail}</p>}
            </div>
            <div className="invoice-meta text-right">
              <h2 className="text-3xl font-bold text-primary">INVOICE</h2>
              <p className="text-sm text-muted-foreground">#{order.order_number}</p>
              <p className="text-sm text-muted-foreground">{format(new Date(order.created_at), 'MMMM d, yyyy')}</p>
              <div className="mt-2">
                <span className={`badge inline-block px-2 py-1 rounded text-xs font-semibold ${order.payment_status === 'paid' ? 'badge-paid bg-green-100 text-green-800' : 'badge-unpaid bg-yellow-100 text-yellow-800'}`}>
                  {order.payment_status.toUpperCase()}
                </span>
              </div>
            </div>
          </div>

          {/* Bill To */}
          <div className="section mb-8">
            <p className="section-title text-xs font-semibold text-muted-foreground uppercase mb-2">Bill To</p>
            <div className="customer-info">
              <p className="font-medium">{order.customer_name}</p>
              <p className="text-sm">{order.customer_phone}</p>
              {order.customer_email && <p className="text-sm">{order.customer_email}</p>}
              <p className="text-sm mt-2">{address.line1}</p>
              {address.line2 && <p className="text-sm">{address.line2}</p>}
              <p className="text-sm">{address.city}, {address.state} - {address.pincode}</p>
            </div>
          </div>

          {/* Items Table */}
          <table className="w-full mb-6">
            <thead>
              <tr className="border-b">
                <th className="text-left py-3 text-xs font-semibold text-muted-foreground uppercase">Item</th>
                <th className="text-center py-3 text-xs font-semibold text-muted-foreground uppercase">Qty</th>
                <th className="text-right py-3 text-xs font-semibold text-muted-foreground uppercase">Unit Price</th>
                <th className="text-right py-3 text-xs font-semibold text-muted-foreground uppercase">Amount</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id} className="border-b">
                  <td className="py-3">{item.name}</td>
                  <td className="py-3 text-center">{item.qty}</td>
                  <td className="py-3 text-right">₹{item.unit_price.toFixed(2)}</td>
                  <td className="py-3 text-right">₹{item.line_total.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Totals */}
          <div className="totals ml-auto w-64">
            <div className="totals-row flex justify-between py-2">
              <span className="text-muted-foreground">Subtotal</span>
              <span>₹{order.subtotal.toFixed(2)}</span>
            </div>
            {order.discount_total > 0 && (
              <div className="totals-row flex justify-between py-2 discount text-green-600">
                <span>Discount {order.coupon_code && `(${order.coupon_code})`}</span>
                <span>-₹{order.discount_total.toFixed(2)}</span>
              </div>
            )}
            <div className="totals-row flex justify-between py-2">
              <span className="text-muted-foreground">Delivery</span>
              <span>₹{order.delivery_fee.toFixed(2)}</span>
            </div>
            <Separator className="my-2" />
            <div className="totals-row flex justify-between py-2 total font-bold text-lg">
              <span>Total</span>
              <span>₹{order.total.toFixed(2)}</span>
            </div>
          </div>

          {/* Payment Info */}
          <div className="mt-8 p-4 bg-muted/50 rounded-lg">
            <p className="text-sm">
              <span className="font-medium">Payment Method:</span> {order.payment_method.toUpperCase()}
            </p>
          </div>

          {/* Footer */}
          <div className="footer mt-12 text-center text-sm text-muted-foreground">
            <p>Thank you for your order!</p>
            <p className="mt-1">If you have any questions, please contact us.</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
