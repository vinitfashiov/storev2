import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2, Layers, X } from 'lucide-react';

interface AttributeValue {
  id: string;
  value: string;
}

interface Attribute {
  id: string;
  name: string;
  created_at: string;
  attribute_values?: AttributeValue[];
}

interface AdminAttributesProps {
  tenantId: string;
  disabled?: boolean;
}

export default function AdminAttributes({ tenantId, disabled }: AdminAttributesProps) {
  const [attributes, setAttributes] = useState<Attribute[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingAttribute, setEditingAttribute] = useState<Attribute | null>(null);
  const [name, setName] = useState('');
  const [values, setValues] = useState<string[]>([]);
  const [newValue, setNewValue] = useState('');

  const fetchAttributes = async () => {
    const { data } = await supabase
      .from('attributes')
      .select('*, attribute_values(*)')
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false });
    setAttributes(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchAttributes(); }, [tenantId]);

  const resetForm = () => {
    setEditingAttribute(null);
    setName('');
    setValues([]);
    setNewValue('');
  };

  const handleEdit = (attr: Attribute) => {
    setEditingAttribute(attr);
    setName(attr.name);
    setValues(attr.attribute_values?.map(v => v.value) || []);
    setDialogOpen(true);
  };

  const addValue = () => {
    if (newValue.trim() && !values.includes(newValue.trim())) {
      setValues([...values, newValue.trim()]);
      setNewValue('');
    }
  };

  const removeValue = (val: string) => {
    setValues(values.filter(v => v !== val));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (disabled || !name.trim()) return;

    try {
      if (editingAttribute) {
        // Update attribute name
        const { error } = await supabase.from('attributes').update({ name: name.trim() }).eq('id', editingAttribute.id);
        if (error) throw error;

        // Get existing values
        const existingValues = editingAttribute.attribute_values?.map(v => v.value) || [];
        const valuesToAdd = values.filter(v => !existingValues.includes(v));
        const valuesToRemove = existingValues.filter(v => !values.includes(v));

        // Add new values
        if (valuesToAdd.length > 0) {
          const { error: insertError } = await supabase.from('attribute_values').insert(
            valuesToAdd.map(v => ({ tenant_id: tenantId, attribute_id: editingAttribute.id, value: v }))
          );
          if (insertError) throw insertError;
        }

        // Remove deleted values
        if (valuesToRemove.length > 0) {
          const idsToRemove = editingAttribute.attribute_values
            ?.filter(v => valuesToRemove.includes(v.value))
            .map(v => v.id) || [];
          if (idsToRemove.length > 0) {
            const { error: deleteError } = await supabase.from('attribute_values').delete().in('id', idsToRemove);
            if (deleteError) throw deleteError;
          }
        }

        toast.success('Attribute updated');
      } else {
        // Create new attribute
        const { data: attr, error } = await supabase
          .from('attributes')
          .insert({ tenant_id: tenantId, name: name.trim() })
          .select()
          .single();
        if (error) throw error;

        // Add values
        if (values.length > 0) {
          const { error: valuesError } = await supabase.from('attribute_values').insert(
            values.map(v => ({ tenant_id: tenantId, attribute_id: attr.id, value: v }))
          );
          if (valuesError) throw valuesError;
        }

        toast.success('Attribute created');
      }

      setDialogOpen(false);
      resetForm();
      fetchAttributes();
    } catch (error: any) {
      toast.error(error.message || 'Failed to save attribute');
    }
  };

  const handleDelete = async (id: string) => {
    if (disabled) return;
    const { error } = await supabase.from('attributes').delete().eq('id', id);
    if (error) { toast.error('Failed to delete attribute'); return; }
    toast.success('Attribute deleted');
    fetchAttributes();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold">Attributes</h1>
          <p className="text-muted-foreground">Manage product attributes like Size, Color</p>
        </div>
        <Button onClick={() => { resetForm(); setDialogOpen(true); }} disabled={disabled}>
          <Plus className="w-4 h-4 mr-2" /> Add Attribute
        </Button>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingAttribute ? 'Edit Attribute' : 'Add Attribute'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label>Name *</Label>
              <Input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Size, Color" required />
            </div>
            <div>
              <Label>Values</Label>
              <div className="flex gap-2 mb-2">
                <Input 
                  value={newValue} 
                  onChange={e => setNewValue(e.target.value)} 
                  placeholder="Add a value"
                  onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addValue())}
                />
                <Button type="button" onClick={addValue} size="sm">Add</Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {values.map(val => (
                  <Badge key={val} variant="secondary" className="gap-1">
                    {val}
                    <X className="w-3 h-3 cursor-pointer" onClick={() => removeValue(val)} />
                  </Badge>
                ))}
              </div>
            </div>
            <Button type="submit" className="w-full" disabled={disabled}>
              {editingAttribute ? 'Update' : 'Create'} Attribute
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-8 text-center text-muted-foreground">Loading...</div>
          ) : attributes.length === 0 ? (
            <div className="p-12 text-center">
              <Layers className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
              <h3 className="font-medium mb-2">No attributes yet</h3>
              <p className="text-sm text-muted-foreground mb-4">Create attributes like Size or Color for variants</p>
              <Button onClick={() => { resetForm(); setDialogOpen(true); }} disabled={disabled}>
                <Plus className="w-4 h-4 mr-2" /> Add Attribute
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Values</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {attributes.map(attr => (
                  <TableRow key={attr.id}>
                    <TableCell className="font-medium">{attr.name}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {attr.attribute_values?.slice(0, 5).map(v => (
                          <Badge key={v.id} variant="outline">{v.value}</Badge>
                        ))}
                        {(attr.attribute_values?.length || 0) > 5 && (
                          <Badge variant="secondary">+{(attr.attribute_values?.length || 0) - 5}</Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(attr)} disabled={disabled}>
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(attr.id)} disabled={disabled}>
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
