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
  currentLocale: string // eslint-disable-line @typescript-eslint/no-unused-vars
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
    },
    tooltip: {
      trigger: 'item',
      formatter: '{a} <br/>{b}: {c}€ ({d}%)', // Note: < and > for < and > in XML/HTML context, but in JS string it's fine.
      // However, ECharts formatter might interpret HTML.
    },
    legend: {
      orient: 'vertical',
      left: 'left',
      data: data.map((item) => item.name),
    },
    series: [
      {
        name: i18nTranslate('charts.transactionType', 'Tipo Transazione'),
        type: 'pie',
        radius: '50%',
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
