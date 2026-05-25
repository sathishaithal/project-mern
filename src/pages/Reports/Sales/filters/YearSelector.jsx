import React from 'react';
import Select from 'react-select';
import { CheckOption } from './salesSelectUtils';
import { useSalesFilterStore, YEAR_OPTIONS } from '../../../../store/salesFilterStore';
import { useColorMode } from '../../../../theme/ThemeContext';

const DAYWISE_YEAR_OPTIONS = Array.from({ length: 8 }, (_, i) => {
  const y = new Date().getFullYear() - i;
  return { value: y, label: String(y) };
});

const YearSelector = ({ mode = 'monthwise' }) => {
  const { multiyear, setMultiyear, daywiseyear, setDaywiseYear } = useSalesFilterStore();
  const { isDarkMode, selectedAccent } = useColorMode();
  const accent  = selectedAccent?.primary   || '#2563eb';
  const accent2 = selectedAccent?.secondary || '#1e40af';

  const labelStyle = {
    fontWeight: 700, fontSize: '0.72rem',
    color: isDarkMode ? '#94a3b8' : accent,
    whiteSpace: 'nowrap', letterSpacing: '0.02em',
  };

  const baseSelectStyles = {
    control: (base, state) => ({
      ...base,
      minHeight: 34, fontSize: '0.82rem', fontFamily: "'Manrope', sans-serif",
      borderColor: state.isFocused ? accent : (isDarkMode ? '#334155' : '#cbd5e1'),
      boxShadow: state.isFocused ? `0 0 0 2px ${accent}30` : 'none',
      '&:hover': { borderColor: accent }, borderRadius: 8, cursor: 'pointer',
      background: isDarkMode ? '#0f172a' : 'white',
    }),
    menuPortal: (base) => ({ ...base, zIndex: 99999 }),
    menu: (base) => ({ ...base, fontSize: '0.82rem', fontFamily: "'Manrope', sans-serif", background: isDarkMode ? '#1e293b' : 'white' }),
    option: (base, state) => ({
      ...base,
      background: state.isSelected ? accent : state.isFocused ? (isDarkMode ? '#334155' : '#eff6ff') : (isDarkMode ? '#1e293b' : 'white'),
      color: state.isSelected ? 'white' : (isDarkMode ? '#e2e8f0' : '#1e293b'),
      cursor: 'pointer',
    }),
    multiValue: (base) => ({ ...base, background: isDarkMode ? '#334155' : '#eff6ff', borderRadius: 6 }),
    multiValueLabel: (base) => ({ ...base, color: accent, fontWeight: 600, fontSize: '0.78rem' }),
    multiValueRemove: (base) => ({ ...base, color: accent, ':hover': { background: isDarkMode ? '#475569' : '#dbeafe', color: accent2 } }),
    placeholder: (base) => ({ ...base, color: '#94a3b8', fontSize: '0.8rem' }),
    singleValue: (base) => ({ ...base, color: isDarkMode ? '#e2e8f0' : '#1e293b' }),
    input: (base) => ({ ...base, color: isDarkMode ? '#e2e8f0' : '#1e293b' }),
    dropdownIndicator: (base) => ({ ...base, color: accent, padding: '0 6px' }),
    indicatorSeparator: () => ({ display: 'none' }),
  };

  if (mode === 'daywise') {
    const dyValue = DAYWISE_YEAR_OPTIONS.find(o => o.value === daywiseyear) || DAYWISE_YEAR_OPTIONS[0];
    return (
      <div style={wrapStyle}>
        <label style={labelStyle}>Year :</label>
        <div style={{ minWidth: 90 }}>
          <Select
            options={DAYWISE_YEAR_OPTIONS}
            value={dyValue}
            onChange={(sel) => setDaywiseYear(sel.value)}
            styles={{ ...baseSelectStyles, control: (base, state) => ({ ...baseSelectStyles.control(base, state), minWidth: 90 }) }}
            isSearchable={false}
            menuPortalTarget={document.body}
            menuPosition="fixed"
            components={{ Option: CheckOption }}
          />
        </div>
      </div>
    );
  }

  const selectStyles = baseSelectStyles;

  const value = YEAR_OPTIONS.filter((o) => multiyear.includes(o.value));

  return (
    <div style={wrapStyle}>
      <label style={labelStyle}>Select Years :</label>
      <div style={{ minWidth: 200 }}>
        <Select
          isMulti
          options={YEAR_OPTIONS}
          value={value}
          onChange={(selected) => {
            const currentFY = YEAR_OPTIONS[0]?.value;
            setMultiyear(selected.length ? selected.map((o) => o.value) : [currentFY]);
          }}
          styles={selectStyles}
          closeMenuOnSelect={false}
          hideSelectedOptions={false}
          placeholder="Select fiscal years…"
          menuPortalTarget={document.body}
          menuPosition="fixed"
          components={{ Option: CheckOption }}
        />
      </div>
    </div>
  );
};

const wrapStyle = { display: 'flex', flexDirection: 'column', gap: '0.25rem' };

export default YearSelector;
