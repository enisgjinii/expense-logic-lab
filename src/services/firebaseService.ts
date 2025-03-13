
import { getFirestore, doc, updateDoc, collection, query, where, getDocs, setDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '@/firebase';

// Current user helper
export const getCurrentUser = () => {
  return auth.currentUser;
};

// Subscription Management
export const updateSubscriptionInDB = async (customerId: string, subscriptionData: any) => {
  try {
    // Get user associated with this customer ID
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where("stripeCustomerId", "==", customerId));
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      console.error('No user found with customer ID:', customerId);
      return false;
    }
    
    // Update the user's subscription data
    const userDoc = querySnapshot.docs[0];
    const userRef = doc(db, 'users', userDoc.id);
    await updateDoc(userRef, {
      subscription: {
        ...subscriptionData,
        updatedAt: serverTimestamp()
      }
    });
    
    return true;
  } catch (error) {
    console.error('Error updating subscription in DB:', error);
    throw error;
  }
};

// Categories Management
export const fetchCategoriesForUser = async (userId: string) => {
  try {
    const categoriesRef = collection(db, 'users', userId, 'categories');
    const querySnapshot = await getDocs(categoriesRef);
    const categories: any[] = [];
    
    querySnapshot.forEach((doc) => {
      categories.push({ id: doc.id, ...doc.data() });
    });
    
    return categories;
  } catch (error) {
    console.error('Error fetching categories:', error);
    throw error;
  }
};

export const addCategoryForUser = async (userId: string, category: { id: string, name: string }) => {
  try {
    const categoryRef = doc(db, 'users', userId, 'categories', category.id);
    await setDoc(categoryRef, {
      ...category,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    return true;
  } catch (error) {
    console.error('Error adding category:', error);
    throw error;
  }
};

export const updateCategoryForUser = async (userId: string, categoryId: string, data: any) => {
  try {
    const categoryRef = doc(db, 'users', userId, 'categories', categoryId);
    await updateDoc(categoryRef, {
      ...data,
      updatedAt: serverTimestamp()
    });
    return true;
  } catch (error) {
    console.error('Error updating category:', error);
    throw error;
  }
};

export const deleteCategoryForUser = async (userId: string, categoryId: string) => {
  try {
    const categoryRef = doc(db, 'users', userId, 'categories', categoryId);
    await deleteDoc(categoryRef);
    return true;
  } catch (error) {
    console.error('Error deleting category:', error);
    throw error;
  }
};

// Accounts Management
export const fetchAccountsForUser = async (userId: string) => {
  try {
    const accountsRef = collection(db, 'users', userId, 'accounts');
    const querySnapshot = await getDocs(accountsRef);
    const accounts: any[] = [];
    
    querySnapshot.forEach((doc) => {
      accounts.push({ id: doc.id, ...doc.data() });
    });
    
    return accounts;
  } catch (error) {
    console.error('Error fetching accounts:', error);
    throw error;
  }
};

export const addAccountForUser = async (userId: string, account: { id: string, name: string }) => {
  try {
    const accountRef = doc(db, 'users', userId, 'accounts', account.id);
    await setDoc(accountRef, {
      ...account,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    return true;
  } catch (error) {
    console.error('Error adding account:', error);
    throw error;
  }
};

export const updateAccountForUser = async (userId: string, accountId: string, data: any) => {
  try {
    const accountRef = doc(db, 'users', userId, 'accounts', accountId);
    await updateDoc(accountRef, {
      ...data,
      updatedAt: serverTimestamp()
    });
    return true;
  } catch (error) {
    console.error('Error updating account:', error);
    throw error;
  }
};

export const deleteAccountForUser = async (userId: string, accountId: string) => {
  try {
    const accountRef = doc(db, 'users', userId, 'accounts', accountId);
    await deleteDoc(accountRef);
    return true;
  } catch (error) {
    console.error('Error deleting account:', error);
    throw error;
  }
};
