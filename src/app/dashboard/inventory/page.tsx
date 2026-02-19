"use client";

import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Plus, Search, Pencil, Trash2, Download } from "lucide-react";
import { StatusBadge } from "@/components/StatusBadge";
import { InventoryForm } from "@/components/InventoryForm";
import { ConfirmModal } from "@/components/ConfirmModal";

type Item = {
  id: string;
  name: string;
  description: string | null;
  quantity: number;
  category: string | null;
  price: number | null;
  supplier: string | null;
  reorderLevel: number;
  status: string;
  createdAt: string;
  updatedAt: string;
};

export default function InventoryPage() {
  const searchParams = useSearchParams();
  const { canFullCrud, canDeleteItem, canUpdateQuantity } = useAuth();
  const [items, setItems] = useState<Item[]>([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 0 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(searchParams.get("search") ?? "");
  const [category, setCategory] = useState(searchParams.get("category") ?? "");
  const [status, setStatus] = useState(searchParams.get("status") ?? "");
  const [minQty, setMinQty] = useState(searchParams.get("minQty") ?? "");
  const [maxQty, setMaxQty] = useState(searchParams.get("maxQty") ?? "");
  const [sortBy, setSortBy] = useState(searchParams.get("sortBy") ?? "createdAt");
  const [sortOrder, setSortOrder] = useState(searchParams.get("sortOrder") ?? "desc");
  const [page, setPage] = useState(parseInt(searchParams.get("page") ?? "1", 10));
  const [modal, setModal] = useState<"add" | "edit" | null>(null);
  const [editingItem, setEditingItem] = useState<Item | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Item | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [categories, setCategories] = useState<string[]>([]);

  const fetchCategories = useCallback(async () => {
    const res = await fetch("/api/inventory/categories", { credentials: "include" });
    const data = await res.json().catch(() => ({}));
    if (res.ok && data.categories) setCategories(data.categories);
  }, []);

  const fetchItems = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (category) params.set("category", category);
    if (status) params.set("status", status);
    if (minQty) params.set("minQty", minQty);
    if (maxQty) params.set("maxQty", maxQty);
    params.set("sortBy", sortBy);
    params.set("sortOrder", sortOrder);
    params.set("page", String(page));
    params.set("limit", "10");
    const res = await fetch(`/api/inventory?${params}`, { credentials: "include" });
    const data = await res.json().catch(() => ({}));
    if (res.ok && data.items) {
      setItems(data.items);
      setPagination(data.pagination || { page: 1, limit: 10, total: 0, totalPages: 0 });
    }
    setLoading(false);
  }, [search, category, status, minQty, maxQty, sortBy, sortOrder, page]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);
  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    const res = await fetch(`/api/inventory/${deleteTarget.id}`, {
      method: "DELETE",
      credentials: "include",
    });
    setDeleteLoading(false);
    if (res.ok) {
      setDeleteTarget(null);
      fetchItems();
    }
  }

  async function generateDescription(name: string, cat?: string) {
    const res = await fetch("/api/ai/generate-description", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, category: cat }),
      credentials: "include",
    });
    const data = await res.json();
    if (res.ok && data.description) return data.description;
    throw new Error("Failed to generate");
  }

  return (
    <div>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold text-foreground">Inventory</h1>
        <div className="flex flex-wrap gap-2">
          <a
            href="/api/export/csv"
            className="btn-secondary inline-flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            Export CSV
          </a>
          {(canFullCrud || canUpdateQuantity) && (
            <button
              type="button"
              onClick={() => setModal("add")}
              className="btn-primary inline-flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Add Item
            </button>
          )}
        </div>
      </div>

      <div className="card mt-6 overflow-hidden">
        <div className="border-b border-border p-4">
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search by name..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="input pl-9"
              />
            </div>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="input w-auto"
            >
              <option value="">All categories</option>
              {categories.map((c: string) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="input w-auto"
            >
              <option value="">All statuses</option>
              <option value="IN_STOCK">In Stock</option>
              <option value="LOW_STOCK">Low Stock</option>
              <option value="ORDERED">Ordered</option>
              <option value="DISCONTINUED">Discontinued</option>
            </select>
            <input
              type="number"
              placeholder="Min qty"
              value={minQty}
              onChange={(e) => setMinQty(e.target.value)}
              className="input w-24"
              min={0}
            />
            <input
              type="number"
              placeholder="Max qty"
              value={maxQty}
              onChange={(e) => setMaxQty(e.target.value)}
              className="input w-24"
              min={0}
            />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="input w-auto"
            >
              <option value="name">Name</option>
              <option value="quantity">Quantity</option>
              <option value="price">Price</option>
              <option value="createdAt">Date</option>
            </select>
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
              className="input w-auto"
            >
              <option value="asc">Asc</option>
              <option value="desc">Desc</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        ) : items.length === 0 ? (
          <p className="py-12 text-center text-muted-foreground">No items found.</p>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/50">
                    <th className="p-3 font-medium">Name</th>
                    <th className="p-3 font-medium">Category</th>
                    <th className="p-3 font-medium">Quantity</th>
                    <th className="p-3 font-medium">Price</th>
                    <th className="p-3 font-medium">Status</th>
                    <th className="p-3 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => (
                    <tr key={item.id} className="border-b border-border hover:bg-muted/30">
                      <td className="p-3 font-medium">{item.name}</td>
                      <td className="p-3 text-muted-foreground">{item.category ?? "—"}</td>
                      <td className="p-3">{item.quantity}</td>
                      <td className="p-3">{item.price != null ? `$${Number(item.price).toFixed(2)}` : "—"}</td>
                      <td className="p-3">
                        <StatusBadge status={item.status as "IN_STOCK" | "LOW_STOCK" | "ORDERED" | "DISCONTINUED"} />
                      </td>
                      <td className="p-3 text-right">
                        {(canFullCrud || canUpdateQuantity) && (
                          <button
                            type="button"
                            onClick={() => {
                              setEditingItem(item);
                              setModal("edit");
                            }}
                            className="rounded p-2 hover:bg-accent"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                        )}
                        {canDeleteItem && (
                          <button
                            type="button"
                            onClick={() => setDeleteTarget(item)}
                            className="rounded p-2 text-destructive hover:bg-destructive/10"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex items-center justify-between border-t border-border px-4 py-2">
              <span className="text-sm text-muted-foreground">
                Page {pagination.page} of {pagination.totalPages || 1} ({pagination.total} total)
              </span>
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={pagination.page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="btn-ghost rounded px-3 py-1 text-sm disabled:opacity-50"
                >
                  Previous
                </button>
                <button
                  type="button"
                  disabled={pagination.page >= pagination.totalPages}
                  onClick={() => setPage((p) => p + 1)}
                  className="btn-ghost rounded px-3 py-1 text-sm disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {modal === "add" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setModal(null)} aria-hidden />
          <div className="card relative z-10 max-h-[90vh] w-full max-w-lg overflow-y-auto p-6">
            <h2 className="text-lg font-semibold">Add Item</h2>
            <InventoryForm
              onSuccess={() => { setModal(null); fetchItems(); }}
              onCancel={() => setModal(null)}
              generateDescription={generateDescription}
              canEditStatus={canFullCrud}
            />
          </div>
        </div>
      )}

      {modal === "edit" && editingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => { setModal(null); setEditingItem(null); }} aria-hidden />
          <div className="card relative z-10 max-h-[90vh] w-full max-w-lg overflow-y-auto p-6">
            <h2 className="text-lg font-semibold">Edit Item</h2>
            <InventoryForm
              initial={{
                id: editingItem.id,
                name: editingItem.name,
                description: editingItem.description ?? "",
                quantity: String(editingItem.quantity),
                category: editingItem.category ?? "",
                price: editingItem.price != null ? String(editingItem.price) : "",
                supplier: editingItem.supplier ?? "",
                reorderLevel: String(editingItem.reorderLevel),
                status: editingItem.status,
              }}
              onSuccess={() => { setModal(null); setEditingItem(null); fetchItems(); }}
              onCancel={() => { setModal(null); setEditingItem(null); }}
              generateDescription={generateDescription}
              canEditStatus={canFullCrud}
            />
          </div>
        </div>
      )}

      <ConfirmModal
        open={!!deleteTarget}
        title="Delete item"
        message={deleteTarget ? `Delete "${deleteTarget.name}"? This cannot be undone.` : ""}
        confirmLabel="Delete"
        danger
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        loading={deleteLoading}
      />
    </div>
  );
}
