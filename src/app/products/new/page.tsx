import { getSuppliersForSelect } from '@/app/actions/products';
import { ProductForm } from '@/components/products/ProductForm';

export default async function NewProductPage() {
    const result = await getSuppliersForSelect();
    const suppliers = result.success ? result.data : [];

    return (
        <ProductForm suppliers={suppliers || []} />
    );
}
