import { SimulationCalculator } from '@/components/simulations/SimulationCalculator';
import { Separator } from '@/components/ui/separator';

export default function SimulationsPage() {
    return (
        <div className="space-y-6 pb-20">
            <div className="space-y-1">
                <h1 className="text-2xl font-bold text-slate-900">Calculadora de Importación</h1>
                <p className="text-sm text-slate-500">Simula costos de importación rápidamente sin crear registros permanentes.</p>
            </div>
            <Separator />

            <SimulationCalculator />
        </div>
    );
}
