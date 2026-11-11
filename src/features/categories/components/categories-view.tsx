"use client";

import { useEffect, useState } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { FadeSwitch } from "@/components/motion/presence";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { TRANSACTION_TYPES, type TransactionType } from "@/constants/transactions";
import { deleteCategory } from "../api";
import type { CategoryItem } from "../schemas";
import { CategoryCard } from "./category-card";
import { CategoryForm } from "./category-form";
import { useCategories } from "./categories-provider";

export function CategoriesView() {
  const { items, refresh } = useCategories();
  const [type, setType] = useState<TransactionType>("expense");
  const [editing, setEditing] = useState<CategoryItem | null>(null);
  const [deleting, setDeleting] = useState<CategoryItem | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string>();

  // The list comes with the page, but this month's totals may have moved since.
  useEffect(() => {
    void refresh();
  }, [refresh]);

  const shown = items.filter((c) => c.type === type);
  // Switching tabs leaves edit mode: you can't change a category's type.
  const current = editing && editing.type === type ? editing : null;

  async function remove() {
    if (!deleting) return;
    setPending(true);
    setError(undefined);
    try {
      await deleteCategory(deleting.id);
      if (editing?.id === deleting.id) setEditing(null);
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't delete that category.");
    } finally {
      setPending(false);
      setDeleting(null);
    }
  }

  return (
    <>
      <PageHeader
        title="Categories"
        description="Organise how your money is grouped"
        actions={
          <SegmentedControl
            aria-label="Category type"
            options={TRANSACTION_TYPES}
            value={type}
            onChange={setType}
          />
        }
      />

      {error ? (
        <p
          role="alert"
          className="mb-6 rounded-control bg-danger-tint px-4 py-3 text-sm text-danger"
        >
          {error}
        </p>
      ) : null}

      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_374px]">
        <FadeSwitch id={type}>
          {shown.length === 0 ? (
            <EmptyState
              icon="categories"
              title={`No ${type} categories yet`}
              description="Create one with the form and it will show up when you add transactions."
            />
          ) : (
            <ul className="grid gap-5 sm:grid-cols-2 2xl:grid-cols-3">
              {shown.map((item, i) => (
                <li key={item.id} className="min-w-0">
                  <CategoryCard
                    item={item}
                    index={i}
                    currency="INR"
                    editing={current?.id === item.id}
                    onEdit={() => setEditing(item)}
                    onDelete={() => setDeleting(item)}
                  />
                </li>
              ))}
            </ul>
          )}
        </FadeSwitch>

        <div className="xl:sticky xl:top-6">
          <CategoryForm
            key={
              current
                ? `${current.id}-${current.tone}-${current.name}-${current.budget}`
                : `new-${type}`
            }
            editing={current}
            defaultType={type}
            onCancel={() => setEditing(null)}
            onDone={() => {
              setEditing(null);
              void refresh();
            }}
          />
        </div>
      </div>

      <ConfirmDialog
        open={deleting !== null}
        tone="danger"
        icon="trash"
        title={`Delete ${deleting?.name ?? "this category"}?`}
        description={`Its transactions and recurring payments move to “${deleting?.type === "income" ? "Other income" : "Other"}”, and its budget is removed.`}
        confirmLabel="Delete"
        cancelLabel="Keep it"
        pending={pending}
        onConfirm={remove}
        onCancel={() => setDeleting(null)}
      />
    </>
  );
}
