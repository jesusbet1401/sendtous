import { getProduct, getSuppliersForSelect } from '@/app/actions/products';
import { ProductForm } from '@/components/products/ProductForm';
import { notFound } from 'next/navigation';

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const [productResult, suppliersResult] = await Promise.all([
        getProduct(id),
        getSuppliersForSelect(),
    ]);

    if (!productResult.success || !productResult.data) {
        notFound();
    }

    const suppliers = suppliersResult.success ? suppliersResult.data : [];

    return (
        <ProductForm
            suppliers={suppliers || []}
            product={productResult.data}
        />
    );
}
