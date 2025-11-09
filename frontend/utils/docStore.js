import { create } from 'zustand'

export const useDocStore = create((set) => ({
  docs: [],
  loading: true,
  setDocs: (docs) => set({ docs, loading: false }),
  addDoc: (doc) => set((state) => ({ docs: [doc, ...state.docs] })),
  setLoading: (loading) => set({ loading }),
}))
