import { create } from 'zustand'

export const useChainStore = create((set) => ({
  result:      null,
  isLoading:   false,
  error:       null,
  cityStates:  [],
  chainEvents: [],   // raw events array sent to /simulate/chain
  lastRequest: null, // { events, duration_months } — stored for re-analysis

  setResult:      (result)      => set({ result, isLoading: false, error: null }),
  setLoading:     (v)           => set({ isLoading: v }),
  setError:       (e)           => set({ error: e, isLoading: false }),
  setCityStates:  (cityStates)  => set({ cityStates }),
  setChainEvents: (chainEvents) => set({ chainEvents }),
  setLastRequest: (lastRequest) => set({ lastRequest }),
  reset:          ()            => set({ result: null, error: null, cityStates: [], chainEvents: [] }),
}))
