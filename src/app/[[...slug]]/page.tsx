import { redirect } from "next/navigation";
import { categories } from "@/data/categories";
import { HomeClient } from "./HomeClient";

const PROCESS_HUB_BASE_PATH = "/process-hub";

export default async function Page({
  params,
}: {
  params: Promise<{ slug?: string[] }>;
}) {
  const { slug: rawSlug = [] } = await params;

  if (rawSlug.length === 0) {
    redirect(PROCESS_HUB_BASE_PATH);
  }

  const slug =
    rawSlug[0] === "process-hub" ? rawSlug.slice(1) : rawSlug;

  const [catId, subId, ...rest] = slug;

  const category = categories.find((c) => c.id === catId);

  if (rawSlug[0] !== "process-hub") {
    if (category) {
      redirect(`${PROCESS_HUB_BASE_PATH}/${slug.join("/")}`);
    }

    redirect(PROCESS_HUB_BASE_PATH);
  }

  if (slug.length === 0) {
    return <HomeClient />;
  }

  // Truncate any extra segments to a valid prefix.
  if (rest.length > 0) {
    redirect(subId ? `${PROCESS_HUB_BASE_PATH}/${catId}/${subId}` : `${PROCESS_HUB_BASE_PATH}/${catId}`);
  }

  if (!category) {
    redirect(PROCESS_HUB_BASE_PATH);
  }

  if (!subId) {
    return <HomeClient categoryId={catId} />;
  }

  const sub = category.subCategories.find((s) => s.id === subId);
  if (!sub) {
    redirect(`${PROCESS_HUB_BASE_PATH}/${catId}`);
  }

  return <HomeClient categoryId={catId} subCategoryId={subId} />;
}
