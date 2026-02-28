import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { Loader2, Plus, Trash2 } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface WeightSlab {
    minWeight: number;
    maxWeight: number;
    fee: number;
}

interface D2CDeliverySettings {
    fixed_delivery_fee_enabled: boolean;
    fixed_delivery_fee: number;
    free_delivery_enabled: boolean;
    free_delivery_threshold: number | null;
    minimum_order_enabled: boolean;
    minimum_order_value: number;
    max_delivery_fee_enabled: boolean;
    max_delivery_fee: number;
    weight_based_delivery_enabled: boolean;
    weight_calculation_type: 'slab' | 'per_kg';
    per_kg_rate: number;
    weight_slabs: WeightSlab[];
}

interface Props {
    tenantId: string;
    disabled?: boolean;
}

export default function AdminD2CDeliverySettings({ tenantId, disabled }: Props) {
    const [settings, setSettings] = useState<D2CDeliverySettings>({
        fixed_delivery_fee_enabled: true,
        fixed_delivery_fee: 0,
        free_delivery_enabled: true,
        free_delivery_threshold: null,
        minimum_order_enabled: false,
        minimum_order_value: 0,
        max_delivery_fee_enabled: false,
        max_delivery_fee: 0,
        weight_based_delivery_enabled: false,
        weight_calculation_type: 'slab',
        per_kg_rate: 0,
        weight_slabs: []
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        const fetchSettings = async () => {
            const { data, error } = await supabase
                .from('tenant_delivery_settings_d2c')
                .select('*')
                .eq('tenant_id', tenantId)
                .maybeSingle();

            if (data) {
                setSettings({
                    fixed_delivery_fee_enabled: data.fixed_delivery_fee_enabled ?? true,
                    fixed_delivery_fee: Number(data.fixed_delivery_fee || 0),
                    free_delivery_enabled: data.free_delivery_enabled ?? true,
                    free_delivery_threshold: data.free_delivery_threshold ? Number(data.free_delivery_threshold) : null,
                    minimum_order_enabled: data.minimum_order_enabled ?? false,
                    minimum_order_value: Number(data.minimum_order_value || 0),
                    max_delivery_fee_enabled: data.max_delivery_fee_enabled ?? false,
                    max_delivery_fee: Number(data.max_delivery_fee || 0),
                    weight_based_delivery_enabled: data.weight_based_delivery_enabled ?? false,
                    weight_calculation_type: (data.weight_calculation_type as 'slab' | 'per_kg') || 'slab',
                    per_kg_rate: Number(data.per_kg_rate || 0),
                    weight_slabs: data.weight_slabs ? (data.weight_slabs as WeightSlab[]) : []
                });
            }
            setLoading(false);
        };
        fetchSettings();
    }, [tenantId]);

    const handleSave = async () => {
        setSaving(true);
        const payload = {
            tenant_id: tenantId,
            ...settings
        };

        const { error } = await supabase
            .from('tenant_delivery_settings_d2c')
            .upsert(payload, { onConflict: 'tenant_id' });

        setSaving(false);
        if (error) {
            toast.error(error.message);
        } else {
            toast.success('D2C Delivery Settings saved');
        }
    };

    const handleAddSlab = () => {
        setSettings({
            ...settings,
            weight_slabs: [
                ...settings.weight_slabs,
                { minWeight: 0, maxWeight: 0, fee: 0 }
            ]
        });
    };

    const handleUpdateSlab = (index: number, field: keyof WeightSlab, value: number) => {
        const newSlabs = [...settings.weight_slabs];
        newSlabs[index][field] = value;
        setSettings({ ...settings, weight_slabs: newSlabs });
    };

    const handleRemoveSlab = (index: number) => {
        const newSlabs = [...settings.weight_slabs];
        newSlabs.splice(index, 1);
        setSettings({ ...settings, weight_slabs: newSlabs });
    };

    if (loading) {
        return <div className="flex items-center justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>;
    }

    return (
        <div className="space-y-6 max-w-4xl pb-16">
            <div>
                <h1 className="text-2xl font-display font-bold">Delivery Settings</h1>
                <p className="text-muted-foreground">Configure global delivery rules for your D2C store</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle>Fixed Delivery Fee</CardTitle>
                                <CardDescription>Standard flat rate shipping</CardDescription>
                            </div>
                            <Switch
                                checked={settings.fixed_delivery_fee_enabled}
                                onCheckedChange={c => setSettings({ ...settings, fixed_delivery_fee_enabled: c })}
                                disabled={disabled}
                            />
                        </div>
                    </CardHeader>
                    {settings.fixed_delivery_fee_enabled && (
                        <CardContent>
                            <Label>Base Fee (₹)</Label>
                            <Input
                                type="number"
                                min={0}
                                value={settings.fixed_delivery_fee}
                                onChange={e => setSettings({ ...settings, fixed_delivery_fee: parseFloat(e.target.value) || 0 })}
                                disabled={disabled}
                            />
                        </CardContent>
                    )}
                </Card>

                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle>Free Delivery</CardTitle>
                                <CardDescription>Override fees on high-value orders</CardDescription>
                            </div>
                            <Switch
                                checked={settings.free_delivery_enabled}
                                onCheckedChange={c => setSettings({ ...settings, free_delivery_enabled: c })}
                                disabled={disabled}
                            />
                        </div>
                    </CardHeader>
                    {settings.free_delivery_enabled && (
                        <CardContent>
                            <Label>Minimum Cart Value (₹)</Label>
                            <Input
                                type="number"
                                min={0}
                                value={settings.free_delivery_threshold || ''}
                                onChange={e => setSettings({ ...settings, free_delivery_threshold: e.target.value ? parseFloat(e.target.value) : null })}
                                placeholder="E.g. 500"
                                disabled={disabled}
                            />
                        </CardContent>
                    )}
                </Card>

                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle>Minimum Order Constraint</CardTitle>
                                <CardDescription>Require a minimum spend to checkout</CardDescription>
                            </div>
                            <Switch
                                checked={settings.minimum_order_enabled}
                                onCheckedChange={c => setSettings({ ...settings, minimum_order_enabled: c })}
                                disabled={disabled}
                            />
                        </div>
                    </CardHeader>
                    {settings.minimum_order_enabled && (
                        <CardContent>
                            <Label>Minimum Amount (₹)</Label>
                            <Input
                                type="number"
                                min={0}
                                value={settings.minimum_order_value}
                                onChange={e => setSettings({ ...settings, minimum_order_value: parseFloat(e.target.value) || 0 })}
                                disabled={disabled}
                            />
                        </CardContent>
                    )}
                </Card>

                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle>Max Fee Cap</CardTitle>
                                <CardDescription>Highest possible delivery fee</CardDescription>
                            </div>
                            <Switch
                                checked={settings.max_delivery_fee_enabled}
                                onCheckedChange={c => setSettings({ ...settings, max_delivery_fee_enabled: c })}
                                disabled={disabled}
                            />
                        </div>
                    </CardHeader>
                    {settings.max_delivery_fee_enabled && (
                        <CardContent>
                            <Label>Maximum Fee (₹)</Label>
                            <Input
                                type="number"
                                min={0}
                                value={settings.max_delivery_fee}
                                onChange={e => setSettings({ ...settings, max_delivery_fee: parseFloat(e.target.value) || 0 })}
                                disabled={disabled}
                            />
                        </CardContent>
                    )}
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle>Weight-Based Delivery</CardTitle>
                            <CardDescription>Calculate shipping based on product weight</CardDescription>
                        </div>
                        <Switch
                            checked={settings.weight_based_delivery_enabled}
                            onCheckedChange={c => setSettings({ ...settings, weight_based_delivery_enabled: c })}
                            disabled={disabled}
                        />
                    </div>
                </CardHeader>
                {settings.weight_based_delivery_enabled && (
                    <CardContent className="space-y-6">
                        <div>
                            <Label>Calculation Mode</Label>
                            <Select
                                disabled={disabled}
                                value={settings.weight_calculation_type}
                                onValueChange={(v: 'slab' | 'per_kg') => setSettings({ ...settings, weight_calculation_type: v })}
                            >
                                <SelectTrigger className="w-[300px]">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="slab">Slab-Based (e.g. 0-5kg = ₹100)</SelectItem>
                                    <SelectItem value="per_kg">Rate Per KG</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {settings.weight_calculation_type === 'per_kg' ? (
                            <div>
                                <Label>Rate (₹ per KG)</Label>
                                <Input
                                    type="number"
                                    min={0}
                                    value={settings.per_kg_rate}
                                    onChange={e => setSettings({ ...settings, per_kg_rate: parseFloat(e.target.value) || 0 })}
                                    disabled={disabled}
                                    className="max-w-[300px]"
                                />
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <Label>Weight Slabs (KG)</Label>
                                {settings.weight_slabs.map((slab, index) => (
                                    <div key={index} className="flex items-center gap-4">
                                        <div className="flex-1">
                                            <Label className="text-xs">Min (KG)</Label>
                                            <Input
                                                type="number"
                                                min={0}
                                                value={slab.minWeight}
                                                onChange={e => handleUpdateSlab(index, 'minWeight', parseFloat(e.target.value) || 0)}
                                                disabled={disabled}
                                            />
                                        </div>
                                        <div className="flex-1">
                                            <Label className="text-xs">Max (KG)</Label>
                                            <Input
                                                type="number"
                                                min={0}
                                                value={slab.maxWeight}
                                                onChange={e => handleUpdateSlab(index, 'maxWeight', parseFloat(e.target.value) || 0)}
                                                disabled={disabled}
                                            />
                                        </div>
                                        <div className="flex-1">
                                            <Label className="text-xs">Fee (₹)</Label>
                                            <Input
                                                type="number"
                                                min={0}
                                                value={slab.fee}
                                                onChange={e => handleUpdateSlab(index, 'fee', parseFloat(e.target.value) || 0)}
                                                disabled={disabled}
                                            />
                                        </div>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => handleRemoveSlab(index)}
                                            disabled={disabled}
                                            className="mt-6 text-red-500 hover:text-red-700 hover:bg-red-50"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    </div>
                                ))}
                                <Button
                                    variant="outline"
                                    onClick={handleAddSlab}
                                    disabled={disabled}
                                    className="w-full border-dashed"
                                >
                                    <Plus className="w-4 h-4 mr-2" /> Add Slab
                                </Button>
                            </div>
                        )}
                    </CardContent>
                )}
            </Card>

            <Button onClick={handleSave} disabled={disabled || saving} className="w-full h-12">
                {saving ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving...</> : 'Save Delivery Settings'}
            </Button>
        </div>
    );
}
