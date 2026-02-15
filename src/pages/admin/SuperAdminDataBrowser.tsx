import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Database, ChevronLeft, ChevronRight, Download, Search } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';

const PAGE_SIZE = 50;

export default function SuperAdminDataBrowser() {
    const [searchParams, setSearchParams] = useSearchParams();
    const [tables, setTables] = useState<string[]>([]);
    const [selectedTable, setSelectedTable] = useState<string>(searchParams.get('table') || '');
    const [tableData, setTableData] = useState<any[]>([]);
    const [columns, setColumns] = useState<string[]>([]);
    const [totalCount, setTotalCount] = useState(0);
    const [currentPage, setCurrentPage] = useState(1);
    const [loading, setLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    // Load available tables
    useEffect(() => {
        loadTables();
    }, []);

    // Load table data when selection changes
    useEffect(() => {
        if (selectedTable) {
            setCurrentPage(1);
            loadTableData(selectedTable, 1);
        }
    }, [selectedTable]);

    // Update URL when table changes
    useEffect(() => {
        if (selectedTable) {
            setSearchParams({ table: selectedTable });
        }
    }, [selectedTable, setSearchParams]);

    const loadTables = async () => {
        try {
            const { data, error } = await supabase.rpc('get_all_tables');

            if (error) throw error;

            if (data) {
                const tableNames = data.map((row: any) => row.table_name);
                setTables(tableNames);
            }
        } catch (error) {
            console.error('Error loading tables:', error);
            toast.error('Failed to load tables');
        }
    };

    const loadTableData = async (tableName: string, page: number) => {
        try {
            setLoading(true);

            const from = (page - 1) * PAGE_SIZE;
            const to = from + PAGE_SIZE - 1;

            // Get total count
            const { count } = await supabase
                .from(tableName)
                .select('*', { count: 'exact', head: true });

            // Get paginated data
            const { data, error } = await supabase
                .from(tableName)
                .select('*')
                .range(from, to)
                .order('created_at', { ascending: false, nullsFirst: false });

            if (error) throw error;

            if (data && data.length > 0) {
                setColumns(Object.keys(data[0]));
                setTableData(data);
                setTotalCount(count || 0);
            } else {
                setColumns([]);
                setTableData([]);
                setTotalCount(0);
            }
        } catch (error) {
            console.error('Error loading table data:', error);
            toast.error('Failed to load table data');
        } finally {
            setLoading(false);
        }
    };

    const handlePageChange = (newPage: number) => {
        setCurrentPage(newPage);
        if (selectedTable) {
            loadTableData(selectedTable, newPage);
        }
    };

    const exportToCSV = () => {
        if (tableData.length === 0) return;

        const headers = columns.join(',');
        const rows = tableData.map(row =>
            columns.map(col => {
                const value = row[col];
                if (value === null) return '';
                if (typeof value === 'object') return JSON.stringify(value);
                return String(value).replace(/,/g, ';');
            }).join(',')
        );

        const csv = [headers, ...rows].join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${selectedTable}_${new Date().toISOString()}.csv`;
        a.click();
        URL.revokeObjectURL(url);

        toast.success('Data exported to CSV');
    };

    const formatValue = (value: any): string => {
        if (value === null || value === undefined) return '-';
        if (typeof value === 'boolean') return value ? 'Yes' : 'No';
        if (typeof value === 'object') return JSON.stringify(value, null, 2);
        if (typeof value === 'string' && value.length > 100) return value.substring(0, 100) + '...';
        return String(value);
    };

    const totalPages = Math.ceil(totalCount / PAGE_SIZE);

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
                    <Database className="w-8 h-8" />
                    Data Browser
                </h1>
                <p className="text-muted-foreground mt-1">
                    Browse and export data from any table in the system
                </p>
            </div>

            {/* Controls */}
            <Card>
                <CardHeader>
                    <CardTitle>Table Selection</CardTitle>
                    <CardDescription>Select a table to view its data</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex gap-4">
                        <div className="flex-1">
                            <Select value={selectedTable} onValueChange={setSelectedTable}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select a table..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {tables.map((table) => (
                                        <SelectItem key={table} value={table}>
                                            {table}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {selectedTable && (
                            <Button onClick={exportToCSV} variant="outline">
                                <Download className="w-4 h-4 mr-2" />
                                Export CSV
                            </Button>
                        )}
                    </div>

                    {selectedTable && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <span className="font-medium">{totalCount.toLocaleString()}</span>
                            <span>total rows</span>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Data Table */}
            {selectedTable && (
                <Card>
                    <CardHeader>
                        <CardTitle>{selectedTable}</CardTitle>
                        <CardDescription>
                            Showing {((currentPage - 1) * PAGE_SIZE) + 1} - {Math.min(currentPage * PAGE_SIZE, totalCount)} of {totalCount} rows
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <div className="space-y-3">
                                {[...Array(5)].map((_, i) => (
                                    <Skeleton key={i} className="h-12 w-full" />
                                ))}
                            </div>
                        ) : tableData.length === 0 ? (
                            <div className="text-center py-12 text-muted-foreground">
                                No data found in this table
                            </div>
                        ) : (
                            <>
                                <div className="overflow-x-auto">
                                    <table className="w-full border-collapse">
                                        <thead>
                                            <tr className="border-b border-border">
                                                {columns.map((col) => (
                                                    <th
                                                        key={col}
                                                        className="text-left p-3 text-sm font-semibold text-foreground bg-muted/50"
                                                    >
                                                        {col}
                                                    </th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {tableData.map((row, rowIndex) => (
                                                <tr
                                                    key={rowIndex}
                                                    className="border-b border-border hover:bg-muted/30 transition-colors"
                                                >
                                                    {columns.map((col) => (
                                                        <td
                                                            key={col}
                                                            className="p-3 text-sm text-foreground max-w-xs"
                                                        >
                                                            {typeof row[col] === 'object' && row[col] !== null ? (
                                                                <details className="cursor-pointer">
                                                                    <summary className="text-blue-600 hover:underline">
                                                                        View JSON
                                                                    </summary>
                                                                    <pre className="mt-2 p-2 bg-muted rounded text-xs overflow-x-auto">
                                                                        {JSON.stringify(row[col], null, 2)}
                                                                    </pre>
                                                                </details>
                                                            ) : (
                                                                <span className="truncate block">
                                                                    {formatValue(row[col])}
                                                                </span>
                                                            )}
                                                        </td>
                                                    ))}
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>

                                {/* Pagination */}
                                {totalPages > 1 && (
                                    <div className="flex items-center justify-between mt-6 pt-4 border-t border-border">
                                        <div className="text-sm text-muted-foreground">
                                            Page {currentPage} of {totalPages}
                                        </div>
                                        <div className="flex gap-2">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => handlePageChange(currentPage - 1)}
                                                disabled={currentPage === 1}
                                            >
                                                <ChevronLeft className="w-4 h-4 mr-1" />
                                                Previous
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => handlePageChange(currentPage + 1)}
                                                disabled={currentPage === totalPages}
                                            >
                                                Next
                                                <ChevronRight className="w-4 h-4 ml-1" />
                                            </Button>
                                        </div>
                                    </div>
                                )}
                            </>
                        )}
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
