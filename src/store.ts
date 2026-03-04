import { create } from 'zustand';
import { addMonths, isBefore, isAfter } from 'date-fns';
import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  onSnapshot, 
  query, 
  orderBy 
} from 'firebase/firestore';
import { 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged, 
  User 
} from 'firebase/auth';
import { db, auth } from '@/lib/firebase';

export interface Client {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  lat: number;
  lng: number;
  lastMaintenance: string; // ISO string
  periodicity: number; // months
}

interface AppState {
  user: User | null;
  clients: Client[];
  isLoading: boolean;
  error: string | null;
  
  // Auth Actions
  initializeAuth: () => () => void; // Returns unsubscribe
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  
  // Client Actions
  initializeClients: () => () => void; // Returns unsubscribe
  addClient: (client: Omit<Client, 'id'>) => Promise<void>;
  updateClient: (id: string, client: Partial<Client>) => Promise<void>;
  deleteClient: (id: string) => Promise<void>;
  renewMaintenance: (id: string) => Promise<void>;
  
  // Helpers
  getClientStatus: (client: Client) => 'ok' | 'warning' | 'critical';
}

export const useStore = create<AppState>((set, get) => ({
  user: null,
  clients: [],
  isLoading: true,
  error: null,

  initializeAuth: () => {
    if (!auth) {
      set({ error: "Configuração do Firebase ausente. Verifique as variáveis de ambiente.", isLoading: false });
      return () => {};
    }
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      set({ user, isLoading: false });
    });
    return unsubscribe;
  },

  login: async (email, password) => {
    if (!auth) {
      set({ error: "Firebase não configurado." });
      return;
    }
    try {
      set({ isLoading: true, error: null });
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error: any) {
      set({ error: error.message });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  logout: async () => {
    if (!auth) return;
    try {
      await signOut(auth);
      set({ user: null, clients: [] });
    } catch (error: any) {
      console.error('Logout error:', error);
    }
  },

  initializeClients: () => {
    if (!db) {
      set({ error: "Banco de dados não configurado.", isLoading: false });
      return () => {};
    }
    set({ isLoading: true });
    const q = query(collection(db, 'clients'), orderBy('name'));
    
    const unsubscribe = onSnapshot(q, 
      (snapshot) => {
        const clients = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Client[];
        set({ clients, isLoading: false });
      },
      (error) => {
        console.error('Error fetching clients:', error);
        set({ error: 'Erro ao carregar clientes', isLoading: false });
      }
    );
    
    return unsubscribe;
  },

  addClient: async (client) => {
    if (!db) throw new Error("Firebase não configurado");
    try {
      await addDoc(collection(db, 'clients'), client);
    } catch (error) {
      console.error('Error adding client:', error);
      throw error;
    }
  },

  updateClient: async (id, updatedClient) => {
    if (!db) throw new Error("Firebase não configurado");
    try {
      const docRef = doc(db, 'clients', id);
      await updateDoc(docRef, updatedClient);
    } catch (error) {
      console.error('Error updating client:', error);
      throw error;
    }
  },

  deleteClient: async (id) => {
    if (!db) throw new Error("Firebase não configurado");
    try {
      await deleteDoc(doc(db, 'clients', id));
    } catch (error) {
      console.error('Error deleting client:', error);
      throw error;
    }
  },

  renewMaintenance: async (id) => {
    if (!db) throw new Error("Firebase não configurado");
    try {
      const docRef = doc(db, 'clients', id);
      await updateDoc(docRef, {
        lastMaintenance: new Date().toISOString().split('T')[0]
      });
    } catch (error) {
      console.error('Error renewing maintenance:', error);
      throw error;
    }
  },

  getClientStatus: (client) => {
    const nextMaintenance = addMonths(new Date(client.lastMaintenance), client.periodicity);
    const today = new Date();
    
    if (isAfter(today, nextMaintenance)) return 'critical';
    
    // Warning if within 1 month of due date
    const oneMonthBefore = addMonths(nextMaintenance, -1);
    if (isAfter(today, oneMonthBefore)) return 'warning';
    
    return 'ok';
  },
}));
