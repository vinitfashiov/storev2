import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { supabaseStore } from '@/integrations/supabase/storeClient';
import { toast } from 'sonner';

interface ReturnRequestDialogProps {
    orderId: string;
    orderNumber: string;
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess: () => void;
    tenantId: string;
    customerId: string;
}

export default function ReturnRequestDialog({
    orderId,
    orderNumber,
    isOpen,
    onOpenChange,
    onSuccess,
    tenantId,
    customerId
}: ReturnRequestDialogProps) {
    const [loading, setLoading] = useState(false);
    const [reason, setReason] = useState('');
    const [refundMethod, setRefundMethod] = useState<'upi' | 'bank_transfer'>('upi');

    // Payment Details State
    const [upiId, setUpiId] = useState('');
    const [bankDetails, setBankDetails] = useState({
        account_no: '',
        ifsc: '',
        holder_name: ''
    });

    const handleSubmit = async () => {
        if (!reason.trim()) {
            toast.error("Please provide a reason for the return");
            return;
        }

        if (refundMethod === 'upi' && !upiId.trim()) {
            toast.error("Please enter your UPI ID");
            return;
        }

        if (refundMethod === 'bank_transfer') {
            if (!bankDetails.account_no || !bankDetails.ifsc || !bankDetails.holder_name) {
                toast.error("Please fill in all bank details");
                return;
            }
        }

        setLoading(true);

        const paymentDetails = refundMethod === 'upi'
            ? { upi_id: upiId }
            : { ...bankDetails };

        // @ts-ignore - return_requests table exists but types need to be regenerated after migration
        const { error } = await supabaseStore
            .from('return_requests')
            .insert({
                tenant_id: tenantId,
                order_id: orderId,
                customer_id: customerId,
                status: 'requested',
                reason: reason,
                refund_method: refundMethod,
                payment_details: paymentDetails
            });

        setLoading(false);

        if (error) {
            console.error('Error requesting return:', error);
            console.error('Error details:', JSON.stringify(error, null, 2));
            console.error('Attempted insert data:', {
                tenant_id: tenantId,
                order_id: orderId,
                customer_id: customerId,
                status: 'requested',
                reason: reason,
                refund_method: refundMethod,
                payment_details: paymentDetails
            });
            toast.error(`Failed to submit return request: ${error.message || 'Unknown error'}`);
        } else {
            toast.success('Return request submitted successfully');
            onOpenChange(false);
            onSuccess();
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Return Order #{orderNumber}</DialogTitle>
                    <DialogDescription>
                        Request a return for this order. Please provide details for your refund.
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="reason">Reason for Return</Label>
                        <Textarea
                            id="reason"
                            placeholder="e.g. Received damaged item, Wrong size..."
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                        />
                    </div>

                    <div className="space-y-3">
                        <Label>Refund Method</Label>
                        <RadioGroup
                            value={refundMethod}
                            onValueChange={(v) => setRefundMethod(v as 'upi' | 'bank_transfer')}
                            className="flex gap-4"
                        >
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="upi" id="upi" />
                                <Label htmlFor="upi">UPI ID</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="bank_transfer" id="bank" />
                                <Label htmlFor="bank">Bank Transfer</Label>
                            </div>
                        </RadioGroup>
                    </div>

                    {refundMethod === 'upi' ? (
                        <div className="space-y-2">
                            <Label htmlFor="upi_id">Your UPI ID</Label>
                            <Input
                                id="upi_id"
                                placeholder="username@upi"
                                value={upiId}
                                onChange={(e) => setUpiId(e.target.value)}
                            />
                        </div>
                    ) : (
                        <div className="space-y-3 bg-muted p-3 rounded-md">
                            <div className="space-y-1">
                                <Label className="text-xs">Account Number</Label>
                                <Input
                                    className="bg-background"
                                    value={bankDetails.account_no}
                                    onChange={(e) => setBankDetails({ ...bankDetails, account_no: e.target.value })}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                <div className="space-y-1">
                                    <Label className="text-xs">IFSC Code</Label>
                                    <Input
                                        className="bg-background"
                                        value={bankDetails.ifsc}
                                        onChange={(e) => setBankDetails({ ...bankDetails, ifsc: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-1">
                                    <Label className="text-xs">Holder Name</Label>
                                    <Input
                                        className="bg-background"
                                        value={bankDetails.holder_name}
                                        onChange={(e) => setBankDetails({ ...bankDetails, holder_name: e.target.value })}
                                    />
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                    <Button onClick={handleSubmit} disabled={loading}>
                        {loading ? 'Submitting...' : 'Submit Request'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
