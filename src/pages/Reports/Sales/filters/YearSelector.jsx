import React from 'react';
import Select from 'react-select';
import { CheckOption } from './salesSelectUtils';
import { useSalesFilterStore, YEAR_OPTIONS } from '../../../../store/salesFilterStore';
import { useColorMode } from '../../../../theme/ThemeContext';
import { useSalesSelectStyles } from './useSalesSelectStyles';

const DAYWISE_YEAR_OPTIONS = Array.from({ length: 8 }, (_, i) => {
  const y = new Date().getFullYear() - i;
  return { value: y, label: String(y) };
});

const YearSelector = ({ mode = 'monthwise' }) => {
  const { multiyear, setMultiyear, daywiseyear, setDaywiseYear } = useSalesFilterStore();
  const { isDarkMode, selectedAccent } = useColorMode();
  const accent = selectedAccent?.primary || '#2563eb';

  const daywiseStyles   = useSalesSelectStyles({ minWidth: 90 });
  const monthwiseStyles = useSalesSelectStyles();

  if (mode === 'daywise') {
    const dyValue = DAYWISE_YEAR_OPTIONS.find(o => o.value === daywiseyear) || DAYWISE_YEAR_OPTIONS[0];
    return (
      <div className="sr-sel-wrap">
        <label className="sr-filter-label" style={{ color: isDarkMode ? '#94a3b8' : accent }}>Year :</label>
        <div className="sr-sel-narrow">
          <Select
            options={DAYWISE_YEAR_OPTIONS}
            value={dyValue}
            onChange={(sel) => setDaywiseYear(sel.value)}
            styles={daywiseStyles}
            isSearchable={false}
            menuPortalTarget={document.body}
            menuPosition="fixed"
            components={{ Option: CheckOption }}
          />
        </div>
      </div>
    );
  }

  const selectStyles = monthwiseStyles;

  const value = YEAR_OPTIONS.filter((o) => multiyear.includes(o.value));

  return (
    <div className="sr-sel-wrap">
      <label className="sr-filter-label" style={{ color: isDarkMode ? '#94a3b8' : accent }}>Select Years :</label>
      <div className="sr-sel-wide">
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

export default YearSelector;
