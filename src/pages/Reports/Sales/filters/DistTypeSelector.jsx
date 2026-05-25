import React from 'react';
import Select from 'react-select';
import { CheckOption } from './salesSelectUtils';
import { useSalesFilterStore } from '../../../../store/salesFilterStore';
import { useColorMode } from '../../../../theme/ThemeContext';

const DistTypeSelector = ({ mode = 'monthwise' }) => {
  const {
    monthwisedisttype, setMonthwiseDisttype, monthwisecompany,
    daywisedisttype, setDaywiseDisttype, daywisecompany,
  } = useSalesFilterStore();
  const { isDarkMode, selectedAccent } = useColorMode();
  const accent  = selectedAccent?.primary   || '#2563eb';
  const accent2 = selectedAccent?.secondary || '#1e40af';

  const disttype  = mode === 'daywise' ? daywisedisttype  : monthwisedisttype;
  const company   = mode === 'daywise' ? daywisecompany   : monthwisecompany;
  const setFn     = mode === 'daywise' ? setDaywiseDisttype : setMonthwiseDisttype;
  const showShops = company === 'SBL';

  const options = [
    { value: 'Distribution', label: 'Distribution' },
    ...(showShops ? [{ value: 'Shops', label: 'Shops' }] : []),
  ];
  const value = options.find(o => o.value === disttype) || options[0];

  const selectStyles = {
    control: (base, state) => ({
      ...base,
      minHeight: 34, height: 34,
      fontSize: '0.82rem', fontFamily: "'Manrope', sans-serif",
      borderColor: state.isFocused ? accent : (isDarkMode ? '#334155' : '#cbd5e1'),
      boxShadow: state.isFocused ? `0 0 0 2px ${accent}30` : 'none',
      '&:hover': { borderColor: accent },
      borderRadius: 8, cursor: 'pointer',
      background: isDarkMode ? '#0f172a' : 'white',
      minWidth: 120,
    }),
    valueContainer: (base) => ({ ...base, padding: '0 0.6rem' }),
    indicatorsContainer: (base) => ({ ...base, height: 34 }),
    menuPortal: (base) => ({ ...base, zIndex: 99999 }),
    menu: (base) => ({ ...base, fontSize: '0.82rem', fontFamily: "'Manrope', sans-serif", background: isDarkMode ? '#1e293b' : 'white' }),
    option: (base, state) => ({
      ...base,
      background: state.isSelected ? accent : state.isFocused ? (isDarkMode ? '#334155' : '#eff6ff') : (isDarkMode ? '#1e293b' : 'white'),
      color: state.isSelected ? 'white' : (isDarkMode ? '#e2e8f0' : '#1e293b'),
      cursor: 'pointer',
    }),
    singleValue: (base) => ({ ...base, color: isDarkMode ? '#e2e8f0' : '#1e293b', fontSize: '0.82rem' }),
    input: (base) => ({ ...base, color: isDarkMode ? '#e2e8f0' : '#1e293b' }),
    dropdownIndicator: (base) => ({ ...base, color: accent, padding: '0 6px' }),
    indicatorSeparator: () => ({ display: 'none' }),
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
      <label style={{ fontWeight: 700, fontSize: '0.72rem', color: isDarkMode ? '#94a3b8' : accent, whiteSpace: 'nowrap', letterSpacing: '0.02em' }}>
        Methods :
      </label>
      <Select
        options={options}
        value={value}
        onChange={(sel) => setFn(sel.value)}
        styles={selectStyles}
        isSearchable={false}
        menuPortalTarget={document.body}
        menuPosition="fixed"
        components={{ Option: CheckOption }}
      />
    </div>
  );
};

export default DistTypeSelector;
