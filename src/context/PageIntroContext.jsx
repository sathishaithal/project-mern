import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { AnimatePresence } from 'framer-motion';
import ZoomFromBlack from '../components/ui/ZoomFromBlack';

const PageIntroContext = createContext(null);

const isPageRefresh = () => {
  try {
    return performance.getEntriesByType('navigation')[0]?.type === 'reload';
  } catch {
    return performance?.navigation?.type === 1;
  }
};

function resolveInitialIntro() {
  const isLogout  = !!sessionStorage.getItem('logoutMessage');
  const isRefresh = isPageRefresh();

  if (isLogout)  { sessionStorage.removeItem('logoutMessage'); return { active: true, holdMs: 1200 }; }
  if (isRefresh) {                                              return { active: true, holdMs: 1100 }; }
  return { active: false, holdMs: 0 };
}

export function PageIntroProvider({ children }) {
  const [intro, setIntro] = useState(resolveInitialIntro);
  const timerRef = useRef(null);

  useEffect(() => {
    if (!intro.active) return;
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setIntro({ active: false, holdMs: 0 }), intro.holdMs + 900);
    return () => clearTimeout(timerRef.current);
  }, [intro.active, intro.holdMs]);

  // Call this from anywhere to trigger the animation (e.g. Sync button)
  const triggerIntro = useCallback((holdMs = 1400) => {
    clearTimeout(timerRef.current);
    setIntro({ active: true, holdMs });
  }, []);

  return (
    <PageIntroContext.Provider value={{ triggerIntro }}>
      {children}
      <AnimatePresence>
        {intro.active && <ZoomFromBlack key={intro.holdMs + '-' + intro.active} holdMs={intro.holdMs} />}
      </AnimatePresence>
    </PageIntroContext.Provider>
  );
}

export const usePageIntro = () => useContext(PageIntroContext);
