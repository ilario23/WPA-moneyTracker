import {BASE_CATEGORIES_ID} from '@/utils/category';
import {
  deleteDoc,
  doc,
  getDoc,
  setDoc,
  getDocs,
  collection,
} from 'firebase/firestore';
import {DB} from '@/config/firebase';
import type {Category, CategoryWithType} from '@/types/category';
import {setLoading} from '@/services/utils';
import {createSyncService} from '@/services/sync';

const COLLECTION = 'categories';
const TOKENS_COLLECTION = 'tokens';

interface Option {
  text: string;
  value: string;
  children?: Option[];
  color?: string;
  icon: string;
}

export const UserCategories = {
  /**
   * @param userId
   * @returns the categories for the specified user
   */
  getUserCategories: async (userId: string) => {
    setLoading(true);
    try {
      const sync = createSyncService(userId);
      return await sync.syncCategories();
    } finally {
      setLoading(false);
    }
  },

  //getResetUserCategories
  /**
   * @param userId
   * @returns the categories for the specified user
   */
  getResetUserCategories: async (userId: string) => {
    setLoading(true);
    try {
      // call the syncResetCategories function
      const sync = createSyncService(userId);
      return await sync.syncResetCategories();
    } finally {
      setLoading(false);
    }
  },

  /**
   * @param userId
   * @param onlyActive if true, returns only active categories
   * @returns the categories formatted for the cascader component
   */
  getCascaderCategoryOptions: async (
    userId: string,
    onlyActive: boolean = false
  ): Promise<Option[]> => {
    const categories = await UserCategories.getUserCategories(userId);

    // Filter active categories if onlyActive is true
    const filteredCategories = onlyActive
      ? categories.filter((category) => category.active !== false)
      : categories;

    const categoryMap = new Map<string, Option>();
    const categoryOptions: Option[] = [];

    // Creazione dei nodi di base
    filteredCategories.forEach((category) => {
      categoryMap.set(category.id, {
        text: category.title,
        value: category.id,
        color: category.color || null,
        icon: category.icon,
        children: [],
      });
    });

    // Costruzione della gerarchia
    filteredCategories.forEach((category) => {
      const node = categoryMap.get(category.id);
      if (!node) return;

      if (!category.parentCategoryId) {
        categoryOptions.push(node);
      } else {
        const parent = categoryMap.get(category.parentCategoryId);
        if (parent) {
          parent.children.push(node);
        }
      }
    });

    // Rimuove `children` se è vuoto
    const cleanTree = (nodes: Option[]): Option[] => {
      return nodes.map((node) => {
        const cleanedNode = {...node};
        if (cleanedNode.children.length > 0) {
          cleanedNode.children = cleanTree(cleanedNode.children);
        } else {
          delete cleanedNode.children;
        }
        return cleanedNode;
      });
    };

    return cleanTree(categoryOptions);
  },

  /**
   * Get categories with their type classification
   * @param userId id of the user
   * @returns array of categories with type information
   */
  getCategoriesWithType: async (
    userId: string
  ): Promise<CategoryWithType[]> => {
    try {
      const sync = createSyncService(userId);
      const categories = (await sync.syncCategories()) as Category[];

      const categoriesMap = new Map(categories.map((cat) => [cat.id, cat]));

      const determineType = (category: Category): 1 | 2 | 3 => {
        if (category.id === BASE_CATEGORIES_ID[0]) return 1;
        if (category.id === BASE_CATEGORIES_ID[1]) return 2;
        if (category.id === BASE_CATEGORIES_ID[2]) return 3;

        if (category.parentCategoryId) {
          const parent = categoriesMap.get(category.parentCategoryId);
          if (parent) {
            return determineType(parent);
          }
        }
        return 1;
      };

      const determineColor = (category: Category): string => {
        if (category.color) return category.color;

        if (category.parentCategoryId) {
          const parent = categoriesMap.get(category.parentCategoryId);
          if (parent) {
            return determineColor(parent);
          }
        }
        return '#cccccc';
      };

      return categories.map((category) => ({
        ...category,
        type: determineType(category),
        color: determineColor(category),
      }));
    } catch (error) {
      console.error('Error getting categories with type:', error);
      return [];
    }
  },

  /**
   * @param userId id of the user
   * @param category whole category object to be created
   * @returns the created category
   */
  createUserCategory: async (userId: string, category: Category) => {
    setLoading(true);
    try {
      // Save category
      await setDoc(doc(DB, 'users', userId, COLLECTION, category.id), category);

      // Update categories token
      const newToken = new Date().toISOString();
      await setDoc(doc(DB, 'users', userId, TOKENS_COLLECTION, 'categories'), {
        token: newToken,
      });

      // Update local cache
      const sync = createSyncService(userId);
      await sync.syncResetCategories();

      return category;
    } catch (err) {
      console.error(err);
      setLoading(false);
      return null;
    }
  },

  /**
   * @param userId id of the user
   * @param category whole category object to be updated
   * @returns the updated category
   */
  updateUserCategory: async (userId: string, category: Category) => {
    setLoading(true);
    try {
      // Update category
      await setDoc(
        doc(DB, 'users', userId, COLLECTION, category.id),
        category,
        {merge: true}
      );

      // Update categories token
      const newToken = new Date().toISOString();
      await setDoc(doc(DB, 'users', userId, TOKENS_COLLECTION, 'categories'), {
        token: newToken,
      });

      // Update local cache
      const sync = createSyncService(userId);
      await sync.syncResetCategories();

      return category;
    } catch (err) {
      console.error(err);
      setLoading(false);
      return null;
    }
  },

  /**
   * @param userId id of the user
   * @param categoryId id of the category to be deleted
   * @returns void
   */
  deleteUserCategory: async (
    userId: string,
    categoryId: string
  ): Promise<void> => {
    setLoading(true);
    try {
      await deleteDoc(doc(DB, 'users', userId, COLLECTION, categoryId));

      // Update categories token after deletion
      const newToken = new Date().toISOString();
      await setDoc(doc(DB, 'users', userId, TOKENS_COLLECTION, 'categories'), {
        token: newToken,
      });

      // Update local cache
      const sync = createSyncService(userId);
      await sync.syncCategories();
    } finally {
      setLoading(false);
    }
  },

  /**
   * @param userId id of the user
   * @param categoryId id of the category to retrieve
   * @returns the category object or null if not found
   */
  getUserCategoryById: async (
    userId: string,
    categoryId: string
  ): Promise<Category | null> => {
    setLoading(true);
    try {
      // TODO: mettere questa cosa in Sync
      const categoryDoc = await getDoc(
        doc(DB, 'users', userId, COLLECTION, categoryId)
      );
      return categoryDoc.exists() ? (categoryDoc.data() as Category) : null;
    } catch (err) {
      console.error(err);
      return null;
    } finally {
      setLoading(false);
    }
  },

  /**
   * @param userId id of the user
   * @returns the categories token or null if not found
   */
  getCategoryToken: async (userId: string): Promise<string | null> => {
    const tokenDoc = await getDoc(
      doc(DB, 'users', userId, TOKENS_COLLECTION, 'categories')
    );
    return tokenDoc.data()?.token || null;
  },

  /**
   * @param userId id of the user
   * @returns the categories from firebase
   */
  getFirebaseCategories: async (userId: string): Promise<Category[]> => {
    const categories: Category[] = [];
    const querySnapshot = await getDocs(
      collection(DB, 'users', userId, COLLECTION)
    );
    querySnapshot.forEach((doc) => {
      categories.push(doc.data() as Category);
    });
    return categories;
  },
};
