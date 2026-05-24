import { create } from 'zustand'

export const useChainStore = create((set) => ({
  result:     null,
  isLoading:  false,
  error:      null,
  cityStates: [],   // snapshot of all 4 cities at analysis time

  setResult:     (result)     => set({ result, isLoading: false, error: null }),
  setLoading:    (v)          => set({ isLoading: v }),
  setError:      (e)          => set({ error: e, isLoading: false }),
  setCityStates: (cityStates) => set({ cityStates }),
  reset:         ()           => set({ result: null, error: null, cityStates: [] }),
}))
