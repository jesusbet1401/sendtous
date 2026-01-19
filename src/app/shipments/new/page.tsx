import { getSuppliersForSelect } from '@/app/actions/products'; // Reusing from products as it returns correct shape
import { ShipmentForm } from '@/components/shipments/ShipmentForm';

export default async function NewShipmentPage() {
    const result = await getSuppliersForSelect();
    const suppliers = result.success ? result.data : [];

    return (
        <ShipmentForm suppliers={suppliers || []} />
    );
}
