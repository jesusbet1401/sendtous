import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

interface ShipmentExportData {
    reference: string;
    supplier: string;
    items: {
        sku: string;
        name: string;
        quantity: number;
        unitPriceFob: number;
        totalFob: number;
        unitCostClp?: number;
        totalCostClp?: number;
    }[];
    costs: {
        description: string;
        amount: number;
        currency: string;
    }[];
    exchangeRates: {
        usd: number;
        eur: number;
    };
    summary: {
        totalFob: number;
        totalCif: number;
        totalCostClp: number;
    };
}

export function exportShipmentToExcel(data: ShipmentExportData) {
    const workbook = XLSX.utils.book_new();

    // Sheet 1: Summary
    const summaryData = [
        ['RESUMEN DE EMBARQUE'],
        [''],
        ['Referencia', data.reference],
        ['Proveedor', data.supplier],
        [''],
        ['Tipo de Cambio USD', data.exchangeRates.usd],
        ['Tipo de Cambio EUR', data.exchangeRates.eur],
        [''],
        ['TOTALES'],
        ['Total FOB (USD)', data.summary.totalFob],
        ['Total CIF (USD)', data.summary.totalCif],
        ['Total Costo (CLP)', data.summary.totalCostClp],
    ];
    const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(workbook, summarySheet, 'Resumen');

    // Sheet 2: Items
    const itemsHeader = ['SKU', 'Producto', 'Cantidad', 'Precio FOB (USD)', 'Total FOB (USD)', 'Costo Unit. (CLP)', 'Total (CLP)'];
    const itemsRows = data.items.map(item => [
        item.sku,
        item.name,
        item.quantity,
        item.unitPriceFob,
        item.totalFob,
        item.unitCostClp || 0,
        item.totalCostClp || 0
    ]);
    const itemsSheet = XLSX.utils.aoa_to_sheet([itemsHeader, ...itemsRows]);
    XLSX.utils.book_append_sheet(workbook, itemsSheet, 'Productos');

    // Sheet 3: Costs
    const costsHeader = ['Descripción', 'Monto', 'Moneda'];
    const costsRows = data.costs.map(cost => [
        cost.description,
        cost.amount,
        cost.currency
    ]);
    const costsSheet = XLSX.utils.aoa_to_sheet([costsHeader, ...costsRows]);
    XLSX.utils.book_append_sheet(workbook, costsSheet, 'Gastos');

    // Generate and save
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    saveAs(blob, `embarque_${data.reference}.xlsx`);
}

export function exportReportsToExcel(data: {
    shipments: Array<{
        reference: string;
        supplier: string;
        totalFob: number;
        totalCif: number;
        itemCount: number;
        date: Date;
    }>;
    totals: {
        totalShipments: number;
        totalFob: number;
        totalCif: number;
    };
}) {
    const workbook = XLSX.utils.book_new();

    // Sheet 1: All Shipments
    const header = ['Referencia', 'Proveedor', 'FOB (USD)', 'CIF (USD)', 'Items', 'Fecha'];
    const rows = data.shipments.map(s => [
        s.reference,
        s.supplier,
        s.totalFob,
        s.totalCif,
        s.itemCount,
        new Date(s.date).toLocaleDateString('es-CL')
    ]);
    const shipmentsSheet = XLSX.utils.aoa_to_sheet([header, ...rows]);
    XLSX.utils.book_append_sheet(workbook, shipmentsSheet, 'Embarques');

    // Sheet 2: Summary
    const summaryData = [
        ['RESUMEN GENERAL'],
        [''],
        ['Total Embarques', data.totals.totalShipments],
        ['Total FOB (USD)', data.totals.totalFob],
        ['Total CIF (USD)', data.totals.totalCif],
    ];
    const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(workbook, summarySheet, 'Resumen');

    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    saveAs(blob, `reporte_importaciones_${new Date().toISOString().slice(0, 10)}.xlsx`);
}
