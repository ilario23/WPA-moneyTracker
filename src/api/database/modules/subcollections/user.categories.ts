import {collection, deleteDoc, doc, getDocs, setDoc} from 'firebase/firestore';
import {DB} from '@/config/firebase';
import type {Category} from '@/types/category';
import {setLoading} from '@/services/utils';

const COLLECTION = 'categories';

interface Option {
  text: string;
  value: string;
  children?: Option[];
}

export const UserCategories = {
  /**
   * @param userId
   * @returns the categories for the specified user
   */
  getUserCategories: async (userId: string) => {
    setLoading(true);
    const snaps = await getDocs(
      collection(DB, 'users', userId, COLLECTION)
    ).finally(() => setLoading(false));
    return snaps.docs.map((snap) => snap.data() as Category);
  },

  /**
   * @param userId
   * @returns the categories formatted for the cascader component
   */
  getCascaderCategoryOptions: async (userId: string): Promise<Option[]> => {
    const categories = await UserCategories.getUserCategories(userId);

    const categoryMap = new Map<string, Option>();
    const categoryOptions: Option[] = [];

    // Creazione dei nodi di base
    categories.forEach((category) => {
      categoryMap.set(category.id, {
        text: category.title,
        value: category.id,
        children: [],
      });
    });

    // Costruzione della gerarchia
    categories.forEach((category) => {
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
   * @param userId id of the user
   * @param category whole category object to be created
   * @returns the created category
   */
  createUserCategory: async (userId: string, category: Category) => {
    setLoading(true);
    try {
      await setDoc(doc(DB, 'users', userId, COLLECTION, category.id), category);
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
      await setDoc(
        doc(DB, 'users', userId, COLLECTION, category.id),
        category,
        {
          merge: true,
        }
      );
      return category;
    } catch (err) {
      console.error(err);
      setLoading(false);
      return null;
    }
  },

  /**
   * @param userId id of the user
   * @param category whole category object to be deleted
   * @returns void
   */
  deleteUserCategory: async (
    userId: string,
    category: Category
  ): Promise<void> => {
    setLoading(true);
    return deleteDoc(doc(DB, 'users', userId, COLLECTION, category.id)).finally(
      () => setLoading(false)
    );
  },
};
