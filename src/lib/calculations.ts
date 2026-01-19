import { Shipment, ShipmentItem, CostLine, Product } from "@prisma/client";

// Extended types for calculation results
export interface CalculatedItem extends ShipmentItem {
    product: Product;
    fobTotalUsd: number;
    freightProrated: number;
    insuranceProrated: number;
    cifTotalUsd: number;
    cifTotalClp: number;
    adValorem: number; // 6% usually, 0 with TLC
    vat: number; // 19%
    totalTaxes: number; // Ad Valorem + VAT
    otherExpensesProrated: number;
    totalCostClp: number;
    unitCostClp: number;
}

export interface CalculationSummary {
    totalFobUsd: number;
    totalFreightUsd: number;
    totalInsuranceUsd: number;
    totalCifUsd: number;
    totalCifClp: number;
    totalAdValorem: number; // In CLP
    totalCustomsValue: number; // CIF + Ad Valorem (Valor Aduanero) in CLP
    totalVat: number; // In CLP
    totalTaxes: number; // Ad Valorem + VAT in CLP
    totalDutiesClp: number; // Legacy: same as totalTaxes
    totalGlobalExpensesClp: number;
    totalCostClp: number;
    savingsWithTlc: number; // How much saved with Certificate of Origin
    hasCertificateOfOrigin: boolean;
}

// Fixed rates for Chile (can be made configurable later)
const AD_VALOREM_RATE = 0.06;
const VAT_RATE = 0.19;

export function calculateShipmentCosts(
    items: (ShipmentItem & { product: Product })[],
    costLines: CostLine[],
    rates: { usd: number; eur: number; gbp: number },
    hasCertificateOfOrigin: boolean = false
): { calculatedItems: CalculatedItem[]; summary: CalculationSummary } {

    // 1. Normalize all inputs to USD and CLP where appropriate
    const validRateUsd = rates.usd || 1; // Avoid division by zero, though 1 is dummy

    // Helper to get expense amount in USD
    const getExpenseInUsd = (cost: CostLine) => {
        if (cost.currency === 'USD') return cost.amount;
        if (cost.currency === 'EUR') return cost.amount * (rates.eur || 0) / validRateUsd;
        if (cost.currency === 'CLP') return cost.amount / validRateUsd;
        return 0;
    };

    // Helper to get expense amount in CLP
    const getExpenseInClp = (cost: CostLine) => {
        if (cost.currency === 'CLP') return cost.amount;
        if (cost.currency === 'USD') return cost.amount * validRateUsd;
        if (cost.currency === 'EUR') return cost.amount * (rates.eur || 0);
        return 0;
    };

    // 2. Classify Cost Lines
    // - "Flete/Freight" -> Freight (included in CIF)
    // - "Seguro/Insurance" -> Insurance (included in CIF)
    // - Any other USD/EUR expense -> Other Import Costs (converted to USD, added to CIF-like total)
    // - CLP expenses -> Local/Post-Import Costs (added after CIF calculation)
    let totalFreightUsd = 0;
    let totalInsuranceUsd = 0;
    let totalOtherImportCostsUsd = 0; // Other USD/EUR expenses
    let totalLocalCostsClp = 0; // CLP expenses (post-import)

    costLines.forEach(cost => {
        const desc = cost.description.toLowerCase();
        const cat = cost.category?.toLowerCase() || '';

        if (desc.includes('flete') || cat.includes('freight')) {
            totalFreightUsd += getExpenseInUsd(cost);
        } else if (desc.includes('seguro') || cat.includes('insurance')) {
            totalInsuranceUsd += getExpenseInUsd(cost);
        } else if (cost.currency === 'USD' || cost.currency === 'EUR') {
            // Other import-related expenses in foreign currency
            totalOtherImportCostsUsd += getExpenseInUsd(cost);
        } else {
            // CLP expenses are local costs
            totalLocalCostsClp += cost.amount;
        }
    });

    // 3. Calculate Item Bases (FOB)
    let totalFobUsd = 0;
    let totalUnits = 0;
    const itemsWithFob = items.map(item => {
        const fobTotal = item.quantity * item.unitPriceFob;
        totalFobUsd += fobTotal;
        totalUnits += item.quantity;
        return { ...item, fobTotalUsd: fobTotal };
    });

    // 4. Global CIF calculation
    const totalCifUsd = totalFobUsd + totalFreightUsd + totalInsuranceUsd + totalOtherImportCostsUsd;
    const totalCifClp = totalCifUsd * validRateUsd;

    // 5. Global Tax calculations
    const adValoremRate = hasCertificateOfOrigin ? 0 : AD_VALOREM_RATE;
    const totalAdValorem = totalCifClp * adValoremRate;
    const totalCustomsValue = totalCifClp + totalAdValorem; // Valor Aduanero
    const totalVat = totalCustomsValue * VAT_RATE;
    const totalTaxesGlobal = totalAdValorem + totalVat;

    // Calculate savings with TLC (what you'd save if you had certificate)
    const adValoremWithoutTlc = totalCifClp * AD_VALOREM_RATE;
    const vatWithoutTlc = (totalCifClp + adValoremWithoutTlc) * VAT_RATE;
    const taxesWithoutTlc = adValoremWithoutTlc + vatWithoutTlc;
    const savingsWithTlc = hasCertificateOfOrigin ? 0 : (taxesWithoutTlc - (totalCifClp * VAT_RATE));

    // 6. Prorate and Calculate Finals per item
    const calculatedItems = itemsWithFob.map(item => {
        // Proration Factor (by Value for costs, by quantity for taxes)
        const valueFactor = totalFobUsd > 0 ? item.fobTotalUsd / totalFobUsd : 0;
        const qtyFactor = totalUnits > 0 ? item.quantity / totalUnits : 0;

        // CIF Components (Prorated by value)
        const freightPart = totalFreightUsd * valueFactor;
        const insurancePart = totalInsuranceUsd * valueFactor;
        const otherImportPart = totalOtherImportCostsUsd * valueFactor;
        const cifTotalUsd = item.fobTotalUsd + freightPart + insurancePart + otherImportPart;
        const cifTotalClp = cifTotalUsd * validRateUsd;

        // Taxes prorated by quantity (as per spec)
        const adValorem = totalAdValorem * qtyFactor;
        const vat = totalVat * qtyFactor;
        const totalTaxes = adValorem + vat;

        // Local Expenses in CLP (prorated by value)
        const localExpensesPart = totalLocalCostsClp * valueFactor;

        // Net Cost = CIF (in CLP) + Ad Valorem + Local Expenses (VAT is recoverable, so not part of cost)
        const netCostClp = cifTotalClp + adValorem + localExpensesPart;
        const unitCostClp = item.quantity > 0 ? netCostClp / item.quantity : 0;

        return {
            ...item,
            freightProrated: freightPart,
            insuranceProrated: insurancePart,
            cifTotalUsd,
            cifTotalClp,
            adValorem,
            vat,
            totalTaxes,
            otherExpensesProrated: localExpensesPart,
            totalCostClp: netCostClp,
            unitCostClp
        };
    });

    // 7. Build Summary
    const summary: CalculationSummary = {
        totalFobUsd,
        totalFreightUsd,
        totalInsuranceUsd,
        totalCifUsd,
        totalCifClp,
        totalAdValorem,
        totalCustomsValue,
        totalVat,
        totalTaxes: totalTaxesGlobal,
        totalDutiesClp: totalTaxesGlobal, // Legacy compatibility
        totalGlobalExpensesClp: totalLocalCostsClp,
        totalCostClp: calculatedItems.reduce((acc, i) => acc + i.totalCostClp, 0),
        savingsWithTlc,
        hasCertificateOfOrigin
    };

    return { calculatedItems, summary };
}

