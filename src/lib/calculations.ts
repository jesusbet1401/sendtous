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
    totalAdValoremUsd: number; // In USD
    totalCustomsValue: number; // CIF + Ad Valorem (Valor Aduanero) in CLP
    totalVat: number; // In CLP
    vatOnCustomsValue: number; // In CLP
    vatOnLocalExpenses: number; // In CLP
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
    rates: {
        usd: number; eur: number; gbp: number; // OLD format (mapped to customs)
        customsUsd?: number; customsEur?: number; customsGbp?: number;
        purchaseUsd?: number; purchaseEur?: number; purchaseGbp?: number;
        crossEurToUsd?: number; crossGbpToUsd?: number;
    },
    hasCertificateOfOrigin: boolean = false,
    sourceCurrency: 'USD' | 'EUR' | 'GBP' | 'CLP' = 'USD'
): { calculatedItems: CalculatedItem[]; summary: CalculationSummary } {

    // 1. Resolve Rates
    // Customs Rates (for taxes) - Fallback to legacy structure or defaults
    const customsRateUsd = rates.customsUsd || rates.usd || 1;
    const customsRateEur = rates.customsEur || rates.eur || 1;
    const customsRateGbp = rates.customsGbp || rates.gbp || 1;

    // Cross Rates (for converting foreign currency to USD for CIF)
    // If not provided, infer from Customs Rates: EUR/USD = Customs EUR / Customs USD
    const crossEurToUsd = rates.crossEurToUsd || (customsRateEur / customsRateUsd);
    const crossGbpToUsd = rates.crossGbpToUsd || (customsRateGbp / customsRateUsd);

    // Purchase Rates (for Real Cost) - Fallback to Customs rates if not set (simplifies initial migration)
    const purchaseRateUsd = rates.purchaseUsd || customsRateUsd;
    const purchaseRateEur = rates.purchaseEur || customsRateEur;
    const purchaseRateGbp = rates.purchaseGbp || customsRateGbp;

    // 2. Helpers
    // Convert FOB to USD for Customs Calculations (using Cross Rates)
    const fobToUsdForCustoms = (amount: number): number => {
        if (sourceCurrency === 'USD') return amount;
        if (sourceCurrency === 'EUR') return amount * crossEurToUsd;
        if (sourceCurrency === 'GBP') return amount * crossGbpToUsd;
        if (sourceCurrency === 'CLP') return amount / customsRateUsd;
        return amount;
    };

    // Convert Cost to USD for Customs Calculations (CIF sum)
    const costToUsdForCustoms = (cost: CostLine): number => {
        if (cost.currency === 'USD') return cost.amount;
        if (cost.currency === 'EUR') return cost.amount * crossEurToUsd;
        // If cost is in CLP, we divide by Customs USD Rate
        if (cost.currency === 'CLP') return cost.amount / customsRateUsd;
        return 0;
    };

    // Calculate Real Cost in CLP (using Purchase Rates)
    const getRealCostInClp = (amount: number, currency: 'USD' | 'EUR' | 'GBP' | 'CLP'): number => {
        if (currency === 'CLP') return amount;
        if (currency === 'USD') return amount * purchaseRateUsd;
        if (currency === 'EUR') return amount * purchaseRateEur;
        if (currency === 'GBP') return amount * purchaseRateGbp;
        return 0;
    };

    // 3. Classify Cost Lines & Calculate Globals
    let totalFreightUsd = 0;
    let totalInsuranceUsd = 0;
    let totalOtherImportCostsUsd = 0;
    let totalLocalCostsClp = 0;

    // For Real Cost tracking
    let totalFreightClpReal = 0;
    let totalInsuranceClpReal = 0;
    let totalOtherImportClpReal = 0;

    costLines.forEach(cost => {
        const desc = cost.description.toLowerCase();
        const cat = cost.category?.toLowerCase() || '';

        // Customs logic (everything to USD)
        const amountUsd = costToUsdForCustoms(cost);
        // Real cost logic (everything to CLP using purchase rate)
        const amountClpReal = getRealCostInClp(cost.amount, cost.currency as any);

        if (desc.includes('flete') || cat.includes('freight')) {
            totalFreightUsd += amountUsd;
            totalFreightClpReal += amountClpReal;
        } else if (desc.includes('seguro') || cat.includes('insurance')) {
            totalInsuranceUsd += amountUsd;
            totalInsuranceClpReal += amountClpReal;
        } else if (cost.currency === 'USD' || cost.currency === 'EUR') {
            totalOtherImportCostsUsd += amountUsd;
            totalOtherImportClpReal += amountClpReal;
        } else {
            totalLocalCostsClp += cost.amount; // Local costs are already CLP
        }
    });

    // 4. Calculate Item Bases (FOB)
    let totalFobOriginal = 0;
    let totalFobUsd = 0;
    let totalFobClpReal = 0; // Total FOB in CLP using Purchase Rate
    let totalUnits = 0;

    const itemsWithFob = items.map(item => {
        const fobTotalOriginal = item.quantity * item.unitPriceFob;
        const fobTotalUsd = fobToUsdForCustoms(fobTotalOriginal);
        const fobTotalClpReal = getRealCostInClp(fobTotalOriginal, sourceCurrency);

        totalFobOriginal += fobTotalOriginal;
        totalFobUsd += fobTotalUsd;
        totalFobClpReal += fobTotalClpReal;
        totalUnits += item.quantity;

        return {
            ...item,
            fobTotalOriginal, // Keep original for display
            fobTotalUsd,      // For Customs Calc
            fobTotalClpReal   // For Real Cost Calc
        };
    });

    // 5. Global Customs/Tax Calculation (The "Official" Way)
    // CIF (USD) = FOB (USD) + Flete (USD) + Seguro (USD) + Otros (USD)
    const totalCifUsd = totalFobUsd + totalFreightUsd + totalInsuranceUsd + totalOtherImportCostsUsd;

    // Tax Calculation Base in CLP using Customs USD Rate
    const totalCifClpCustoms = totalCifUsd * customsRateUsd;

    const adValoremRate = hasCertificateOfOrigin ? 0 : AD_VALOREM_RATE;
    const totalAdValorem = totalCifClpCustoms * adValoremRate; // Ad Valorem is always on CIF
    const totalAdValoremUsd = totalCifUsd * adValoremRate; // Ad Valorem in USD
    const totalCustomsValue = totalCifClpCustoms + totalAdValorem; // Valor Aduanero
    const vatOnCustomsValue = totalCustomsValue * VAT_RATE;
    const vatOnLocalExpenses = totalLocalCostsClp * VAT_RATE;
    const totalVat = vatOnCustomsValue + vatOnLocalExpenses;
    const totalTaxesGlobal = totalAdValorem + vatOnCustomsValue;

    // Savings Calculation
    const adValoremWithoutTlc = totalCifClpCustoms * AD_VALOREM_RATE;
    const vatWithoutTlc = (totalCifClpCustoms + adValoremWithoutTlc) * VAT_RATE;
    const taxesWithoutTlc = adValoremWithoutTlc + vatWithoutTlc;
    const savingsWithTlc = hasCertificateOfOrigin ? 0 : (taxesWithoutTlc - vatOnCustomsValue);

    // 6. Prorate and Calculate Real Unit Costs (The "Business" Way)
    // Real Cost = Real FOB + Real Freight + Real Insurance + Taxes (Official) + Local Costs

    const calculatedItems = itemsWithFob.map(item => {
        const valueFactor = totalFobUsd > 0 ? item.fobTotalUsd / totalFobUsd : 0; // Prorate by USD value
        const qtyFactor = totalUnits > 0 ? item.quantity / totalUnits : 0;

        // Propagate Real Costs (prorated by value)
        const freightReal = totalFreightClpReal * valueFactor;
        const insuranceReal = totalInsuranceClpReal * valueFactor;
        const otherImportReal = totalOtherImportClpReal * valueFactor;

        // Taxes are fixed/official, prorated by Qty (or Value depending on logic, user said Qty for Taxes before but usually Value is safer for AdValorem. Sticking to Qty for consistency with legacy unless asked)
        // Actually, Customs Taxes are usually distributed by CIF Value if items have different categories, but here we treat shipment globally.
        // Let's stick to previous logical flow: Distribute total taxes by quantity if that's what was there, OR by value if that makes more sense.
        // The previous code did taxes by Quantity. Let's keep it to minimize friction, or switch to Value if requested.
        // User didn't specify proration method change, only rates. Sticking to Qty for taxes to be safe.
        const itemAdValorem = totalAdValorem * qtyFactor;
        const itemVat = totalVat * qtyFactor;
        const itemTotalTaxes = itemAdValorem + itemVat;

        const localExpensesPart = totalLocalCostsClp * valueFactor;

        // Real Cost Calculation
        // Item Real FOB (CLP) + Real Freight (CLP) + Real Insurance (CLP) + Real Other (CLP) + Ad Valorem (CLP) + Local Expenses (CLP)
        // Note: VAT is recoverable, usually excluded from "Cost" unless specified otherwise. Previous code excluded VAT from totalCostClp.
        const totalCostClp = item.fobTotalClpReal + freightReal + insuranceReal + otherImportReal + itemAdValorem + localExpensesPart;
        const unitCostClp = item.quantity > 0 ? totalCostClp / item.quantity : 0;

        // CIF components for display (Customs View)
        const cifTotalUsd = item.fobTotalUsd + (totalFreightUsd * valueFactor) + (totalInsuranceUsd * valueFactor) + (totalOtherImportCostsUsd * valueFactor);
        const cifTotalClp = cifTotalUsd * customsRateUsd;

        return {
            ...item,
            fobTotalUsd: item.fobTotalUsd, // This is FOB USD for customs
            freightProrated: freightReal, // This is Real Freight in CLP? Or should we show USD? The legacy interface expects this to be... it was unclear. 
            // In legacy, everything was converted to one currency. 
            // Let's repurpose fields:
            // cifTotalUsd -> Official CIF USD
            // cifTotalClp -> Official CIF CLP
            // totalCostClp -> Real Cost in CLP
            insuranceProrated: insuranceReal,
            cifTotalUsd,
            cifTotalClp,
            adValorem: itemAdValorem,
            vat: itemVat,
            totalTaxes: itemTotalTaxes,
            otherExpensesProrated: localExpensesPart,
            totalCostClp,
            unitCostClp
        };
    });

    // 7. Summary
    const summary: CalculationSummary = {
        totalFobUsd: totalFobOriginal, // Keep exhibiting Source Currency Total
        totalFreightUsd: totalFreightUsd, // Show Customs Freight USD
        totalInsuranceUsd: totalInsuranceUsd, // Show Customs Insurance USD
        totalCifUsd, // Official CIF USD
        totalCifClp: totalCifClpCustoms, // Official CIF CLP
        totalAdValorem,
        totalAdValoremUsd,
        totalCustomsValue,
        totalVat,
        vatOnCustomsValue,
        vatOnLocalExpenses,
        totalTaxes: totalTaxesGlobal,
        totalDutiesClp: totalTaxesGlobal,
        totalGlobalExpensesClp: totalLocalCostsClp, // This is just local expenses
        totalCostClp: calculatedItems.reduce((acc, i) => acc + i.totalCostClp, 0), // Sum of Real Costs
        savingsWithTlc,
        hasCertificateOfOrigin
    };

    return { calculatedItems, summary };
}

