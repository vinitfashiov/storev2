import { useEffect, useState } from 'react';
import { supabaseStore } from '@/integrations/supabase/storeClient';
import { useStoreAuth } from '@/contexts/StoreAuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Undo2, CheckCircle, XCircle, Banknote, FileText } from 'lucide-react';

interface ReturnRequest {
    id: string;
    order_id: string;
    customer_id: string;
    status: 'requested' | 'approved' | 'rejected' | 'refunded' | 'cancelled';
    reason: string;
    refund_method: 'upi' | 'bank_transfer';
    payment_details: any;
    admin_notes: string;
    created_at: string;
    orders: {
        order_number: string;
        total: number;
        status: string;
    };
    customers: {
        name: string;
        email: string;
    };
}

const formatDate = (dateStr: string | null | undefined) => {
    if (!dateStr) return '-';
    try {
        return format(new Date(dateStr), 'MMM d, yyyy');
    } catch (e) {
        return '-';
    }
};

export default function AdminReturns() {
    const [requests, setRequests] = useState<ReturnRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [filterStatus, setFilterStatus] = useState<string>('all');
    const [selectedRequest, setSelectedRequest] = useState<ReturnRequest | null>(null);
    const [isDetailOpen, setIsDetailOpen] = useState(false);
    const [adminNote, setAdminNote] = useState('');
    const [actionLoading, setActionLoading] = useState(false);

    // To handle updates
    const [updateDialogOpen, setUpdateDialogOpen] = useState(false);
    const [updateAction, setUpdateAction] = useState<'approve' | 'reject' | 'refund' | null>(null);

    useEffect(() => {
        fetchRequests();
    }, [filterStatus]);

    const fetchRequests = async () => {
        setLoading(true);
        console.log("Starting fetchRequests...");

        try {
            const { data: { user } } = await supabaseStore.auth.getUser();
            console.log("Current Auth User:", user?.id, user?.email);

            let query = supabaseStore
                .from('return_requests')
                .select(`
                    *,
                    orders (order_number, total, status),
                    customers (name, email)
                `)
                .order('created_at', { ascending: false });

            if (filterStatus !== 'all') {
                query = query.eq('status', filterStatus);
            }

            console.log("Executing query...");
            const { data, error } = await query;

            if (error) {
                console.error('Error fetching return requests:', error);
                console.error('Error details:', JSON.stringify(error, null, 2));
                toast.error(`Failed to fetch return requests: ${error.message || error.details || 'Unknown error'}`);
                setRequests([]);
            } else {
                console.log("Successfully fetched return requests:", data?.length);
                if (data && data.length > 0) {
                    console.log("First item sample:", data[0]);
                }
                setRequests(data as any || []);
            }
        } catch (err: any) {
            console.error('Exception fetching requests:', err);
            toast.error(`Unexpected error: ${err.message || 'Check console'}`);
            setRequests([]);
        } finally {
            setLoading(false);
        }
    };

    const handleOpenDetail = (req: ReturnRequest) => {
        setSelectedRequest(req);
        setAdminNote(req.admin_notes || '');
        setIsDetailOpen(true);
    };

    const handleUpdateStatus = async (status: string) => {
        if (!selectedRequest) return;
        setActionLoading(true);

        const { error } = await supabaseStore
            .from('return_requests')
            .update({
                status: status,
                admin_notes: adminNote
            })
            .eq('id', selectedRequest.id);

        if (error) {
            toast.error(`Failed to update status to ${status}`);
        } else {
            toast.success(`Request marked as ${status}`);
            setIsDetailOpen(false);
            fetchRequests();
        }
        setActionLoading(false);
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'requested': return 'bg-yellow-100 text-yellow-800';
            case 'approved': return 'bg-blue-100 text-blue-800';
            case 'refunded': return 'bg-green-100 text-green-800';
            case 'rejected': return 'bg-red-100 text-red-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    if (loading) {
        return <div className="p-8 text-center text-muted-foreground">Loading specific returns...</div>;
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center flex-wrap gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Returns & Refunds</h1>
                    <p className="text-muted-foreground">Manage return requests and process refunds.</p>
                </div>
                <div className="flex items-center gap-2">
                    <Select value={filterStatus} onValueChange={setFilterStatus}>
                        <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Filter by Status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Status</SelectItem>
                            <SelectItem value="requested">Requested</SelectItem>
                            <SelectItem value="approved">Approved</SelectItem>
                            <SelectItem value="refunded">Refunded</SelectItem>
                            <SelectItem value="rejected">Rejected</SelectItem>
                        </SelectContent>
                    </Select>
                    <Button variant="outline" onClick={fetchRequests}>Refresh</Button>
                </div>
            </div>

            <Card>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Order</TableHead>
                                    <TableHead>Customer</TableHead>
                                    <TableHead>Date</TableHead>
                                    <TableHead>Reason</TableHead>
                                    <TableHead>Refund Method</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">Action</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {requests.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                                            No return requests found.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    requests.map((req) => (
                                        <TableRow key={req.id}>
                                            <TableCell className="font-medium">
                                                {req.orders?.order_number || 'N/A'}
                                                <div className="text-xs text-muted-foreground">₹{req.orders?.total || 0}</div>
                                            </TableCell>
                                            <TableCell>
                                                {req.customers?.name || 'Guest'}
                                                <div className="text-xs text-muted-foreground">{req.customers?.email || '-'}</div>
                                            </TableCell>
                                            <TableCell>{formatDate(req.created_at)}</TableCell>
                                            <TableCell className="max-w-[200px] truncate" title={req.reason}>
                                                {req.reason}
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="outline" className="capitalize">
                                                    {(req.refund_method || '-').replace('_', ' ')}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <Badge className={getStatusColor(req.status || 'requested')}>
                                                    {(req.status || 'requested').toUpperCase()}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Button size="sm" variant="ghost" onClick={() => handleOpenDetail(req)}>
                                                    View Details
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>

            {/* Detail Dialog */}
            <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
                <DialogContent className="max-w-2xl overflow-y-auto max-h-[90vh]">
                    <DialogHeader>
                        <DialogTitle>Return Request Details</DialogTitle>
                        <DialogDescription>
                            Order #{selectedRequest?.orders?.order_number || 'N/A'} • {selectedRequest?.orders?.status || 'Unknown'}
                        </DialogDescription>
                    </DialogHeader>

                    {selectedRequest && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">
                            <div className="space-y-4">
                                <div className="bg-muted p-3 rounded-md">
                                    <h4 className="font-semibold text-sm mb-1">Reason for Return</h4>
                                    <p className="text-sm">{selectedRequest.reason}</p>
                                </div>

                                <div>
                                    <h4 className="font-semibold text-sm mb-2">Refund Method</h4>
                                    <Badge variant="secondary" className="mb-2">
                                        {selectedRequest.refund_method === 'upi' ? 'UPI Transfer' : 'Bank Transfer'}
                                    </Badge>

                                    <div className="bg-slate-50 border p-3 rounded text-sm space-y-1">
                                        {selectedRequest.refund_method === 'upi' ? (
                                            <div className="flex justify-between">
                                                <span className="text-muted-foreground">UPI ID:</span>
                                                <span className="font-mono font-medium">{selectedRequest.payment_details?.upi_id || '-'}</span>
                                            </div>
                                        ) : (
                                            <>
                                                <div className="flex justify-between">
                                                    <span className="text-muted-foreground">Account No:</span>
                                                    <span className="font-mono">{selectedRequest.payment_details?.account_no || '-'}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-muted-foreground">IFSC:</span>
                                                    <span className="font-mono">{selectedRequest.payment_details?.ifsc || '-'}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-muted-foreground">Holder:</span>
                                                    <span className="font-medium">{selectedRequest.payment_details?.holder_name || '-'}</span>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <Label>Admin Notes</Label>
                                    <Textarea
                                        value={adminNote}
                                        onChange={(e) => setAdminNote(e.target.value)}
                                        placeholder="Internal notes about this return..."
                                        className="mt-1 h-24"
                                    />
                                </div>

                                <div className="pt-4 space-y-2">
                                    {(selectedRequest.status === 'requested') && (
                                        <div className="grid grid-cols-2 gap-2">
                                            <Button
                                                variant="outline"
                                                className="w-full border-red-200 text-red-600 hover:bg-red-50"
                                                onClick={() => handleUpdateStatus('rejected')}
                                                disabled={actionLoading}
                                            >
                                                <XCircle className="w-4 h-4 mr-2" />
                                                Reject
                                            </Button>
                                            <Button
                                                className="w-full bg-blue-600 hover:bg-blue-700"
                                                onClick={() => handleUpdateStatus('approved')}
                                                disabled={actionLoading}
                                            >
                                                <CheckCircle className="w-4 h-4 mr-2" />
                                                Approve
                                            </Button>
                                        </div>
                                    )}

                                    {selectedRequest.status === 'approved' && (
                                        <Button
                                            className="w-full bg-green-600 hover:bg-green-700"
                                            onClick={() => handleUpdateStatus('refunded')}
                                            disabled={actionLoading}
                                        >
                                            <Banknote className="w-4 h-4 mr-2" />
                                            Mark as Refunded
                                        </Button>
                                    )}

                                    {selectedRequest.status === 'refunded' && (
                                        <div className="text-center p-2 bg-green-50 text-green-700 rounded text-sm font-medium">
                                            Refund Processed
                                        </div>
                                    )}

                                    {selectedRequest.status === 'rejected' && (
                                        <div className="text-center p-2 bg-red-50 text-red-700 rounded text-sm font-medium">
                                            Return Rejected
                                        </div>
                                    )}

                                    <Button variant="ghost" className="w-full" onClick={() => setIsDetailOpen(false)}>
                                        Close
                                    </Button>
                                </div>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}
