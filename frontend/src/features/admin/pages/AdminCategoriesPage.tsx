import React, { useState } from 'react';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { CategoryService, Category } from '@/services/api/category-service';
import { useToast } from '@/hooks/useToast';
import { Card } from '@/components/common/Card';
import { Badge } from '@/components/common/Badge';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { Modal } from '@/components/common/Modal';
import { Skeleton } from '@/components/common/Skeleton';
import { EmptyState } from '@/components/common/EmptyState';
import {
  Layers,
  Plus,
  Search,
  CheckCircle2,
  XCircle,
  Edit2,
  Trash2,
  Tag,
  ArrowUpRight,
  ShieldCheck,
  FolderTree
} from 'lucide-react';

export const AdminCategoriesPage: React.FC = () => {
  useDocumentTitle('Category Taxonomy Governance — Super Admin');
  const toast = useToast();
  const queryClient = useQueryClient();

  const [search, setSearch] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [parentId, setParentId] = useState<string>('');
  const [displayOrder, setDisplayOrder] = useState<number>(0);

  // 1. Fetch Categories
  const { data: categories = [], isLoading } = useQuery({
    queryKey: ['admin-categories'],
    queryFn: () => CategoryService.getAdminCategories(),
  });

  // Mutations
  const createMutation = useMutation({
    mutationFn: () =>
      CategoryService.createCategory({
        name: name.trim(),
        description: description.trim() || undefined,
        parentId: parentId || null,
        displayOrder,
      }),
    onSuccess: (cat) => {
      toast.success('Category Created', `"${cat.name}" has been added to taxonomy.`);
      queryClient.invalidateQueries({ queryKey: ['admin-categories'] });
      resetForm();
      setIsAddModalOpen(false);
    },
    onError: (err: any) => {
      toast.error('Creation Failed', err.response?.data?.message || err.message);
    },
  });

  const updateMutation = useMutation({
    mutationFn: () =>
      CategoryService.updateCategory(editingCategory!.id, {
        name: name.trim(),
        description: description.trim() || undefined,
        parentId: parentId || null,
        displayOrder,
      }),
    onSuccess: (cat) => {
      toast.success('Category Updated', `"${cat.name}" updated successfully.`);
      queryClient.invalidateQueries({ queryKey: ['admin-categories'] });
      resetForm();
      setEditingCategory(null);
    },
    onError: (err: any) => {
      toast.error('Update Failed', err.response?.data?.message || err.message);
    },
  });

  const toggleActiveMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      isActive ? CategoryService.activateCategory(id) : CategoryService.deactivateCategory(id),
    onSuccess: (_, vars) => {
      toast.success('Status Updated', `Category ${vars.isActive ? 'activated' : 'deactivated'}.`);
      queryClient.invalidateQueries({ queryKey: ['admin-categories'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => CategoryService.deleteCategory(id),
    onSuccess: () => {
      toast.success('Category Processed', 'Category removed or safely deactivated.');
      queryClient.invalidateQueries({ queryKey: ['admin-categories'] });
    },
  });

  const resetForm = () => {
    setName('');
    setDescription('');
    setParentId('');
    setDisplayOrder(0);
  };

  const handleOpenEdit = (cat: Category) => {
    setEditingCategory(cat);
    setName(cat.name);
    setDescription(cat.description || '');
    setParentId(cat.parentId || '');
    setDisplayOrder(cat.displayOrder);
  };

  const filteredCategories = categories.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.slug.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-8 pb-16">
      {/* Executive Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-indigo-500/15 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-md text-[11px] font-extrabold uppercase bg-indigo-500/15 text-indigo-300 border border-indigo-500/30">
              CLASSIFICATION DOMAIN
            </span>
            <span className="text-xs text-slate-400 font-medium">Editorial Taxonomy Hierarchy</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white mt-2 tracking-tight">
            Category Taxonomy Governance
          </h1>
        </div>

        <Button
          variant="primary"
          leftIcon={<Plus className="w-4 h-4" />}
          onClick={() => {
            resetForm();
            setIsAddModalOpen(true);
          }}
        >
          Add New Category
        </Button>
      </div>

      {/* Stats Summary Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="glass-card-admin rounded-2xl p-5 space-y-2">
          <span className="text-xs text-slate-400 font-semibold uppercase">Total Categories</span>
          <p className="text-3xl font-black text-white font-mono">{categories.length}</p>
        </div>
        <div className="glass-card-admin rounded-2xl p-5 space-y-2 border-l-4 border-l-emerald-500">
          <span className="text-xs text-slate-400 font-semibold uppercase">Active Taxonomy Sections</span>
          <p className="text-3xl font-black text-emerald-400 font-mono">
            {categories.filter((c) => c.isActive).length}
          </p>
        </div>
        <div className="glass-card-admin rounded-2xl p-5 space-y-2 border-l-4 border-l-indigo-500">
          <span className="text-xs text-slate-400 font-semibold uppercase">Top-Level Parent Categories</span>
          <p className="text-3xl font-black text-indigo-300 font-mono">
            {categories.filter((c) => !c.parentId).length}
          </p>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="glass-card-admin rounded-2xl p-6 space-y-5">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-indigo-500/15 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center">
              <FolderTree className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-white text-base">Taxonomy Category Registry</h3>
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Search category name or slug..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-white outline-none focus:border-indigo-500/50"
            />
          </div>
        </div>

        {isLoading ? (
          <div className="space-y-3 p-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : filteredCategories.length === 0 ? (
          <EmptyState
            icon={Layers}
            title="No Categories Found"
            description="No taxonomy categories match your search parameters."
          />
        ) : (
          <div className="overflow-x-auto rounded-xl border border-indigo-500/15 bg-[#090d19]/60">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-indigo-950/40 text-indigo-200 uppercase font-semibold border-b border-indigo-500/15">
                <tr>
                  <th className="p-4">Order</th>
                  <th className="p-4">Name & Slug</th>
                  <th className="p-4">Hierarchy Role</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-indigo-500/10 font-medium">
                {filteredCategories.map((cat) => {
                  const parentCat = categories.find((p) => p.id === cat.parentId);
                  return (
                    <tr key={cat.id} className="hover:bg-indigo-950/30 transition-colors">
                      <td className="p-4 font-mono font-extrabold text-indigo-400">#{cat.displayOrder}</td>
                      <td className="p-4">
                        <div className="font-bold text-white text-sm">{cat.name}</div>
                        <div className="text-[11px] text-slate-400 font-mono">/category/{cat.slug}</div>
                      </td>
                      <td className="p-4">
                        {parentCat ? (
                          <span className="px-2.5 py-0.5 rounded text-[11px] bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 font-bold">
                            Subcategory of {parentCat.name}
                          </span>
                        ) : (
                          <Badge variant="indigo">Top-Level Root</Badge>
                        )}
                      </td>
                      <td className="p-4">
                        {cat.isActive ? (
                          <Badge variant="emerald">ACTIVE</Badge>
                        ) : (
                          <Badge variant="rose">INACTIVE</Badge>
                        )}
                      </td>
                      <td className="p-4 text-right space-x-2 whitespace-nowrap">
                        <button
                          onClick={() =>
                            toggleActiveMutation.mutate({ id: cat.id, isActive: !cat.isActive })
                          }
                          className="px-2.5 py-1 rounded-lg text-xs font-bold bg-slate-900 border border-slate-800 text-slate-300 hover:text-white transition-all"
                        >
                          {cat.isActive ? 'Deactivate' : 'Activate'}
                        </button>
                        <button
                          onClick={() => handleOpenEdit(cat)}
                          className="p-1.5 rounded-lg bg-indigo-950/60 text-indigo-300 border border-indigo-500/20 hover:border-indigo-400/50 transition-all"
                          title="Edit Category"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => deleteMutation.mutate(cat.id)}
                          className="p-1.5 rounded-lg bg-rose-950/60 text-rose-300 border border-rose-500/20 hover:border-rose-400/50 transition-all"
                          title="Delete Category"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      <Modal
        isOpen={isAddModalOpen || !!editingCategory}
        onClose={() => {
          setIsAddModalOpen(false);
          setEditingCategory(null);
        }}
        title={editingCategory ? 'Edit Category Taxonomy' : 'Create New Category Taxonomy'}
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (editingCategory) updateMutation.mutate();
            else createMutation.mutate();
          }}
          className="space-y-4"
        >
          <Input
            label="Category Name"
            placeholder="e.g., Local News, Politics, Sports..."
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">
              Parent Category (Optional Subcategory Mapping)
            </label>
            <select
              value={parentId}
              onChange={(e) => setParentId(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-xs text-white outline-none"
            >
              <option value="">None (Top-Level Root Category)</option>
              {categories
                .filter((c) => c.id !== editingCategory?.id && !c.parentId)
                .map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">Description (Optional)</label>
            <textarea
              rows={3}
              placeholder="Overview of news covered in this section..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-slate-900/90 border border-slate-800 focus:border-indigo-500/50 rounded-xl p-3 text-xs text-white outline-none resize-none"
            />
          </div>

          <div className="w-32">
            <Input
              label="Display Order"
              type="number"
              value={displayOrder.toString()}
              onChange={(e) => setDisplayOrder(Number(e.target.value) || 0)}
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              variant="outline"
              type="button"
              onClick={() => {
                setIsAddModalOpen(false);
                setEditingCategory(null);
              }}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              type="submit"
              isLoading={createMutation.isPending || updateMutation.isPending}
            >
              {editingCategory ? 'Update Category' : 'Create Category'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
