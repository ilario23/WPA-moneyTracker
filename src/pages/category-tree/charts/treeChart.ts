import type {EChartsOption} from 'echarts';
import type {Category} from '@/types/category';
import {BASE_CATEGORIES_ID} from '@/utils/category';

function buildCategoryTree(categories: Category[], rootId: string) {
  // Helper function to recursively build the tree
  const buildNode = (categoryId: string): any => {
    const category = categories.find((c) => c.id === categoryId);
    if (!category) return null;

    const children = categories
      .filter((c) => c.parentCategoryId === categoryId)
      .map((child) => buildNode(child.id))
      .filter(Boolean);

    return {
      name: category.title,
      value: category.budget || 1,
      itemStyle: {
        color: category.color || '#909399',
      },
      ...(children.length > 0 ? {children} : {}),
    };
  };

  return buildNode(rootId);
}

export function generateTreeChartOptions(
  categories: Category[],
  t: (key: string) => string
): EChartsOption {
  const trees = BASE_CATEGORIES_ID.map((rootId) =>
    buildCategoryTree(categories, rootId)
  ).filter(Boolean);

  return {
    title: {
      text: t('category.categoriesTree'),
      left: 'center',
      top: '20',
      padding: [0, 0, 20, 0],
    },

    series: [
      {
        type: 'tree',
        data: trees,
        top: '10%',
        bottom: '10%',
        layout: 'orthogonal', // Changed from 'radial' to 'orthogonal'
        orient: 'LR', // Changed from 'TB' to 'LR' (Left to Right)
        symbol: 'circle',
        symbolSize: 7,
        initialTreeDepth: 3,
        roam: true,
        animationDurationUpdate: 750,
        emphasis: {
          focus: 'descendant',
        },
        label: {
          show: true,
          position: 'top', // Changed from 'top' to 'right'
          rotate: 0,
          verticalAlign: 'middle',
          align: 'center',
          fontSize: 12,
          distance: 5,
        },
        leaves: {
          label: {
            position: 'right', // Changed from 'bottom' to 'right'
            rotate: 0,
            verticalAlign: 'middle',
            align: 'left',
          },
        },
        expandAndCollapse: true,
        animationDuration: 550,
      },
    ],
  };
}
