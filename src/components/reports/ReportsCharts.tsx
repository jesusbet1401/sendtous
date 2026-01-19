'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    Legend
} from 'recharts';

const COLORS = ['#0d9488', '#0891b2', '#0284c7', '#7c3aed', '#c026d3', '#e11d48'];

interface MonthlyData {
    month: string;
    fob: number;
    costs: number;
    cif: number;
    count: number;
}

interface SupplierData {
    name: string;
    totalCif: number;
    count: number;
}

export function ReportsCharts({
    monthlyData,
    supplierData
}: {
    monthlyData: MonthlyData[];
    supplierData: SupplierData[]
}) {
    // Format month labels (e.g., "2024-01" -> "Ene 24")
    const formattedMonthly = monthlyData.map(d => ({
        ...d,
        monthLabel: new Date(d.month + '-01').toLocaleDateString('es-CL', { month: 'short', year: '2-digit' })
    }));

    // Prepare pie data
    const pieData = supplierData.slice(0, 6).map((s, i) => ({
        name: s.name.length > 15 ? s.name.slice(0, 15) + '...' : s.name,
        value: Math.round(s.totalCif),
        color: COLORS[i % COLORS.length]
    }));

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Monthly Bar Chart */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-base">Costos Mensuales (USD)</CardTitle>
                    <CardDescription>FOB vs Gastos por mes.</CardDescription>
                </CardHeader>
                <CardContent className="h-[300px]">
                    {formattedMonthly.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={formattedMonthly} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                                <XAxis dataKey="monthLabel" tick={{ fontSize: 12 }} stroke="#94a3b8" />
                                <YAxis tick={{ fontSize: 12 }} stroke="#94a3b8" tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                                <Tooltip
                                    formatter={(value) => [`$${Number(value || 0).toLocaleString()}`, '']}
                                    contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0' }}
                                />
                                <Bar dataKey="fob" name="FOB" fill="#0d9488" radius={[4, 4, 0, 0]} />
                                <Bar dataKey="costs" name="Gastos" fill="#0891b2" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
                            Sin datos suficientes para mostrar el gráfico.
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Supplier Pie Chart */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-base">Distribución por Proveedor</CardTitle>
                    <CardDescription>CIF total por proveedor (Top 6).</CardDescription>
                </CardHeader>
                <CardContent className="h-[300px]">
                    {pieData.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={pieData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={90}
                                    paddingAngle={2}
                                    dataKey="value"
                                    label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                                    labelLine={false}
                                >
                                    {pieData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Tooltip
                                    formatter={(value) => [`$${Number(value || 0).toLocaleString()}`, 'CIF']}
                                    contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0' }}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
                            Sin datos suficientes para mostrar el gráfico.
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
