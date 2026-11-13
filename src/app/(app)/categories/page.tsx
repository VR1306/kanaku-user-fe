import type { Metadata } from "next";
import { ModuleGate } from "@/components/layout/module-gate";
import { CategoriesView } from "@/features/categories/components/categories-view";

export const metadata: Metadata = { title: "Categories" };

export default function CategoriesPage() {
  return (
    <>
      <ModuleGate module="categories" />
      <CategoriesView />
    </>
  );
}
