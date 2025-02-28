import React, { useMemo } from 'react';
import { formatCurrency } from '../utils/format';
import { FinancialData } from '../services/storageService';
import { cacheService } from '../services/cacheService';

interface FinancialTableProps {
  data: FinancialData[];
}

const calculateDesoneraPercentage = 0.04477;

const FinancialTable: React.FC<FinancialTableProps> = React.memo(({ data }) => {
  const months = useMemo(() => 
    Object.keys(data[0]?.months || {}).sort(),
    [data]
  );

  const calculations = useMemo(() => {
    const key = months.join('_');
    const cachedCalculations = cacheService.getCalculations(key);
    if (cachedCalculations) {
      return cachedCalculations;
    }

    const result = data.map(row => {
      const monthlyCalcs = months.reduce((acc, month) => {
        const mensal = row.months[month]?.mensal || 0;
        const acumulado = row.months[month]?.acumulado || 0;
        const desoneraMonthly = mensal * calculateDesoneraPercentage;
        const desoneraAccum = acumulado * calculateDesoneraPercentage;
        const dreMonthly = mensal - desoneraMonthly;
        const dreAccum = acumulado - desoneraAccum;

        acc[month] = {
          mensal: {
            original: mensal,
            desonera: desoneraMonthly,
            dre: dreMonthly
          },
          acumulado: {
            original: acumulado,
            desonera: desoneraAccum,
            dre: dreAccum
          }
        };
        return acc;
      }, {} as Record<string, any>);

      return {
        id: row.id,
        item: row.item,
        calculations: monthlyCalcs
      };
    });

    cacheService.setCalculations(key, result);
    return result;
  }, [data, months]);

  if (!data.length || !months.length) {
    return null;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-primary text-primary-foreground">
            <th className="border p-2 text-left" rowSpan={2}>Item</th>
            {months.map((month) => (
              <th key={month} className="border p-2 text-center" colSpan={2}>
                {month}
              </th>
            ))}
          </tr>
          <tr className="bg-primary text-primary-foreground">
            {months.map((month) => (
              <React.Fragment key={month}>
                <th className="border p-2 text-center">Mensal</th>
                <th className="border p-2 text-center">Acumulado</th>
              </React.Fragment>
            ))}
          </tr>
        </thead>
        <tbody>
          {calculations.map((row) => (
            <React.Fragment key={row.id}>
              {/* Devengado Row */}
              <tr className="hover:bg-muted/50">
                <td className="border p-2">{row.item}</td>
                {months.map((month) => (
                  <React.Fragment key={month}>
                    <td className="border p-2 text-right">
                      {formatCurrency(row.calculations[month].mensal.original)}
                    </td>
                    <td className="border p-2 text-right">
                      {formatCurrency(row.calculations[month].acumulado.original)}
                    </td>
                  </React.Fragment>
                ))}
              </tr>
              {/* Desonera Row */}
              <tr className="hover:bg-muted/50">
                <td className="border p-2">Desonera</td>
                {months.map((month) => (
                  <React.Fragment key={month}>
                    <td className="border p-2 text-right">
                      {formatCurrency(row.calculations[month].mensal.desonera)}
                    </td>
                    <td className="border p-2 text-right">
                      {formatCurrency(row.calculations[month].acumulado.desonera)}
                    </td>
                  </React.Fragment>
                ))}
              </tr>
              {/* DRE Row */}
              <tr className="hover:bg-muted/50">
                <td className="border p-2">Custo DRE</td>
                {months.map((month) => (
                  <React.Fragment key={month}>
                    <td className="border p-2 text-right">
                      {formatCurrency(row.calculations[month].mensal.dre)}
                    </td>
                    <td className="border p-2 text-right">
                      {formatCurrency(row.calculations[month].acumulado.dre)}
                    </td>
                  </React.Fragment>
                ))}
              </tr>
              {/* Margem Row */}
              <tr className="hover:bg-muted/50">
                <td className="border p-2">Margem</td>
                {months.map((month) => (
                  <React.Fragment key={month}>
                    <td className="border p-2 text-right text-green-600">7,6%</td>
                    <td className="border p-2 text-right text-green-600">7,6%</td>
                  </React.Fragment>
                ))}
              </tr>
            </React.Fragment>
          ))}
        </tbody>
      </table>
    </div>
  );
});

FinancialTable.displayName = 'FinancialTable';

export default FinancialTable;
