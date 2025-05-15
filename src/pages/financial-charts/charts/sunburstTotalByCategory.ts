import type {EChartsOption} from 'echarts';
import type {Transaction} from '@/types/transaction';
import type {CategoryWithType} from '@/types/category';
import {generateTreemapTotalByCategoryOptions} from './treemapTotalByCategory';

export function generateSunburstTotalByCategoryOptions(
  transactions: Transaction[],
  categories: CategoryWithType[],
  i18nTranslate: (key: string, defaultMsg?: string) => string,
  currentLocale: string
): EChartsOption {
  // Riutilizziamo la logica del treemap per ottenere i dati strutturati
  const treemapOptions = generateTreemapTotalByCategoryOptions(
    transactions,
    categories,
    i18nTranslate,
    currentLocale
  );

  // Prendiamo i dati dalla serie del treemap
  const seriesData = (treemapOptions.series as any[])[0].data;

  return {
    title: {
      text: i18nTranslate(
        'charts.sunburstTotalByCategory',
        'Sunburst per Categoria'
      ),
      left: 'center',
    },
    tooltip: {
      formatter: (params: any) => {
        const value = typeof params.value === 'number' ? params.value : 0;
        const formattedValue = value.toLocaleString(currentLocale, {
          style: 'currency',
          currency: 'EUR',
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        });
        return `${params.name}<br/>${formattedValue}`;
      },
    },
    series: {
      type: 'sunburst',
      data: seriesData,
      radius: ['20%', '90%'], // Aumentato il raggio esterno per dare più spazio
      sort: (a: any, b: any) => {
        return b.value - a.value; // Ordine decrescente per mettere i valori più grandi all'esterno
      },
      label: {
        rotate: 'tangential',
        minAngle: 10, // Mostra etichette solo per settori più grandi di 5 gradi
        formatter: (params: any) => {
          const value = params.value.toFixed(2);
          // Per i livelli esterni, formatta diversamente
          if (params.depth === 2) {
            return `${params.name}\n${value}€`;
          }
          return params.name;
        },
      },
      levels: [
        {
          // Livello root
          r0: '20%',
          r: '45%',
          label: {
            align: 'center',
            position: 'inside',
          },
        },
        {
          // Livello intermedio
          r0: '45%',
          r: '75%',
          label: {
            align: 'center',
            position: 'inside',
          },
        },
        {
          // Livello esterno
          r0: '75%',
          r: '85%',
          label: {
            position: 'outside',
            padding: 3,
            silent: false,
            fontSize: 10,
            align: 'right',
          },
          itemStyle: {
            borderWidth: 1,
          },
        },
      ],
    },
  };
}
