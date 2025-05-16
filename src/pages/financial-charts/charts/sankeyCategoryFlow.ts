import type {EChartsOption} from 'echarts';
import type {Transaction} from '@/types/transaction';
import type {CategoryWithType} from '@/types/category';

export function generateSankeyFlowOptions(
  transactions: Transaction[],
  categories: CategoryWithType[],
  t: (key: string, defaultMsg?: string) => string,
  locale: string
): EChartsOption {
  // Prepare nodes (categories) and links (flows)
  const nodes: {name: string}[] = [];
  const links: {source: string; target: string; value: number}[] = [];

  // Create a map for category lookup
  const categoryMap = new Map(categories.map((cat) => [cat.id, cat]));

  // Node delle entrate (centro)
  const incomeNodeName = t('common.income');
  nodes.push({name: incomeNodeName});

  // Prima fase: categorie di entrata -> nodo entrate
  const incomeCategories = new Set<string>();
  const incomeTotalsByCategory = new Map<string, number>();

  transactions.forEach((trans) => {
    const category = categoryMap.get(trans.categoryId);
    if (category?.type === 2) {
      // Solo categorie di entrata
      incomeCategories.add(category.id);
      incomeTotalsByCategory.set(
        category.id,
        (incomeTotalsByCategory.get(category.id) || 0) + Number(trans.amount)
      );
    }
  });

  // Aggiungi nodi per le categorie di entrata e crea i link verso il nodo entrate
  incomeCategories.forEach((categoryId) => {
    const category = categoryMap.get(categoryId);
    if (category) {
      nodes.push({name: category.title});
      links.push({
        source: category.title,
        target: incomeNodeName,
        value: Number(incomeTotalsByCategory.get(categoryId)?.toFixed(2) || 0),
      });
    }
  });

  // Seconda fase: nodo entrate -> categorie di spesa principali
  const expenseParentCategories = new Set<string>();
  const expenseTotalsByParent = new Map<string, number>();

  transactions.forEach((trans) => {
    const category = categoryMap.get(trans.categoryId);
    if (category?.type === 1 && category.parentCategoryId) {
      expenseParentCategories.add(category.parentCategoryId);
      expenseTotalsByParent.set(
        category.parentCategoryId,
        (expenseTotalsByParent.get(category.parentCategoryId) || 0) +
          Number(trans.amount)
      );
    }
  });

  // Aggiungi nodi per le categorie principali di spesa e crea i link dal nodo entrate
  expenseParentCategories.forEach((parentId) => {
    const category = categoryMap.get(parentId);
    if (category) {
      nodes.push({name: category.title});
      links.push({
        source: incomeNodeName,
        target: category.title,
        value: Number(expenseTotalsByParent.get(parentId)?.toFixed(2) || 0),
      });
    }
  });

  // Terza fase: categorie principali -> sottocategorie di spesa
  const flowMap = new Map<string, number>();
  transactions.forEach((trans) => {
    const category = categoryMap.get(trans.categoryId);
    if (category?.parentCategoryId) {
      const parentCategory = categoryMap.get(category.parentCategoryId);
      if (parentCategory) {
        const flowKey = `${parentCategory.title}>${category.title}`;
        flowMap.set(
          flowKey,
          (flowMap.get(flowKey) || 0) + Number(trans.amount)
        );

        // Add child category if not already present
        if (!nodes.some((n) => n.name === category.title)) {
          nodes.push({name: category.title});
        }
      }
    }
  });

  // Create links from flowMap
  flowMap.forEach((value, key) => {
    const [source, target] = key.split('>');
    links.push({
      source,
      target,
      value: Number(value.toFixed(2)),
    });
  });

  return {
    title: {
      text: t('charts.sankeyFlow'),
      left: 'center',
    },
    tooltip: {
      trigger: 'item',
      triggerOn: 'mousemove',
      formatter: (params: any) => {
        const value = params.value.toLocaleString(locale, {
          style: 'currency',
          currency: 'EUR',
        });
        return `${params.name}<br />${value}`;
      },
    },
    series: [
      {
        type: 'sankey',
        emphasis: {
          focus: 'adjacency',
        },
        data: nodes,
        links: links,
        orient: 'horizontal',
        label: {
          position: 'right',
        },
        lineStyle: {
          color: 'gradient',
          curveness: 0.5,
        },
        levels: [
          {
            depth: 0,
            itemStyle: {
              color: '#91cc75', // Verde per le categorie di entrata
            },
          },
          {
            depth: 1,
            itemStyle: {
              color: '#5470c6', // Blu per il nodo entrate centrale
            },
          },
        ],
      },
    ],
  };
}
