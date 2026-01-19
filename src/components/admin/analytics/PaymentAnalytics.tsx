import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { CheckCircle, XCircle, Clock, AlertTriangle } from 'lucide-react';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend } from 'recharts';

interface PaymentStats {
  total_transactions: number;
  successful_payments: number;
  failed_payments: number;
  pending_payments: number;
  success_rate: number;
  total_amount: number;
  avg_transaction_value: number;
}

interface PaymentAnalyticsProps {
  stats: PaymentStats | null;
  loading?: boolean;
}

const COLORS = {
  success: '#22c55e',
  failed: '#ef4444',
  pending: '#f59e0b',
};

export function PaymentAnalytics({ stats, loading = false }: PaymentAnalyticsProps) {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-40" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-20 w-full" />
        </CardContent>
      </Card>
    );
  }

  const totalTransactions = stats?.total_transactions || 0;
  const successfulPayments = stats?.successful_payments || 0;
  const failedPayments = stats?.failed_payments || 0;
  const pendingPayments = stats?.pending_payments || 0;
  const successRate = stats?.success_rate || 0;
  const totalAmount = stats?.total_amount || 0;
  const avgTransactionValue = stats?.avg_transaction_value || 0;

  const pieData = [
    { name: 'Successful', value: successfulPayments, color: COLORS.success },
    { name: 'Failed', value: failedPayments, color: COLORS.failed },
    { name: 'Pending', value: pendingPayments, color: COLORS.pending },
  ].filter(d => d.value > 0);

  const getSuccessRateColor = (rate: number) => {
    if (rate >= 95) return 'text-green-600 bg-green-100 dark:bg-green-950/30';
    if (rate >= 85) return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-950/30';
    return 'text-red-600 bg-red-100 dark:bg-red-950/30';
  };

  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Payment Analytics</CardTitle>
          <Badge className={getSuccessRateColor(successRate)}>
            {successRate.toFixed(1)}% Success Rate
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Summary Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="text-center p-3 bg-muted/50 rounded-lg">
            <p className="text-2xl font-bold">{totalTransactions}</p>
            <p className="text-xs text-muted-foreground">Total Transactions</p>
          </div>
          <div className="text-center p-3 bg-green-50 dark:bg-green-950/30 rounded-lg">
            <div className="flex items-center justify-center gap-1">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <p className="text-2xl font-bold text-green-600">{successfulPayments}</p>
            </div>
            <p className="text-xs text-muted-foreground">Successful</p>
          </div>
          <div className="text-center p-3 bg-red-50 dark:bg-red-950/30 rounded-lg">
            <div className="flex items-center justify-center gap-1">
              <XCircle className="h-4 w-4 text-red-600" />
              <p className="text-2xl font-bold text-red-600">{failedPayments}</p>
            </div>
            <p className="text-xs text-muted-foreground">Failed</p>
          </div>
          <div className="text-center p-3 bg-yellow-50 dark:bg-yellow-950/30 rounded-lg">
            <div className="flex items-center justify-center gap-1">
              <Clock className="h-4 w-4 text-yellow-600" />
              <p className="text-2xl font-bold text-yellow-600">{pendingPayments}</p>
            </div>
            <p className="text-xs text-muted-foreground">Pending</p>
          </div>
        </div>

        {/* Pie Chart */}
        {pieData.length > 0 && (
          <div className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={70}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Financial Summary */}
        <div className="grid grid-cols-2 gap-4 pt-4 border-t">
          <div>
            <p className="text-sm text-muted-foreground">Total Collected</p>
            <p className="text-xl font-bold">₹{totalAmount.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Avg Transaction</p>
            <p className="text-xl font-bold">₹{avgTransactionValue.toLocaleString()}</p>
          </div>
        </div>

        {/* Failure Alert */}
        {failedPayments > 0 && failedPayments > successfulPayments * 0.1 && (
          <div className="flex items-start gap-3 p-3 bg-red-50 dark:bg-red-950/30 rounded-lg">
            <AlertTriangle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-red-800 dark:text-red-200">
                High failure rate detected
              </p>
              <p className="text-xs text-red-600 dark:text-red-300">
                {((failedPayments / totalTransactions) * 100).toFixed(1)}% of transactions are failing. 
                Check your payment gateway configuration.
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
