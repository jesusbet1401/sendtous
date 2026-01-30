'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
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
    LineChart,
    Line
} from 'recharts';
import { Calculator } from 'lucide-react';

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

interface FactorDataPoint {
    date: string;
    factor: number;
    reference: string;
}

interface FactorByBrand {
    name: string;
    data: FactorDataPoint[];
    avgFactor: number;
}

interface BrandInfo {
    name: string;
    count: number;
    avgFactor: number;
}

export function ReportsCharts({
    monthlyData,
    supplierData,
    factorByBrand,
    brands
}: {
    monthlyData: MonthlyData[];
    supplierData: SupplierData[];
    factorByBrand: FactorByBrand[];
    brands: BrandInfo[];
}) {
    const [selectedBrand, setSelectedBrand] = useState<string>(brands[0]?.name || '');

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

    // Get factor data for selected brand
    const selectedBrandData = useMemo(() => {
        const brand = factorByBrand.find(b => b.name === selectedBrand);
        if (!brand) return { data: [], avgFactor: 0 };

        return {
            data: brand.data.map(d => ({
                ...d,
                dateLabel: new Date(d.date).toLocaleDateString('es-CL', { day: '2-digit', month: 'short', year: '2-digit' }),
                factorFormatted: d.factor.toFixed(2)
            })),
            avgFactor: brand.avgFactor
        };
    }, [selectedBrand, factorByBrand]);

    return (
        <div className="space-y-6">
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

            {/* Factor by Brand Line Chart */}
            <Card>
                <CardHeader>
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div>
                            <CardTitle className="text-base flex items-center gap-2">
                                <Calculator className="h-4 w-4" />
                                Factor CLP/USD por Marca
                            </CardTitle>
                            <CardDescription>Evolución del factor de costo por embarque.</CardDescription>
                        </div>
                        <div className="flex items-center gap-3">
                            {selectedBrandData.avgFactor > 0 && (
                                <Badge variant="secondary" className="bg-teal-50 text-teal-700">
                                    Promedio: {selectedBrandData.avgFactor.toFixed(2)}
                                </Badge>
                            )}
                            <Select value={selectedBrand} onValueChange={setSelectedBrand}>
                                <SelectTrigger className="w-[200px]">
                                    <SelectValue placeholder="Seleccionar marca" />
                                </SelectTrigger>
                                <SelectContent>
                                    {brands.map(brand => (
                                        <SelectItem key={brand.name} value={brand.name}>
                                            {brand.name} ({brand.count})
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="h-[350px]">
                    {selectedBrandData.data.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={selectedBrandData.data} margin={{ top: 10, right: 30, left: 10, bottom: 10 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                                <XAxis
                                    dataKey="dateLabel"
                                    tick={{ fontSize: 11 }}
                                    stroke="#94a3b8"
                                    angle={-45}
                                    textAnchor="end"
                                    height={60}
                                />
                                <YAxis
                                    tick={{ fontSize: 12 }}
                                    stroke="#94a3b8"
                                    domain={['auto', 'auto']}
                                    tickFormatter={(v) => v.toFixed(0)}
                                />
                                <Tooltip
                                    contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0' }}
                                    content={({ active, payload, label }) => {
                                        if (active && payload && payload.length) {
                                            const data = payload[0].payload;
                                            return (
                                                <div className="bg-white p-3 rounded-lg shadow-lg border">
                                                    <p className="font-medium text-sm">{data.reference}</p>
                                                    <p className="text-xs text-muted-foreground">{label}</p>
                                                    <p className="text-teal-700 font-bold mt-1">
                                                        Factor: {Number(data.factor).toFixed(2)}
                                                    </p>
                                                </div>
                                            );
                                        }
                                        return null;
                                    }}
                                />
                                <Line
                                    type="monotone"
                                    dataKey="factor"
                                    stroke="#0d9488"
                                    strokeWidth={2}
                                    dot={{ fill: '#0d9488', strokeWidth: 2, r: 4 }}
                                    activeDot={{ r: 6, fill: '#0d9488' }}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
                            {brands.length === 0
                                ? 'No hay embarques con datos de factor calculado.'
                                : 'Selecciona una marca para ver la evolución del factor.'}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
