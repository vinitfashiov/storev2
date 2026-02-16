import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { supabaseStore } from '@/integrations/supabase/storeClient';
import { toast } from 'sonner';

interface CancelOrderDialogProps {
    orderId: string;
    orderNumber: string;
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess: () => void;
}

export default function CancelOrderDialog({
    orderId,
    orderNumber,
    isOpen,
    onOpenChange,
    onSuccess
}: CancelOrderDialogProps) {
    const [loading, setLoading] = useState(false);
    const [reason, setReason] = useState('');

    const handleCancel = async () => {
        if (!reason.trim()) {
            toast.error("Please provide a reason for cancellation");
            return;
        }

        setLoading(true);

        const { error } = await supabaseStore
            .from('orders')
            .update({
                status: 'cancelled',
                notes: `Cancelled by customer. Reason: ${reason}` // Appending to notes as 'cancel_reason' column might not exist. Or ideally use a separate column/table.
                // Actually, let's create a return_request with status 'cancelled' or just update order status.
                // Simple cancellation usually just updates the order status.
            })
            .eq('id', orderId);

        setLoading(false);

        if (error) {
            console.error('Error cancelling order:', error);
            toast.error('Failed to cancel order');
        } else {
            toast.success('Order cancelled successfully');
            onOpenChange(false);
            onSuccess();
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Cancel Order #{orderNumber}</DialogTitle>
                    <DialogDescription>
                        Are you sure you want to cancel this order? This action cannot be undone.
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="cancel-reason">Reason for Cancellation</Label>
                        <Textarea
                            id="cancel-reason"
                            placeholder="Why are you cancelling?"
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                        />
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Keep Order</Button>
                    <Button variant="destructive" onClick={handleCancel} disabled={loading}>
                        {loading ? 'Cancelling...' : 'Confirm Cancellation'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
