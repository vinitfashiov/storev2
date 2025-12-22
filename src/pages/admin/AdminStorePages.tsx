import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2, Loader2, FileText, Eye, ExternalLink } from 'lucide-react';

interface StorePage {
  id: string;
  title: string;
  slug: string;
  content_html: string;
  is_published: boolean;
  created_at: string;
  updated_at: string;
}

interface AdminStorePagesProps {
  tenantId: string;
  storeSlug: string;
  disabled?: boolean;
}

const emptyPage: Omit<StorePage, 'id' | 'created_at' | 'updated_at'> = {
  title: '',
  slug: '',
  content_html: '',
  is_published: true,
};

export default function AdminStorePages({ tenantId, storeSlug, disabled }: AdminStorePagesProps) {
  const [pages, setPages] = useState<StorePage[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingPage, setEditingPage] = useState<StorePage | null>(null);
  const [form, setForm] = useState<Omit<StorePage, 'id' | 'created_at' | 'updated_at'>>(emptyPage);

  useEffect(() => {
    fetchPages();
  }, [tenantId]);

  const fetchPages = async () => {
    const { data, error } = await supabase
      .from('store_pages')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('title', { ascending: true });

    if (error) {
      console.error('Error fetching pages:', error);
      toast.error('Failed to load pages');
    } else {
      setPages(data || []);
    }
    setLoading(false);
  };

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  };

  const handleTitleChange = (title: string) => {
    setForm(prev => ({
      ...prev,
      title,
      slug: editingPage ? prev.slug : generateSlug(title),
    }));
  };

  const handleSubmit = async () => {
    if (!form.title.trim()) {
      toast.error('Title is required');
      return;
    }
    if (!form.slug.trim()) {
      toast.error('Slug is required');
      return;
    }

    setSaving(true);
    if (editingPage) {
      const { error } = await supabase
        .from('store_pages')
        .update({
          title: form.title,
          slug: form.slug,
          content_html: form.content_html,
          is_published: form.is_published,
          updated_at: new Date().toISOString(),
        })
        .eq('id', editingPage.id);

      if (error) {
        if (error.code === '23505') {
          toast.error('A page with this slug already exists');
        } else {
          toast.error('Failed to update page');
        }
      } else {
        toast.success('Page updated');
        fetchPages();
        resetForm();
      }
    } else {
      const { error } = await supabase
        .from('store_pages')
        .insert({
          ...form,
          tenant_id: tenantId,
        });

      if (error) {
        if (error.code === '23505') {
          toast.error('A page with this slug already exists');
        } else {
          toast.error('Failed to create page');
        }
      } else {
        toast.success('Page created');
        fetchPages();
        resetForm();
      }
    }
    setSaving(false);
  };

  const handleEdit = (page: StorePage) => {
    setEditingPage(page);
    setForm({
      title: page.title,
      slug: page.slug,
      content_html: page.content_html,
      is_published: page.is_published,
    });
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase
      .from('store_pages')
      .delete()
      .eq('id', id);

    if (error) {
      toast.error('Failed to delete page');
    } else {
      toast.success('Page deleted');
      fetchPages();
    }
  };

  const resetForm = () => {
    setDialogOpen(false);
    setEditingPage(null);
    setForm(emptyPage);
  };

  const togglePublished = async (page: StorePage) => {
    const { error } = await supabase
      .from('store_pages')
      .update({ is_published: !page.is_published })
      .eq('id', page.id);

    if (error) {
      toast.error('Failed to update page');
    } else {
      fetchPages();
    }
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold">Store Pages</h1>
          <p className="text-muted-foreground">Create custom pages like About, Contact, Terms, etc.</p>
        </div>
        <Button onClick={() => setDialogOpen(true)} disabled={disabled}>
          <Plus className="w-4 h-4 mr-2" />
          Add Page
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          {pages.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No pages yet. Create your first page!</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Slug</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Updated</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pages.map((page) => (
                  <TableRow key={page.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-muted-foreground" />
                        <span className="font-medium">{page.title}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <code className="text-sm bg-muted px-2 py-1 rounded">/{page.slug}</code>
                    </TableCell>
                    <TableCell>
                      <Badge variant={page.is_published ? 'default' : 'secondary'}>
                        {page.is_published ? 'Published' : 'Draft'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {new Date(page.updated_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          asChild
                        >
                          <a 
                            href={`/store/${storeSlug}/page/${page.slug}`} 
                            target="_blank" 
                            rel="noopener noreferrer"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </a>
                        </Button>
                        <Switch
                          checked={page.is_published}
                          onCheckedChange={() => togglePublished(page)}
                          disabled={disabled}
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(page)}
                          disabled={disabled}
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(page.id)}
                          disabled={disabled}
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={(open) => !open && resetForm()}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingPage ? 'Edit Page' : 'Add Page'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  value={form.title}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  placeholder="About Us"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="slug">URL Slug *</Label>
                <Input
                  id="slug"
                  value={form.slug}
                  onChange={(e) => setForm(prev => ({ ...prev, slug: e.target.value }))}
                  placeholder="about-us"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="content">Content (HTML)</Label>
              <Textarea
                id="content"
                value={form.content_html}
                onChange={(e) => setForm(prev => ({ ...prev, content_html: e.target.value }))}
                placeholder="<h2>About Our Store</h2><p>We are a company dedicated to...</p>"
                rows={12}
                className="font-mono text-sm"
              />
              <p className="text-xs text-muted-foreground">
                You can use HTML tags for formatting. Basic tags: &lt;h2&gt;, &lt;p&gt;, &lt;ul&gt;, &lt;li&gt;, &lt;strong&gt;, &lt;em&gt;
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Switch
                id="is_published"
                checked={form.is_published}
                onCheckedChange={(checked) => setForm(prev => ({ ...prev, is_published: checked }))}
              />
              <Label htmlFor="is_published">Published</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={resetForm}>Cancel</Button>
            <Button onClick={handleSubmit} disabled={saving}>
              {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {editingPage ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
