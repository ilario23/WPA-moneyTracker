import type {EChartsOption} from 'echarts';
import type {Transaction} from '@/types/transaction';
import type {CategoryWithType} from '@/types/category';

export function generateCalendarHeatmapOptions(
  transactions: Transaction[],
  categories: CategoryWithType[],
  t: (key: string, defaultMsg?: string) => string,
  locale: string,
  selectedMonth: number
): EChartsOption {
  // Group transactions by date and calculate daily totals
  const getAllDaysInRange = (
    transactions: Transaction[],
    selectedMonth: number
  ): [string, number][] => {
    if (transactions.length === 0) return [];

    const year = new Date(transactions[0].timestamp).getFullYear();
    let startDate: Date, endDate: Date;

    if (selectedMonth === -1) {
      startDate = new Date(year, 0, 1);
      endDate = new Date(year, 11, 31);
    } else {
      startDate = new Date(year, selectedMonth, 1);
      endDate = new Date(year, selectedMonth + 1, 0);
    }

    const days: [string, number][] = [];
    const currentDate = new Date(startDate);

    while (currentDate <= endDate) {
      days.push([currentDate.toISOString().split('T')[0], 0]);
      currentDate.setDate(currentDate.getDate() + 1);
    }

    return days;
  };

  // Initialize all days with zero and then update with actual transactions
  const dailyTotals: [string, number][] = getAllDaysInRange(
    transactions,
    selectedMonth
  ).map(([date]) => {
    const dayTransactions = transactions.filter((trans) => {
      const transDate = new Date(trans.timestamp).toISOString().split('T')[0];
      const category = categories.find((c) => c.id === trans.categoryId);
      return transDate === date && category?.type === 1;
    });

    const total = dayTransactions.reduce(
      (sum, trans) => sum + Number(trans.amount),
      0
    );
    return [date, total];
  });

  // Get max value excluding top 10% expenses
  const getMaxExcludingTopExpenses = (totals: [string, number][]): number => {
    if (totals.length === 0) return 0;

    // Sort expenses by amount (descending)
    const sortedAmounts = totals.map(([_, v]) => v).sort((a, b) => b - a);

    // Calculate how many items to exclude (5%)
    const excludeCount = Math.max(1, Math.ceil(sortedAmounts.length * 0.05));

    // Return the highest value from the remaining 95%
    return sortedAmounts[excludeCount] || 0;
  };

  // Get the year from the first transaction
  const year = new Date(transactions[0]?.timestamp).getFullYear();

  // Calculate calendar range based on selected month
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth();

  let calendarRange;
  if (selectedMonth === -1) {
    // If "All" months is selected
    if (year === currentYear) {
      // For current year, show only up to current month
      calendarRange = [
        `${year}-01-01`,
        new Date(year, currentMonth + 1, 0).toISOString().split('T')[0],
      ];
    } else if (year > currentYear) {
      // Future year, no data to show
      calendarRange = ['2000-01-01', '2000-01-01']; // Empty range
    } else {
      // Past year, show entire year
      calendarRange = year;
    }
  } else {
    // Specific month selected
    if (year === currentYear && selectedMonth > currentMonth) {
      // Future month in current year, no data to show
      calendarRange = ['2000-01-01', '2000-01-01']; // Empty range
    } else if (year > currentYear) {
      // Future year, no data to show
      calendarRange = ['2000-01-01', '2000-01-01']; // Empty range
    } else {
      // Past month or current month
      const startDate = new Date(year, selectedMonth, 1);
      const endDate = new Date(year, selectedMonth + 1, 0);
      calendarRange = [
        startDate.toISOString().split('T')[0],
        endDate.toISOString().split('T')[0],
      ];
    }
  }

  // Create month name map from translations
  const getMonthNameMap = () => [
    t('transaction.months.january'),
    t('transaction.months.february'),
    t('transaction.months.march'),
    t('transaction.months.april'),
    t('transaction.months.may'),
    t('transaction.months.june'),
    t('transaction.months.july'),
    t('transaction.months.august'),
    t('transaction.months.september'),
    t('transaction.months.october'),
    t('transaction.months.november'),
    t('transaction.months.december'),
  ];

  return {
    title: {
      text: t('charts.calendarHeatmap'),
      left: 'center',
      top: '20',
      padding: [0, 0, 20, 0],
    },
    tooltip: {
      formatter: (params: any) => {
        const value = params.data ? params.data[1] : 0;
        return `${new Date(params.data[0]).toLocaleDateString(locale)}<br/>
                ${value.toLocaleString(locale, {
                  style: 'currency',
                  currency: 'EUR',
                })}`;
      },
    },
    visualMap: {
      min: 0,
      max: getMaxExcludingTopExpenses(dailyTotals),
      calculable: true,
      orient: 'vertical',
      top: '30%',
    },
    calendar: {
      top: 80,
      left: '30%',
      right: '10%',
      cellSize: ['auto', 'auto'],
      orient: 'vertical',
      range: calendarRange,
      itemStyle: {
        borderWidth: 0.5,
      },
      yearLabel: {
        show: false,
      },
      monthLabel: {
        show: true,
        nameMap: getMonthNameMap(),
        position: 'end',
      },
      dayLabel: {
        nameMap: locale.startsWith('it') ? 'it' : 'en',
      },
    },
    series: {
      type: 'heatmap',
      coordinateSystem: 'calendar',
      data: dailyTotals,
    },
  };
}
