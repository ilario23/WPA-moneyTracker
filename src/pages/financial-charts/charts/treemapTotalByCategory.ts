import type {EChartsOption} from 'echarts';
import type {Transaction} from '@/types/transaction';
import type {CategoryWithType} from '@/types/category';

interface TreemapDataItem {
  name: string;
  value?: number;
  children?: TreemapDataItem[];
  id?: string; // Add categoryId for easier lookup
}

/**
 * Generates ECharts options for a treemap chart summarizing transactions by category,
 * including parent-child relationships.
 * @param transactions - Array of transaction data.
 * @param categories - Array of category data with types and parent-child relationships.
 * @param i18nTranslate - The translation function (e.g., from useI18n().t).
 * @param currentLocale - The current locale string.
 * @returns EChartsOption object for the treemap chart.
 */
export function generateTreemapTotalByCategoryOptions(
  transactions: Transaction[],
  categories: CategoryWithType[],
  i18nTranslate: (key: string, defaultMsg?: string) => string,
  currentLocale: string
): EChartsOption {
  // Calculate totals for each category
  const categoryTotals = new Map<string, number>();
  transactions.forEach((transaction) => {
    if (transaction.categoryId) {
      const current = categoryTotals.get(transaction.categoryId) || 0;
      categoryTotals.set(
        transaction.categoryId,
        current + Number(transaction.amount)
      );
    }
  });

  // Helper function to build the tree structure
  function buildTreeItem(category: CategoryWithType): TreemapDataItem {
    const children: TreemapDataItem[] = categories
      .filter((c) => c.parentCategoryId === category.id && c.type === 1)
      .map((c) => buildTreeItem(c));

    const directValue = categoryTotals.get(category.id) || 0;
    const childrenSum = children.reduce(
      (sum, child) => sum + (child.value || 0),
      0
    );

    // Se è una categoria di spesa senza genitore, ritorniamo i suoi figli direttamente
    if (!category.parentCategoryId && category.type === 1) {
      return {
        name: category.title,
        value: 0,
        children: children,
      };
    }

    return {
      name: category.title,
      value: Number((directValue + childrenSum).toFixed(2)),
      children: children.length > 0 ? children : undefined,
      id: category.id,
    };
  }

  // Build the root level items and flatten the structure
  const tempData = categories
    .filter((c) => !c.parentCategoryId && c.type === 1)
    .map((c) => buildTreeItem(c));

  // Estraiamo solo i children del primo livello e li usiamo come dati principali
  const seriesData = tempData.flatMap((item) => item.children || []);

  return {
    title: {
      text: i18nTranslate(
        'charts.treemapTotalByCategory',
        'Treemap per Categoria'
      ),
      left: 'center',
    },
    tooltip: {
      formatter: (params: any) => {
        const value = typeof params.value === 'number' ? params.value : 0;
        const name = params.name || '';
        const formattedValue = value.toLocaleString(currentLocale, {
          style: 'currency',
          currency: 'EUR', // Assuming EUR is the base currency
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        });
        return `${name}<br/>${formattedValue}`;
      },
    },
    series: [
      {
        type: 'treemap',
        roam: false,
        data: seriesData,
        label: {
          show: true,
          formatter: '{b}\n{c}€', // Shows both name and value
        },
        upperLabel: {
          show: true,
        },
        breadcrumb: {
          show: true,
        },
        levels: [
          {
            itemStyle: {
              borderWidth: 2,
              gapWidth: 2,
            },
          },
          {
            itemStyle: {
              borderWidth: 1,
              gapWidth: 1,
            },
          },
          {
            itemStyle: {
              borderWidth: 1,
              gapWidth: 1,
            },
          },
        ],
      },
    ],
  };
}
