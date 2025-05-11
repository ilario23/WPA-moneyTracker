import type {EChartsOption} from 'echarts';
import type {Transaction} from '@/types/transaction';
import type {CategoryWithType} from '@/types/category';

/**
 * Generates ECharts options for a bar chart showing monthly expenses.
 * @param transactions - Array of transaction data (should be pre-filtered for the year).
 * @param cats - Array of category data with types.
 * @param i18nTranslate - The translation function.
 * @param currentLocale - The current locale string.
 * @param selectedMonth - The selected month index (0-11), or -1 if "All" months are selected.
 * @returns EChartsOption object for the bar chart.
 */
export function generateBarMonthlyExpensesOptions(
  transactions: Transaction[],
  cats: CategoryWithType[],
  i18nTranslate: (key: string, defaultMsg?: string) => string,
  currentLocale: string,
  selectedMonth: number // 0-11 for a specific month, -1 for "All"
): EChartsOption {
  const monthlyExpenses: number[] = Array(12).fill(0);
  const expenseCategoryIds = cats.filter((c) => c.type === 1).map((c) => c.id);

  transactions.forEach((trans) => {
    if (expenseCategoryIds.includes(trans.categoryId)) {
      const month = new Date(trans.timestamp).getMonth(); // 0-11
      monthlyExpenses[month] += Number(trans.amount);
    }
  });

  const monthNames = Array.from({length: 12}, (_, i) =>
    new Date(2000, i, 1).toLocaleString(currentLocale, {month: 'short'})
  );

  let seriesData: number[] = monthlyExpenses;
  let xAxisData: string[] = monthNames;

  if (selectedMonth !== -1 && selectedMonth >= 0 && selectedMonth < 12) {
    // Show only the selected month's bar if a specific month is chosen
    seriesData = [monthlyExpenses[selectedMonth]];
    xAxisData = [monthNames[selectedMonth]];
  }
  // If selectedMonth is -1 (All), use the full monthlyExpenses and monthNames

  return {
    title: {
      text: i18nTranslate('charts.monthlyExpensesTitle', 'Spese Mensili'),
      left: 'center',
    },
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'shadow',
      },
      formatter: (params: any) => {
        // More specific type could be used if known
        const param = params[0];
        return `${param.name}<br/>${param.seriesName}: ${param.value.toFixed(2)}€`;
      },
    },
    xAxis: {
      type: 'category',
      data: xAxisData,
    },
    yAxis: {
      type: 'value',
      axisLabel: {
        formatter: '{value} €',
      },
    },
    series: [
      {
        name: i18nTranslate('transaction.expense', 'Spese'),
        type: 'bar',
        data: seriesData,
        itemStyle: {
          color: '#ee0a24', // Vant's danger color for expenses
        },
        label: {
          show: true,
          position: 'top',
          formatter: (params: any) => {
            if (params.value > 0) {
              return `${Number(params.value).toFixed(2)}€`;
            }
            return '';
          },
          color: '#333',
        },
      },
    ],
  };
}
