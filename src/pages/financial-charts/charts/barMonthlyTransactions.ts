import type {EChartsOption} from 'echarts';
import type {Transaction} from '@/types/transaction';
import type {CategoryWithType} from '@/types/category';

export function generateBarMonthlyTransactionsOptions(
  transactions: Transaction[],
  cats: CategoryWithType[],
  i18nTranslate: (key: string, defaultMsg?: string) => string,
  currentLocale: string,
  selectedMonth: number
): EChartsOption {
  // Track monthly totals for both types
  const monthlyTotals = Array.from({length: 12}, () => ({
    expenses: 0,
    income: 0,
  }));

  // Create category type map for faster lookup
  const categoryTypes = new Map(cats.map((c) => [c.id, c.type]));

  // Aggregate transactions
  transactions.forEach((trans) => {
    const categoryType = categoryTypes.get(trans.categoryId);
    const month = new Date(trans.timestamp).getMonth();

    if (categoryType === 1) {
      // Expense
      monthlyTotals[month].expenses += Number(trans.amount);
    } else if (categoryType === 2) {
      // Income
      monthlyTotals[month].income += Number(trans.amount);
    }
  });

  const monthNames = Array.from({length: 12}, (_, i) =>
    new Date(2000, i, 1).toLocaleString(currentLocale, {month: 'short'})
  );

  // Filter months with activity
  const activeMonths = monthlyTotals
    .map((total, index) => ({
      ...total,
      month: monthNames[index],
    }))
    .filter((item) => item.expenses > 0 || item.income > 0);

  let xAxisData = activeMonths.map((item) => item.month);
  let expenseData = activeMonths.map((item) =>
    Number(item.expenses.toFixed(2))
  );
  let incomeData = activeMonths.map((item) => Number(item.income.toFixed(2)));

  // Calculate monthly balance
  const monthlyBalances = activeMonths.map(
    (item) => item.income - item.expenses
  );

  // Calculate average balance
  const totalBalance = monthlyBalances.reduce(
    (sum, balance) => sum + balance,
    0
  );
  const averageBalance =
    monthlyBalances.length > 0 ? totalBalance / monthlyBalances.length : 0;

  // Determine if balance is negative for display purposes
  const isNegativeBalance = averageBalance < 0;
  const displayBalance = isNegativeBalance ? 0 : averageBalance;
  const actualBalance = averageBalance.toFixed(2);

  // Handle single month selection
  if (selectedMonth !== -1) {
    const monthData = monthlyTotals[selectedMonth];
    if (monthData.expenses > 0 || monthData.income > 0) {
      xAxisData = [monthNames[selectedMonth]];
      expenseData = [Number(monthData.expenses.toFixed(2))];
      incomeData = [Number(monthData.income.toFixed(2))];
    } else {
      xAxisData = [];
      expenseData = [];
      incomeData = [];
    }
  }

  return {
    title: {
      text: i18nTranslate(
        'charts.monthlyTransactionsTitle',
        'Transazioni Mensili'
      ),
      left: 'center',
      top: '20',
      padding: [0, 0, 20, 0],
    },
    tooltip: {
      trigger: 'axis',
      axisPointer: {type: 'shadow'},
      formatter: (params: any) => {
        const param = params[0];
        return `${param.name}<br/>${param.seriesName}: ${param.value.toFixed(
          2
        )} €`;
      },
    },
    legend: {
      data: [
        i18nTranslate('transaction.expense', 'Spese'),
        i18nTranslate('transaction.income', 'Entrate'),
      ],
      bottom: 0,
    },
    grid: {
      left: '0%',
      right: '5%',
      bottom: '5%',
      containLabel: true,
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
        data: expenseData,
        itemStyle: {color: '#ee0a24'},
        label: {
          show: false,
        },
      },
      {
        name: i18nTranslate('transaction.income', 'Entrate'),
        type: 'bar',
        data: incomeData,
        itemStyle: {color: '#07c160'},
        label: {
          show: false,
        },
        markLine: {
          symbol: 'none',
          data: [
            {
              yAxis: displayBalance,
              name: i18nTranslate(
                'transaction.averageBalance',
                'Bilancio Medio'
              ),
            },
          ],
          lineStyle: {
            color: isNegativeBalance ? '#ee0a24' : '#07c160',
            type: isNegativeBalance ? 'dashed' : 'solid',
          },
          label: {
            position: 'insideMiddleTop',
            formatter: `${i18nTranslate('transaction.averageBalance', 'AVG')}: ${actualBalance}€`,
          },
        },
      },
    ],
  };
}
