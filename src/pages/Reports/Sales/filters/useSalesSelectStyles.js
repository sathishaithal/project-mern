import { useMemo } from 'react';
import { useColorMode } from '../../../../theme/ThemeContext';

export function useSalesSelectStyles(opts = {}) {
  const { isDarkMode, selectedAccent } = useColorMode();
  const accent = selectedAccent?.primary || '#1a237e';

  const {
    minHeight = 34,
    height    = 34,
    fontSize  = '0.82rem',
    borderRadius = 8,
    minWidth,
  } = opts;

  return useMemo(() => ({
    control: (base, state) => ({
      ...base,
      minHeight, height, fontSize,
      fontFamily: "'Manrope', sans-serif",
      borderColor: state.isFocused ? accent : (isDarkMode ? '#334155' : '#cbd5e1'),
      boxShadow: state.isFocused ? `0 0 0 2px ${accent}30` : 'none',
      '&:hover': { borderColor: accent },
      borderRadius, cursor: 'pointer',
      background: isDarkMode ? '#0f172a' : 'white',
      ...(minWidth != null ? { minWidth } : {}),
    }),
    valueContainer: (base) => ({ ...base, padding: '0 0.6rem' }),
    indicatorsContainer: (base) => ({ ...base, height }),
    menuPortal: (base) => ({ ...base, zIndex: 99999 }),
    menu: (base) => ({
      ...base, fontSize, fontFamily: "'Manrope', sans-serif",
      background: isDarkMode ? '#1e293b' : 'white',
    }),
    option: (base, state) => ({
      ...base,
      background: state.isSelected
        ? accent
        : state.isFocused
        ? (isDarkMode ? '#334155' : `${accent}18`)
        : (isDarkMode ? '#1e293b' : 'white'),
      color: state.isSelected ? 'white' : (isDarkMode ? '#e2e8f0' : '#1e293b'),
      cursor: 'pointer',
    }),
    singleValue: (base) => ({ ...base, color: isDarkMode ? '#e2e8f0' : '#1e293b', fontSize }),
    multiValue: (base) => ({
      ...base,
      background: `${accent}20`,
      borderRadius: 5,
    }),
    multiValueLabel: (base) => ({
      ...base,
      color: isDarkMode ? '#e2e8f0' : accent,
      fontWeight: 600,
      fontSize: '0.75rem',
    }),
    multiValueRemove: (base) => ({
      ...base,
      color: accent,
      '&:hover': { background: accent, color: 'white' },
    }),
    input: (base) => ({ ...base, color: isDarkMode ? '#e2e8f0' : '#1e293b' }),
    placeholder: (base) => ({ ...base, color: '#94a3b8', fontSize: '0.8rem' }),
    dropdownIndicator: (base) => ({ ...base, color: accent, padding: '0 6px' }),
    clearIndicator: (base) => ({ ...base, color: accent }),
    indicatorSeparator: () => ({ display: 'none' }),
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [accent, isDarkMode, minHeight, height, fontSize, borderRadius, minWidth]);
}
