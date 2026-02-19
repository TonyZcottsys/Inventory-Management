"use client";

import { useState, useEffect } from "react";
import { useToast } from "@/context/ToastContext";

export type InventoryItemForm = {
  name: string;
  description: string;
  quantity: string;
  category: string;
  price: string;
  supplier: string;
  reorderLevel: string;
  status: string;
};

const defaultForm: InventoryItemForm = {
  name: "",
  description: "",
  quantity: "0",
  category: "",
  price: "",
  supplier: "",
  reorderLevel: "0",
  status: "IN_STOCK",
};

interface InventoryFormProps {
  initial?: Partial<InventoryItemForm> | null;
  onSuccess: () => void;
  onCancel: () => void;
  generateDescription?: (name: string, category?: string) => Promise<string>;
  canEditStatus?: boolean;
}

export function InventoryForm({
  initial,
  onSuccess,
  onCancel,
  generateDescription,
  canEditStatus = true,
}: InventoryFormProps) {
  const [form, setForm] = useState<InventoryItemForm>(() => ({
    ...defaultForm,
    ...(initial || {}),
  }));
  const [loading, setLoading] = useState(false);
  const [genLoading, setGenLoading] = useState(false);
  const { addToast } = useToast();

  useEffect(() => {
    if (initial) setForm((f) => ({ ...defaultForm, ...f, ...initial }));
  }, [initial]);

  async function handleGenerateDesc() {
    if (!form.name.trim() || !generateDescription) return;
    setGenLoading(true);
    try {
      const desc = await generateDescription(form.name, form.category || undefined);
      setForm((f) => ({ ...f, description: desc }));
      addToast("Description generated", "success");
    } catch {
      addToast("Failed to generate description", "error");
    } finally {
      setGenLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const name = form.name.trim();
    if (!name) {
      addToast("Name is required", "error");
      return;
    }
    const quantity = parseInt(form.quantity, 10);
    if (isNaN(quantity) || quantity < 0) {
      addToast("Quantity must be a non-negative number", "error");
      return;
    }
    const reorderLevel = parseInt(form.reorderLevel, 10) || 0;
    const price = form.price ? parseFloat(form.price) : undefined;
    if (price !== undefined && (isNaN(price) || price < 0)) {
      addToast("Price must be non-negative", "error");
      return;
    }
    setLoading(true);
    try {
      const url = initial ? `/api/inventory/${(initial as { id?: string }).id}` : "/api/inventory";
      const method = initial ? "PUT" : "POST";
      const body: Record<string, unknown> = {
        name,
        description: form.description || undefined,
        quantity,
        category: form.category || undefined,
        price,
        supplier: form.supplier || undefined,
        reorderLevel,
      };
      if (canEditStatus && form.status) body.status = form.status;
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        credentials: "include",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        addToast(data.error || "Request failed", "error");
        setLoading(false);
        return;
      }
      addToast(initial ? "Item updated" : "Item created", "success");
      onSuccess();
    } catch {
      addToast("Request failed", "error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-foreground">Name *</label>
        <input
          type="text"
          value={form.name}
          onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          className="input mt-1"
          required
        />
      </div>
      <div>
        <div className="flex items-center justify-between">
          <label className="block text-sm font-medium text-foreground">Description</label>
          {generateDescription && (
            <button
              type="button"
              onClick={handleGenerateDesc}
              disabled={genLoading || !form.name.trim()}
              className="text-xs text-primary hover:underline"
            >
              {genLoading ? "Generating…" : "AI Generate"}
            </button>
          )}
        </div>
        <textarea
          value={form.description}
          onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
          className="input mt-1 min-h-[80px]"
          rows={3}
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-foreground">Quantity *</label>
          <input
            type="number"
            min={0}
            value={form.quantity}
            onChange={(e) => setForm((f) => ({ ...f, quantity: e.target.value }))}
            className="input mt-1"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-foreground">Reorder level</label>
          <input
            type="number"
            min={0}
            value={form.reorderLevel}
            onChange={(e) => setForm((f) => ({ ...f, reorderLevel: e.target.value }))}
            className="input mt-1"
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-foreground">Category</label>
          <input
            type="text"
            value={form.category}
            onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
            className="input mt-1"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-foreground">Price</label>
          <input
            type="number"
            min={0}
            step={0.01}
            value={form.price}
            onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
            className="input mt-1"
          />
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-foreground">Supplier</label>
        <input
          type="text"
          value={form.supplier}
          onChange={(e) => setForm((f) => ({ ...f, supplier: e.target.value }))}
          className="input mt-1"
        />
      </div>
      {canEditStatus && (
        <div>
          <label className="block text-sm font-medium text-foreground">Status</label>
          <select
            value={form.status}
            onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
            className="input mt-1"
          >
            <option value="IN_STOCK">In Stock</option>
            <option value="LOW_STOCK">Low Stock</option>
            <option value="ORDERED">Ordered</option>
            <option value="DISCONTINUED">Discontinued</option>
          </select>
        </div>
      )}
      <div className="flex justify-end gap-2 pt-2">
        <button type="button" onClick={onCancel} className="btn-secondary">
          Cancel
        </button>
        <button type="submit" disabled={loading} className="btn-primary">
          {loading ? "Saving…" : initial ? "Update" : "Create"}
        </button>
      </div>
    </form>
  );
}
