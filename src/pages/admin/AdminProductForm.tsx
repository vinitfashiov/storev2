import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { ArrowLeft, Upload, X, Trash2, Plus, Loader2, Package } from 'lucide-react';

interface Category { id: string; name: string; }
interface Brand { id: string; name: string; }
interface Attribute { id: string; name: string; values: AttributeValue[]; }
interface AttributeValue { id: string; value: string; }
interface Variant {
  id: string;
  sku: string;
  price: number;
  compare_at_price: number | null;
  stock_qty: number;
  is_active: boolean;
  weight: number | null;
  attributes: { attribute_id: string; attribute_name: string; value_id: string; value: string }[];
}

interface AdminProductFormProps {
  tenantId: string;
  productId?: string;
  disabled?: boolean;
}

export default function AdminProductForm({ tenantId, productId, disabled }: AdminProductFormProps) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(!!productId);
  const [saving, setSaving] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [attributes, setAttributes] = useState<Attribute[]>([]);

  // Form state
  const [form, setForm] = useState({
    name: '', slug: '', description: '', price: '', compare_at_price: '',
    sku: '', stock_qty: '0', category_id: '', brand_id: '', is_active: true, has_variants: false,
    product_delivery_fee_enabled: false, product_delivery_fee: '', product_weight: ''
  });

  // Images state
  const [images, setImages] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);

  // Variants state
  const [variants, setVariants] = useState<Variant[]>([]);
  const [selectedAttributes, setSelectedAttributes] = useState<{ attributeId: string; valueIds: string[] }[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      const [catsRes, brandsRes, attrsRes] = await Promise.all([
        supabase.from('categories').select('id, name').eq('tenant_id', tenantId).eq('is_active', true),
        supabase.from('brands').select('id, name').eq('tenant_id', tenantId).eq('is_active', true),
        supabase.from('attributes').select('id, name').eq('tenant_id', tenantId)
      ]);

      // Fetch attribute values
      const attrsWithValues: Attribute[] = [];
      if (attrsRes.data) {
        for (const attr of attrsRes.data) {
          const { data: values } = await supabase.from('attribute_values').select('id, value').eq('attribute_id', attr.id);
          attrsWithValues.push({ ...attr, values: values || [] });
        }
      }

      setCategories(catsRes.data || []);
      setBrands(brandsRes.data || []);
      setAttributes(attrsWithValues);

      // Load existing product if editing
      if (productId) {
        const { data: product } = await supabase
          .from('products')
          .select('*')
          .eq('id', productId)
          .single();

        if (product) {
          setForm({
            name: product.name,
            slug: product.slug,
            description: product.description || '',
            price: product.price.toString(),
            compare_at_price: product.compare_at_price?.toString() || '',
            sku: product.sku || '',
            stock_qty: product.stock_qty.toString(),
            category_id: product.category_id || '',
            brand_id: product.brand_id || '',
            is_active: product.is_active,
            has_variants: product.has_variants,
            product_delivery_fee_enabled: product.product_delivery_fee_enabled || false,
            product_delivery_fee: product.product_delivery_fee?.toString() || '',
            product_weight: product.product_weight?.toString() || ''
          });
          const imgArray = Array.isArray(product.images) ? (product.images as string[]) : [];
          setImages(imgArray);

          // Load existing variants
          if (product.has_variants) {
            const { data: existingVariants } = await supabase
              .from('product_variants')
              .select('*')
              .eq('product_id', productId);

            if (existingVariants) {
              const variantsWithAttrs: Variant[] = [];
              for (const v of existingVariants) {
                const { data: variantAttrs } = await supabase
                  .from('variant_attributes')
                  .select('attribute_id, attribute_value_id')
                  .eq('variant_id', v.id);

                const attrs: Variant['attributes'] = [];
                if (variantAttrs) {
                  for (const va of variantAttrs) {
                    const attr = attrsWithValues.find(a => a.id === va.attribute_id);
                    const val = attr?.values.find(val => val.id === va.attribute_value_id);
                    if (attr && val) {
                      attrs.push({ attribute_id: va.attribute_id, attribute_name: attr.name, value_id: va.attribute_value_id, value: val.value });
                    }
                  }
                }

                variantsWithAttrs.push({
                  id: v.id,
                  sku: v.sku || '',
                  price: Number(v.price),
                  compare_at_price: v.compare_at_price ? Number(v.compare_at_price) : null,
                  stock_qty: v.stock_qty,
                  is_active: v.is_active,
                  weight: v.weight ? Number(v.weight) : null,
                  attributes: attrs
                });
              }
              setVariants(variantsWithAttrs);
            }
          }
        }
        setLoading(false);
      }
    };
    fetchData();
  }, [tenantId, productId]);

  const generateSlug = (name: string) => name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

  const handleNameChange = (name: string) => {
    setForm({ ...form, name, slug: productId ? form.slug : generateSlug(name) });
  };

  // Image upload handler
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    const newImages: string[] = [];

    for (const file of Array.from(files)) {
      const fileExt = file.name.split('.').pop();
      const fileName = `${tenantId}/products/${productId || 'new'}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

      const { error } = await supabase.storage.from('product-images').upload(fileName, file);
      if (error) {
        toast.error(`Failed to upload ${file.name}`);
        continue;
      }
      newImages.push(fileName);
    }

    setImages([...images, ...newImages]);
    setUploading(false);
    toast.success(`${newImages.length} image(s) uploaded`);
  };

  const removeImage = async (path: string) => {
    await supabase.storage.from('product-images').remove([path]);
    setImages(images.filter(img => img !== path));
  };

  const getImageUrl = (path: string) => {
    const { data } = supabase.storage.from('product-images').getPublicUrl(path);
    return data.publicUrl;
  };

  // Generate variants from selected attributes
  const generateVariants = () => {
    if (selectedAttributes.length === 0 || selectedAttributes.every(sa => sa.valueIds.length === 0)) {
      toast.error('Select at least one attribute value');
      return;
    }

    // Generate all combinations
    const combinations: { attribute_id: string; attribute_name: string; value_id: string; value: string }[][] = [];

    const generate = (index: number, current: { attribute_id: string; attribute_name: string; value_id: string; value: string }[]) => {
      if (index === selectedAttributes.length) {
        if (current.length > 0) combinations.push([...current]);
        return;
      }

      const { attributeId, valueIds } = selectedAttributes[index];
      const attr = attributes.find(a => a.id === attributeId);
      if (!attr || valueIds.length === 0) {
        generate(index + 1, current);
        return;
      }

      for (const valueId of valueIds) {
        const val = attr.values.find(v => v.id === valueId);
        if (val) {
          generate(index + 1, [...current, { attribute_id: attributeId, attribute_name: attr.name, value_id: valueId, value: val.value }]);
        }
      }
    };

    generate(0, []);

    const newVariants: Variant[] = combinations.map(attrs => ({
      id: `new-${Math.random().toString(36).substring(7)}`,
      sku: '',
      price: parseFloat(form.price) || 0,
      compare_at_price: form.compare_at_price ? parseFloat(form.compare_at_price) : null,
      stock_qty: 0,
      is_active: true,
      weight: null,
      attributes: attrs
    }));

    setVariants(prev => [...prev, ...newVariants]);
    toast.success(`Generated ${newVariants.length} variant(s)`);
  };

  // Add single variant manually
  const addManualVariant = () => {
    setVariants(prev => [...prev, {
      id: `new-${Math.random().toString(36).substring(7)}`,
      sku: '',
      price: parseFloat(form.price) || 0,
      compare_at_price: form.compare_at_price ? parseFloat(form.compare_at_price) : null,
      stock_qty: 0,
      is_active: true,
      weight: null,
      attributes: []
    }]);
  };

  const updateVariant = (index: number, field: keyof Variant, value: any) => {
    const updated = [...variants];
    (updated[index] as any)[field] = value;
    setVariants(updated);
  };

  const removeVariant = (index: number) => {
    setVariants(variants.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (disabled) return;

    setSaving(true);

    const productData = {
      tenant_id: tenantId,
      name: form.name,
      slug: form.slug,
      description: form.description || null,
      price: parseFloat(form.price) || 0,
      compare_at_price: form.compare_at_price ? parseFloat(form.compare_at_price) : null,
      sku: form.sku || null,
      stock_qty: form.has_variants ? 0 : (parseInt(form.stock_qty) || 0),
      category_id: form.category_id || null,
      brand_id: form.brand_id || null,
      is_active: form.is_active,
      has_variants: form.has_variants,
      product_delivery_fee_enabled: form.product_delivery_fee_enabled,
      product_delivery_fee: form.product_delivery_fee_enabled && form.product_delivery_fee ? parseFloat(form.product_delivery_fee) : null,
      product_weight: form.product_weight ? parseFloat(form.product_weight) : null,
      images: images
    };

    try {
      let finalProductId = productId;

      if (productId) {
        const { error } = await supabase.from('products').update(productData).eq('id', productId);
        if (error) throw error;

        // Delete existing variants and recreate
        if (form.has_variants) {
          await supabase.from('product_variants').delete().eq('product_id', productId);
        }
      } else {
        const { data: newProduct, error } = await supabase.from('products').insert(productData).select().single();
        if (error) throw error;
        finalProductId = newProduct.id;

        // Move images to correct folder
        if (images.length > 0 && newProduct) {
          const movedImages: string[] = [];
          for (const oldPath of images) {
            if (oldPath.includes('/new/')) {
              const newPath = oldPath.replace('/new/', `/${newProduct.id}/`);
              await supabase.storage.from('product-images').move(oldPath, newPath);
              movedImages.push(newPath);
            } else {
              movedImages.push(oldPath);
            }
          }
          await supabase.from('products').update({ images: movedImages }).eq('id', newProduct.id);
        }
      }

      // Insert variants
      if (form.has_variants && finalProductId) {
        for (const variant of variants) {
          const { data: newVariant, error: variantError } = await supabase.from('product_variants').insert({
            tenant_id: tenantId,
            product_id: finalProductId,
            sku: variant.sku || null,
            price: variant.price,
            compare_at_price: variant.compare_at_price,
            stock_qty: variant.stock_qty,
            is_active: variant.is_active,
            weight: variant.weight
          }).select().single();

          if (variantError) throw variantError;

          // Insert variant attributes
          for (const attr of variant.attributes) {
            await supabase.from('variant_attributes').insert({
              variant_id: newVariant.id,
              attribute_id: attr.attribute_id,
              attribute_value_id: attr.value_id
            });
          }
        }
      }

      toast.success(productId ? 'Product updated' : 'Product created');
      navigate(-1);
    } catch (error: any) {
      toast.error(error.message?.includes('duplicate') ? 'Slug already exists' : 'Failed to save product');
    } finally {
      setSaving(false);
    }
  };

  const addAttributeSelection = () => {
    setSelectedAttributes([...selectedAttributes, { attributeId: '', valueIds: [] }]);
  };

  const updateAttributeSelection = (index: number, field: 'attributeId' | 'valueIds', value: any) => {
    const updated = [...selectedAttributes];
    updated[index][field] = value;
    if (field === 'attributeId') updated[index].valueIds = [];
    setSelectedAttributes(updated);
  };

  const removeAttributeSelection = (index: number) => {
    setSelectedAttributes(selectedAttributes.filter((_, i) => i !== index));
  };

  const toggleValueSelection = (attrIndex: number, valueId: string) => {
    const updated = [...selectedAttributes];
    const current = updated[attrIndex].valueIds;
    if (current.includes(valueId)) {
      updated[attrIndex].valueIds = current.filter(id => id !== valueId);
    } else {
      updated[attrIndex].valueIds = [...current, valueId];
    }
    setSelectedAttributes(updated);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-display font-bold">{productId ? 'Edit Product' : 'Add Product'}</h1>
          <p className="text-muted-foreground">Fill in the product details</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Info */}
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Name *</Label>
                <Input value={form.name} onChange={e => handleNameChange(e.target.value)} required />
              </div>
              <div>
                <Label>Slug *</Label>
                <Input value={form.slug} onChange={e => setForm({ ...form, slug: e.target.value })} required />
              </div>
            </div>

            <div>
              <Label>Description</Label>
              <Textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={3} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <Label>Price (₹) *</Label>
                <Input type="number" step="0.01" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} required />
              </div>
              <div>
                <Label>Compare Price</Label>
                <Input type="number" step="0.01" value={form.compare_at_price} onChange={e => setForm({ ...form, compare_at_price: e.target.value })} placeholder="Original price" />
              </div>
              <div>
                <Label>SKU</Label>
                <Input value={form.sku} onChange={e => setForm({ ...form, sku: e.target.value })} />
              </div>
              {!form.has_variants && (
                <div>
                  <Label>Stock Quantity</Label>
                  <Input type="number" value={form.stock_qty} onChange={e => setForm({ ...form, stock_qty: e.target.value })} />
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Category</Label>
                <Select value={form.category_id || 'none'} onValueChange={v => setForm({ ...form, category_id: v === 'none' ? '' : v })}>
                  <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No Category</SelectItem>
                    {categories.map(cat => (
                      <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Brand</Label>
                <Select value={form.brand_id || 'none'} onValueChange={v => setForm({ ...form, brand_id: v === 'none' ? '' : v })}>
                  <SelectTrigger><SelectValue placeholder="Select brand" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No Brand</SelectItem>
                    {brands.map(brand => (
                      <SelectItem key={brand.id} value={brand.id}>{brand.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <Switch checked={form.is_active} onCheckedChange={v => setForm({ ...form, is_active: v })} />
                <Label>Active</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={form.has_variants} onCheckedChange={v => setForm({ ...form, has_variants: v })} />
                <Label>Has Variants</Label>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Shipping & Delivery */}
        <Card>
          <CardHeader>
            <CardTitle>Shipping & Delivery</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Override Global Delivery Fee</Label>
                <p className="text-sm text-muted-foreground">Charge a specific delivery fee for this product</p>
              </div>
              <Switch
                checked={form.product_delivery_fee_enabled}
                onCheckedChange={v => setForm({ ...form, product_delivery_fee_enabled: v })}
              />
            </div>

            {form.product_delivery_fee_enabled && (
              <div>
                <Label>Product Delivery Fee (₹)</Label>
                <Input
                  type="number"
                  step="0.01"
                  min={0}
                  value={form.product_delivery_fee}
                  onChange={e => setForm({ ...form, product_delivery_fee: e.target.value })}
                />
              </div>
            )}

            <div className="pt-4 border-t">
              <Label>Product Weight (kg)</Label>
              <Input
                type="number"
                step="0.01"
                min={0}
                placeholder="e.g. 1.5"
                value={form.product_weight}
                onChange={e => setForm({ ...form, product_weight: e.target.value })}
                className="mt-2"
              />
              <p className="text-xs text-muted-foreground mt-1">Required if you use weight-based delivery rates</p>
            </div>
          </CardContent>
        </Card>

        {/* Images */}
        <Card>
          <CardHeader>
            <CardTitle>Images</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              For best results on the storefront, upload images with a <b>1:1 (Square) aspect ratio</b>. We recommend a minimum size of <b>800x800 pixels</b>. Uploads with solid white backgrounds are supported and will blend seamlessly.
            </p>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {images.map((img, idx) => (
                <div key={idx} className="relative aspect-square bg-muted rounded-lg overflow-hidden group">
                  <img src={getImageUrl(img)} alt="" className="w-full h-full object-cover" />
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="absolute top-2 right-2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => removeImage(img)}
                  >
                    <X className="w-3 h-3" />
                  </Button>
                </div>
              ))}
              <label className="aspect-square bg-muted/50 border-2 border-dashed rounded-lg flex flex-col items-center justify-center cursor-pointer hover:bg-muted transition-colors">
                {uploading ? (
                  <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                ) : (
                  <>
                    <Upload className="w-6 h-6 text-muted-foreground mb-2" />
                    <span className="text-xs text-muted-foreground">Upload</span>
                  </>
                )}
                <input type="file" accept="image/*" multiple className="hidden" onChange={handleImageUpload} disabled={uploading} />
              </label>
            </div>
          </CardContent>
        </Card>

        {/* Variants */}
        {form.has_variants && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Variants ({variants.length})</span>
                <Button type="button" variant="outline" size="sm" onClick={addManualVariant}>
                  <Plus className="w-4 h-4 mr-1" /> Add Variant
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Attribute Generator */}
              {attributes.length > 0 && (
                <div className="p-4 bg-muted/50 rounded-lg space-y-4">
                  <Label className="font-medium">Generate Variants from Attributes</Label>
                  {selectedAttributes.map((sel, idx) => {
                    const attr = attributes.find(a => a.id === sel.attributeId);
                    return (
                      <div key={idx} className="flex flex-wrap items-start gap-4">
                        <Select value={sel.attributeId || 'none'} onValueChange={v => updateAttributeSelection(idx, 'attributeId', v === 'none' ? '' : v)}>
                          <SelectTrigger className="w-40"><SelectValue placeholder="Attribute" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">Select...</SelectItem>
                            {attributes.filter(a => !selectedAttributes.some((s, i) => i !== idx && s.attributeId === a.id)).map(a => (
                              <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {attr && (
                          <div className="flex flex-wrap gap-2">
                            {attr.values.map(val => (
                              <label key={val.id} className="flex items-center gap-1 cursor-pointer">
                                <Checkbox
                                  checked={sel.valueIds.includes(val.id)}
                                  onCheckedChange={() => toggleValueSelection(idx, val.id)}
                                />
                                <span className="text-sm">{val.value}</span>
                              </label>
                            ))}
                          </div>
                        )}
                        <Button type="button" variant="ghost" size="icon" onClick={() => removeAttributeSelection(idx)}>
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    );
                  })}
                  <div className="flex gap-2">
                    <Button type="button" variant="outline" size="sm" onClick={addAttributeSelection}>
                      <Plus className="w-4 h-4 mr-1" /> Add Attribute
                    </Button>
                    <Button type="button" size="sm" onClick={generateVariants}>
                      Generate Variants
                    </Button>
                  </div>
                </div>
              )}

              {/* Variants Table */}
              {variants.length > 0 && (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Attributes</TableHead>
                        <TableHead>SKU</TableHead>
                        <TableHead>Price (₹)</TableHead>
                        <TableHead>Compare Price</TableHead>
                        <TableHead>Weight (kg)</TableHead>
                        <TableHead>Stock</TableHead>
                        <TableHead>Active</TableHead>
                        <TableHead></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {variants.map((variant, idx) => (
                        <TableRow key={variant.id}>
                          <TableCell>
                            <div className="flex flex-wrap gap-1">
                              {variant.attributes.length > 0 ? (
                                variant.attributes.map((a, i) => (
                                  <Badge key={i} variant="secondary">{a.attribute_name}: {a.value}</Badge>
                                ))
                              ) : (
                                <span className="text-muted-foreground text-sm">Default variant</span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Input
                              value={variant.sku}
                              onChange={e => updateVariant(idx, 'sku', e.target.value)}
                              className="w-24"
                              placeholder="SKU"
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              step="0.01"
                              value={variant.price}
                              onChange={e => updateVariant(idx, 'price', parseFloat(e.target.value) || 0)}
                              className="w-24"
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              step="0.01"
                              value={variant.compare_at_price || ''}
                              onChange={e => updateVariant(idx, 'compare_at_price', e.target.value ? parseFloat(e.target.value) : null)}
                              className="w-24"
                              placeholder="Optional"
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              step="0.01"
                              value={variant.weight || ''}
                              onChange={e => updateVariant(idx, 'weight', e.target.value ? parseFloat(e.target.value) : null)}
                              className="w-20"
                              placeholder="Weight"
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              value={variant.stock_qty}
                              onChange={e => updateVariant(idx, 'stock_qty', parseInt(e.target.value) || 0)}
                              className="w-20"
                            />
                          </TableCell>
                          <TableCell>
                            <Switch
                              checked={variant.is_active}
                              onCheckedChange={v => updateVariant(idx, 'is_active', v)}
                            />
                          </TableCell>
                          <TableCell>
                            <Button type="button" variant="ghost" size="icon" onClick={() => removeVariant(idx)}>
                              <Trash2 className="w-4 h-4 text-destructive" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}

              {variants.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <Package className="w-12 h-12 mx-auto mb-2 opacity-30" />
                  <p>No variants yet. Use the generator above or add manually.</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Actions */}
        <div className="flex items-center justify-end gap-4">
          <Button type="button" variant="outline" onClick={() => navigate(-1)}>Cancel</Button>
          <Button type="submit" disabled={disabled || saving}>
            {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            {productId ? 'Update Product' : 'Create Product'}
          </Button>
        </div>
      </form>
    </div>
  );
}
