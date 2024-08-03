
import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged, 
  setPersistence,
  browserLocalPersistence 
} from 'firebase/auth';
import { 
  getFirestore, 
  collection, 
  addDoc, 
  doc, 
  setDoc, 
  getDocs, 
  query, 
  where, 
  deleteDoc, 
  updateDoc 
} from 'firebase/firestore';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
};
export interface InventoryItem {
  itemId: string;
  date: string;
  type: string;
  quantity: number;
}

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export const signUp = async (email: string, password: string) => {
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  const uid = userCredential.user.uid;
  
  // Create user document in Firestore
  await setDoc(doc(db, 'users', uid), {
    email: email,
    createdAt: new Date().toISOString()
  });

  return userCredential;
};

export const signIn = async (email: string, password: string) => {
  await setPersistence(auth, browserLocalPersistence);
  const userCredential = await signInWithEmailAndPassword(auth, email, password);
  return userCredential;
};

export const logOut = async () => {
  await signOut(auth);
};


export const addItemToInventory = async (uid: string, date: Date, type: string, quantity: number) => {
  const userCollection = collection(db, `users/${uid}/inventory`);

  // Check if an item with the same type already exists
  const q = query(userCollection, where('type', '==', type));
  const querySnapshot = await getDocs(q);

  if (!querySnapshot.empty) {
    // If item exists, update the existing item's quantity
    const existingItemDoc = querySnapshot.docs[0];
    const existingItemData = existingItemDoc.data();
    const newQuantity = existingItemData.quantity + quantity;

    await updateDoc(doc(db, `users/${uid}/inventory/${existingItemDoc.id}`), {
      quantity: newQuantity,
      updatedAt: new Date().toISOString(),
    });

    return;
  }

  // If item does not exist, add new item
  if (!isNaN(date.getTime())) {  // Check if date is valid
    await addDoc(userCollection, {
      date: date.toISOString(),
      type,
      quantity
    });
  } else {
    throw new Error('Invalid date value');
  }
};


export const removeItemFromInventory = async (uid: string, itemId: string) => {
  const itemDoc = doc(db, `users/${uid}/inventory/${itemId}`);
  await deleteDoc(itemDoc);
};

export const editItemInInventory = async (uid: string, itemId: string, newType: string, newQuantity: number) => {
  const itemDoc = doc(db, `users/${uid}/inventory/${itemId}`);
  await updateDoc(itemDoc, {
    type: newType,
    quantity: newQuantity,
    updatedAt: new Date().toISOString()
  });
};

export const getUserInventory = async (uid: string): Promise<InventoryItem[]> => {
  const userCollection = collection(db, `users/${uid}/inventory`);
  const q = query(userCollection);
  const querySnapshot = await getDocs(q);
  const items = querySnapshot.docs.map(doc => ({
    itemId: doc.id,
    date: doc.data().date,
    type: doc.data().type,
    quantity: doc.data().quantity,
  })) as InventoryItem[];
  return items;
};

export { auth, db };

