import type {EChartsOption} from 'echarts';
import type {Transaction} from '@/types/transaction';
import type {CategoryWithType} from '@/types/category';

/**
 * Generates ECharts options for a pie chart summarizing transactions by type (Income, Expense, Investment).
 * @param transactions - Array of transaction data.
 * @param cats - Array of category data with types.
 * @param i18nTranslate - The translation function (e.g., from useI18n().t).
 * @param currentLocale - The current locale string (not directly used in this specific chart's current logic but good for consistency).
 * @returns EChartsOption object for the pie chart.
 */
export function generatePieTotalByTypeOptions(
  transactions: Transaction[],
  cats: CategoryWithType[],
  i18nTranslate: (key: string, defaultMsg?: string) => string,
  currentLocale: string
): EChartsOption {
  const totals = {
    income: 0,
    expense: 0,
    investment: 0,
  };

  transactions.forEach((trans) => {
    const category = cats.find((c) => c.id === trans.categoryId);
    if (category) {
      if (category.type === 1) {
        // Expense
        totals.expense += Number(trans.amount);
      } else if (category.type === 2) {
        // Income
        totals.income += Number(trans.amount);
      } else if (category.type === 3) {
        // Investment
        totals.investment += Number(trans.amount);
      }
    }
  });

  const data = [
    {
      value: totals.income,
      name: i18nTranslate('transaction.income', 'Entrate'),
    },
    {
      value: totals.expense,
      name: i18nTranslate('transaction.expense', 'Spese'),
    },
    {
      value: totals.investment,
      name: i18nTranslate('transaction.investment', 'Investimenti'),
    },
  ].filter((item) => item.value > 0); // Show only if value is greater than 0

  return {
    title: {
      text: i18nTranslate('charts.transactionType', 'Riepilogo per Tipo'),
      left: 'center',
      top: '20',
      padding: [0, 0, 20, 0],
    },
    tooltip: {
      trigger: 'item',
      formatter: (params: any) => {
        // Consider using a more specific ECharts formatter params type if available
        const value = typeof params.value === 'number' ? params.value : 0;
        const name = params.name || '';
        // const seriesName = params.seriesName || ''; // seriesName is available via params.seriesName
        const percent = typeof params.percent === 'number' ? params.percent : 0;

        const formattedValue = value.toLocaleString(currentLocale, {
          style: 'currency',
          currency: 'EUR', // Assuming EUR is the base currency
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        });
        // Using params.seriesName for the first part of the tooltip
        return `${params.seriesName}<br/>${name}: ${formattedValue} (${percent}%)`;
      },
    },
    legend: {
      orient: 'horizontal',
      bottom: '10',
      left: 'center',
      padding: [15, 0, 15, 0],
      itemGap: 30,
      data: data.map((item) => item.name),
    },
    series: [
      {
        name: i18nTranslate('charts.transactionType', 'Tipo Transazione'),
        type: 'pie',
        radius: ['30%', '70%'], // Make the pie larger and hollow
        center: ['50%', '50%'], // Center in the available space
        label: {
          show: true,
          formatter: (params: any) => {
            const value = Number(params.value).toFixed(2);
            return `${params.name}: ${value}€\n(${params.percent.toFixed(1)}%)`;
          },
          position: 'inside',
          alignTo: 'edge',
          minMargin: 5,
          edgeDistance: 10,
          lineHeight: 15,
          rich: {
            time: {
              fontSize: 10,
              color: '#999',
            },
          },
        },
        labelLine: {
          length: 15,
          length2: 0,
          maxSurfaceAngle: 80,
        },
        data,
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowOffsetX: 0,
            shadowColor: 'rgba(0, 0, 0, 0.5)',
          },
        },
      },
    ],
  };
}
