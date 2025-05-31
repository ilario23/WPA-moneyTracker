import type {Transaction} from '@/types/transaction';
import type {CategoryWithType} from '@/types/category';
import type {EChartsOption} from 'echarts';

export function generateHistoricalComparisonOptions(
  transactions: Transaction[],
  categories: CategoryWithType[],
  t: Function,
  locale: string,
  selectedMonth: number,
  selectedYear: number // Aggiungi questo parametro
): EChartsOption {
  const currentDate = new Date();
  const isCurrentYear = selectedYear === currentDate.getFullYear();
  const currentMonth = isCurrentYear ? currentDate.getMonth() : 11;

  // Group transactions by year and month
  const yearlyData: {[key: number]: {[key: number]: number}} = {};

  transactions.forEach((trans) => {
    const date = new Date(trans.timestamp);
    const year = date.getFullYear();
    const month = date.getMonth();
    const category = categories.find((c) => c.id === trans.categoryId);

    if (category?.type === 1) {
      // Solo le spese
      if (!yearlyData[year]) yearlyData[year] = {};
      if (!yearlyData[year][month]) yearlyData[year][month] = 0;
      yearlyData[year][month] += Number(trans.amount);
    }
  });

  // Funzione per calcolare i totali cumulativi giornalieri per un mese specifico
  const getDailyCumulativeData = (
    year: number,
    month: number,
    transactions: Transaction[]
  ) => {
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const dailyTotals = new Array(daysInMonth).fill(0);

    const monthTransactions = transactions.filter((trans) => {
      const date = new Date(trans.timestamp);
      return (
        date.getFullYear() === year &&
        date.getMonth() === month &&
        categories.find((c) => c.id === trans.categoryId)?.type === 1
      );
    });

    monthTransactions.forEach((trans) => {
      const date = new Date(trans.timestamp);
      const day = date.getDate() - 1; // 0-based index
      dailyTotals[day] += Number(trans.amount);
    });

    // Converti in cumulativo
    let cumulative = 0;
    return dailyTotals.map((daily) => {
      cumulative += daily;
      return cumulative;
    });
  };

  // Modifica il calcolo delle medie storiche
  const getHistoricalDailyAverages = (month: number) => {
    const previousYears = Object.keys(yearlyData)
      .map(Number)
      .filter((year) => year < selectedYear); // Usa selectedYear invece di currentYear

    if (previousYears.length === 0) return [];

    const daysInMonth = new Date(selectedYear, month + 1, 0).getDate();
    const dailyAverages = new Array(daysInMonth).fill(0);
    const validDaysCount = new Array(daysInMonth).fill(0); // Conta i giorni con dati validi

    previousYears.forEach((year) => {
      const yearData = getDailyCumulativeData(year, month, transactions);
      yearData.forEach((value, day) => {
        if (value > 0) {
          // Considera solo i giorni con spese
          dailyAverages[day] += value;
          validDaysCount[day]++;
        }
      });
    });

    return dailyAverages.map((total, index) =>
      validDaysCount[index] > 0 ? total / validDaysCount[index] : 0
    );
  };

  const getLegendLabels = () => {
    if (selectedMonth >= 0) {
      const monthName = new Date(selectedYear, selectedMonth).toLocaleString(
        locale,
        {month: 'long'}
      );
      return {
        current: `${monthName} ${selectedYear}`,
        historical: `${t('charts.monthlyAverage')} ${monthName} - ${selectedYear}`,
      };
    } else {
      return {
        current: selectedYear.toString(),
        historical: `${t('charts.yearlyAverage')} - ${selectedYear}`,
      };
    }
  };

  const legendLabels = getLegendLabels();

  let xAxisData: string[];
  let historicalData: number[];
  let currentData: (number | null)[];

  if (selectedMonth >= 0) {
    // Vista giornaliera per il mese selezionato
    const daysInMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate();
    xAxisData = Array.from({length: daysInMonth}, (_, i) => (i + 1).toString());

    historicalData = getHistoricalDailyAverages(selectedMonth);
    currentData = getDailyCumulativeData(
      selectedYear,
      selectedMonth,
      transactions
    );

    // Imposta a null i giorni futuri solo se siamo nell'anno e mese corrente
    if (isCurrentYear && selectedMonth === currentDate.getMonth()) {
      const today = currentDate.getDate();
      currentData = currentData.map((value, index) =>
        index < today ? value : null
      );
    }
  } else {
    // Vista mensile per tutto l'anno
    xAxisData = Array.from({length: 12}, (_, i) =>
      new Date(2000, i).toLocaleString(locale, {month: 'short'})
    );

    // Calcola le medie mensili cumulative degli anni precedenti
    historicalData = Array(12)
      .fill(0)
      .map((_, month) => {
        const previousYears = Object.keys(yearlyData)
          .map(Number)
          .filter((year) => year < selectedYear);

        if (previousYears.length === 0) return 0;

        // Calcola il cumulativo per ogni anno precedente
        const yearlyTotals = previousYears.map((year) => {
          let total = 0;
          for (let m = 0; m <= month; m++) {
            total += yearlyData[year]?.[m] || 0;
          }
          return total;
        });

        // Calcola la media dei cumulativi
        return yearlyTotals.length > 0
          ? yearlyTotals.reduce((a, b) => a + b) / yearlyTotals.length
          : 0;
      });

    // Rendi cumulativi i dati dell'anno selezionato
    const selectedYearData = yearlyData[selectedYear] || {};
    let cumulative = 0;
    currentData = Array(12)
      .fill(0)
      .map((_, month) => {
        if (isCurrentYear && month > currentMonth) {
          return null;
        }
        cumulative += selectedYearData[month] || 0;
        return cumulative;
      });
  }

  return {
    title: {
      text:
        selectedMonth >= 0
          ? new Date(selectedYear, selectedMonth).toLocaleString(locale, {
              month: 'long',
              year: 'numeric',
            })
          : `${t('charts.yearlyComparison')} ${selectedYear}`,
      left: 'center',
      top: '20',
      padding: [0, 0, 20, 0],
    },
    tooltip: {
      trigger: 'axis',
      formatter: function (params: any) {
        const month = params[0].axisValue;
        let result = `${month}<br/>`;
        params.forEach((param: any) => {
          const value =
            param.value === null
              ? t('charts.noData')
              : param.value.toLocaleString(locale, {
                  style: 'currency',
                  currency: 'EUR',
                  minimumFractionDigits: 2,
                });
          result += `${param.seriesName}: ${value}<br/>`;
        });
        return result;
      },
    },
    legend: {
      data: [legendLabels.historical, legendLabels.current],
      bottom: 0,
    },
    grid: {
      left: '10%',
      right: '4%',
      top: '15%', // Manteniamo questo spazio per il titolo
      bottom: '10%',
    },
    xAxis: {
      type: 'category',
      data: xAxisData,
      boundaryGap: false,
    },
    yAxis: {
      type: 'value',
      axisLabel: {
        formatter: (value: number) =>
          value.toLocaleString(locale, {
            style: 'currency',
            currency: 'EUR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
          }),
        margin: 25,
        align: 'left', // Aumenta il margine tra i numeri e l'asse
      },
    },
    series: [
      {
        name: legendLabels.historical,
        type: 'line',
        data: historicalData,
        lineStyle: {type: 'dashed'},
        symbol: 'circle',
        symbolSize: 6,
      },
      {
        name: legendLabels.current,
        type: 'line',
        data: currentData,
        symbol: 'circle',
        symbolSize: 6,
        itemStyle: {
          color: '#3eaf7c',
        },
      },
    ],
  };
}
