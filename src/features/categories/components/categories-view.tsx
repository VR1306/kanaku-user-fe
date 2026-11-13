"use client";

import { useEffect, useState } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { FadeSwitch } from "@/components/motion/presence";
import { EmptyState } from "@/components/ui/empty-state";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { TRANSACTION_TYPES, type TransactionType } from "@/constants/transactions";
import type { CategoryItem } from "../schemas";
import { CategoryCard } from "./category-card";
import { CategoryForm } from "./category-form";
import { useCategories } from "./categories-provider";

export function CategoriesView() {
  const { items, refresh } = useCategories();
  const [type, setType] = useState<TransactionType>("expense");
  const [editing, setEditing] = useState<CategoryItem | null>(null);

  // The list comes with the page, but this month's totals may have moved since.
  useEffect(() => {
    void refresh();
  }, [refresh]);

  const shown = items.filter((c) => c.type === type);
  // Switching tabs leaves edit mode: you can't change a category's type.
  const current = editing && editing.type === type ? editing : null;

  return (
    <>
      <PageHeader
        title="Categories"
        description="Managed by Kanaku — set your own monthly budget on any expense category"
        actions={
          <SegmentedControl
            aria-label="Category type"
            options={TRANSACTION_TYPES}
            value={type}
            onChange={setType}
          />
        }
      />

      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_374px]">
        <FadeSwitch id={type}>
          {shown.length === 0 ? (
            <EmptyState
              icon="categories"
              title={`No ${type} categories yet`}
              description="The Kanaku team adds categories here. Check back soon."
            />
          ) : (
            <ul className="grid grid-cols-[minmax(0,1fr)] gap-5 sm:grid-cols-[repeat(2,minmax(0,1fr))] 2xl:grid-cols-3">
              {shown.map((item, i) => (
                <li key={item.id} className="min-w-0">
                  <CategoryCard
                    item={item}
                    index={i}
                    currency="INR"
                    editing={current?.id === item.id}
                    onEdit={() => setEditing(item)}
                  />
                </li>
              ))}
            </ul>
          )}
        </FadeSwitch>

        <div className="xl:sticky xl:top-6">
          <CategoryForm
            key={current ? `${current.id}-${current.budget}` : `none-${type}`}
            editing={current}
            onCancel={() => setEditing(null)}
            onDone={() => {
              setEditing(null);
              void refresh();
            }}
          />
        </div>
      </div>
    </>
  );
}
