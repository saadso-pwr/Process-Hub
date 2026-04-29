import { redirect } from "next/navigation";
import { categories } from "@/data/categories";
import { HomeClient } from "./HomeClient";

export default async function Page({
  params,
}: {
  params: Promise<{ slug?: string[] }>;
}) {
  const { slug = [] } = await params;

  if (slug.length === 0) {
    return <HomeClient />;
  }

  const [catId, subId, ...rest] = slug;

  // Truncate any extra segments to a valid prefix.
  if (rest.length > 0) {
    redirect(subId ? `/${catId}/${subId}` : `/${catId}`);
  }

  const category = categories.find((c) => c.id === catId);
  if (!category) {
    redirect("/");
  }

  if (!subId) {
    return <HomeClient categoryId={catId} />;
  }

  const sub = category.subCategories.find((s) => s.id === subId);
  if (!sub) {
    redirect(`/${catId}`);
  }

  return <HomeClient categoryId={catId} subCategoryId={subId} />;
}
