import { notFound } from "next/navigation";
import { PageShell, ProductCard } from "../../components";
import { getProduct, products } from "@/lib/catalog";
import { ProductPurchasePanel } from "./product-purchase-panel";

export function generateStaticParams() {
  return products.map((product) => ({
    slug: product.slug,
  }));
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = getProduct(slug);

  if (!product) {
    notFound();
  }

  const related = products
    .filter((item) => item.slug !== product.slug && item.category === product.category)
    .slice(0, 4);

  return (
    <PageShell headerTheme="light">
      <section className="px-5 pb-16 pt-28 sm:px-8 lg:pb-24">
        <ProductPurchasePanel product={product} />
      </section>

      {related.length > 0 && (
        <section className="border-t border-[#e2ddd5] px-5 py-16 sm:px-8 lg:py-24">
          <div className="mx-auto max-w-7xl">
            <h2 className="text-3xl font-semibold sm:text-4xl">Tambien puede encajar</h2>
            <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {related.map((item) => (
                <ProductCard key={item.id} product={item} />
              ))}
            </div>
          </div>
        </section>
      )}
    </PageShell>
  );
}