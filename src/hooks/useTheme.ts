// Hook para gerenciar tema claro/escuro

import { useState, useEffect, useCallback } from 'react';

type Tema = 'claro' | 'escuro';

export function useTheme(temaInicial: Tema = 'escuro') {
  const [tema, setTemaState] = useState<Tema>(() => {
    const salvo = localStorage.getItem('estoque-sync-tema') as Tema | null;
    return salvo ?? temaInicial;
  });

  useEffect(() => {
    const root = document.documentElement;
    if (tema === 'escuro') {
      root.classList.add('dark');
      root.style.setProperty('--color-bg', '#0a0a0a');
      root.style.setProperty('--color-surface', '#141414');
      root.style.setProperty('--color-card', '#1c1c1c');
    } else {
      root.classList.remove('dark');
      root.style.setProperty('--color-bg', '#f4f4f5');
      root.style.setProperty('--color-surface', '#ffffff');
      root.style.setProperty('--color-card', '#f8f8f8');
    }
  }, [tema]);

  const alternarTema = useCallback(() => {
    setTemaState(t => {
      const novo = t === 'escuro' ? 'claro' : 'escuro';
      localStorage.setItem('estoque-sync-tema', novo);
      return novo;
    });
  }, []);

  const setTema = useCallback((t: Tema) => {
    setTemaState(t);
    localStorage.setItem('estoque-sync-tema', t);
  }, []);

  return { tema, alternarTema, setTema };
}
