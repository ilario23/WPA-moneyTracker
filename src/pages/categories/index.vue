<template>
    <van-cascader v-if=false v-model="selectedCategoryId2" :options="rootCategories" :field-names="fieldNames2"
        placeholder="Seleziona una categoria" />

    <div>


            <div style="display: flex; width: 100%; gap: 12px; padding: 8px;">
                <van-cell v-for="root in rootCategories" :key="root.value" :title="root.text" :label="root.icon"
                    @click="selectCategory(root)"
                    style="flex: 1; text-align: center; padding: 12px; border-radius: 8px;" />
            </div>

        <van-swipe-cell v-if="selectedCategory && selectedCategory.text" :title="selectedCategory.text">
            <van-card num="1" price="2.00" desc="Description" :title="selectedCategory.text" class="goods-card"
                thumb="https://fastly.jsdelivr.net/npm/@vant/assets/cat.jpeg" />
            <template #right>
                <van-button square icon="delete-o" type="danger" style="height: 100%" />
            </template>
            <template #left>
                <van-button square icon="edit" type="primary" style="height: 100%" />
            </template>
        </van-swipe-cell>


        <van-cell-group v-if="selectedCategory">
            <van-cell v-for="child in selectedCategory.children" :key="child.value" :title="child.text"
                :label="child.icon" @click="selectCategory(child)" />
        </van-cell-group>

    </div>
</template>

<script lang="ts" setup>
import { ref, computed } from 'vue';


// Dati di esempio (questi potrebbero essere recuperati dal database, ad esempio Firebase)
const rawCategories = [{
    id: '11',
    title: 'Spese Generali',
    color: '#FF5733',
    parentCategoryId: null,
    userId: 'user123',
    active: true,
    icon: 'wallet',
    budget: 1000,
    excludeFromStat: false,
},
{
    id: '2',
    title: 'Risparmi',
    color: '#33FF57',
    parentCategoryId: null,
    userId: 'user123',
    active: true,
    icon: 'piggy-bank',
    budget: 2000,
    excludeFromStat: false,
},

// Categorie di primo livello
{
    id: '3',
    title: 'Cibo e Bevande',
    color: '#FFBD33',
    parentCategoryId: '11',
    userId: 'user123',
    active: true,
    icon: 'utensils',
    budget: 500,
    excludeFromStat: false,
},
{
    id: '4',
    title: 'Trasporti',
    color: '#33BDFF',
    parentCategoryId: '11',
    userId: 'user123',
    active: true,
    icon: 'bus',
    budget: 300,
    excludeFromStat: false,
},

// Categorie di secondo livello
{
    id: '5',
    title: 'Supermercato',
    color: '#FFC733',
    parentCategoryId: '3',
    userId: 'user123',
    active: true,
    icon: 'shopping-cart',
    budget: 300,
    excludeFromStat: false,
},
{
    id: '6',
    title: 'Ristoranti',
    color: '#FF5733',
    parentCategoryId: '3',
    userId: 'user123',
    active: true,
    icon: 'restaurant',
    budget: 200,
    excludeFromStat: false,
},
];

// Funzione di pruning per rimuovere il campo 'children' se è vuoto
const pruneEmptyChildren = (node: any) => {
    if (node.children.length === 0) {
        delete node.children;
    } else {
        node.children.forEach(pruneEmptyChildren); // Ricorsione sui figli
    }
};

// Creazione dell'albero delle categorie
const buildCategoryTree = (categories: any[]) => {
    const categoryMap = new Map<number, any>();
    const roots: any[] = [];

    // Creiamo la mappa iniziale senza children
    categories.forEach((category) => {
        categoryMap.set(category.id, {
            text: category.title,
            value: category.id,
            children: [],
            icon: category.icon,
            color: category.color,
            budget: category.budget,
            excludeFromStat: category.excludeFromStat,
        });
    });

    // Popoliamo la gerarchia
    categories.forEach((category) => {
        const node = categoryMap.get(category.id);
        if (category.parentCategoryId === null) {
            roots.push(node);
        } else {
            const parent = categoryMap.get(category.parentCategoryId);
            if (parent) {
                parent.children.push(node);
            }
        }
    });

    // Rimuove i children vuoti
    roots.forEach(pruneEmptyChildren);

    return roots;
};



// Variabile che contiene le categorie di root
const rootCategories = buildCategoryTree(rawCategories);
console.log(rootCategories)


const fieldNames2 = ref({
    active: 'active',
    budget: 'budget',
    children: 'children',
    color: 'color',
    excludeFromStat: 'excludeFromStat',
    icon: 'icon',
    id: 'id',
    parentCategoryId: 'parentCategoryId',
    title: 'title',
    userId: 'userId'
});

// Variabile per la categoria selezionata
const selectedCategoryId2 = ref<string>('');

// Computed property per ottenere il nome della categoria selezionata
const selectedCategoryName2 = computed(() => {
    return findCategory(translatedCategory, selectedCategoryId2.value)?.text || '';
});

// Funzione per trovare una categoria per id
const findCategory = (categories: any[], id: string) => {
    for (const category of categories) {
        if (category.id === id) return category;
        if (category.children) {
            const child = findCategory(category.children, id);
            if (child) return child;
        }
    }
    return null;
};

// Variabile che contiene i dettagli della categoria selezionata
const selectedCategory = ref({
    text: '',
    icon: '',
    budget: 0,
    color: '',
    id: '',
    excludeFromStat: false,
    children: []
});

// Funzione per selezionare una categoria e mostrare i dettagli
const selectCategory = (category) => {
    selectedCategory.value = category;
};

const changeTab = (index) => {

    selectedCategory.value = rootCategories.find()

}
</script>

<route lang="json5">
{
  name: 'categories',
  meta: {
    title: 'Categories',
    i18n: 'menus.categories',
  },
}
</route>
