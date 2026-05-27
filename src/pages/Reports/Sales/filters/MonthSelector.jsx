import React from 'react';
import Select from 'react-select';
import { useSalesFilterStore, MONTH_OPTIONS } from '../../../../store/salesFilterStore';
import { useColorMode } from '../../../../theme/ThemeContext';
import { useSalesSelectStyles } from './useSalesSelectStyles';

const MonthSelector = () => {
  const { daywisemonth, setDaywiseMonth } = useSalesFilterStore();
  const { isDarkMode, selectedAccent } = useColorMode();
  const accent = selectedAccent?.primary || '#2563eb';

  const value = MONTH_OPTIONS.find(o => o.value === daywisemonth) || MONTH_OPTIONS[0];

  const selectStyles = useSalesSelectStyles({ minWidth: 90 });

  return (
    <div className="sr-sel-wrap">
      <label className="sr-filter-label">
        Month :
      </label>
      <Select
        options={MONTH_OPTIONS}
        value={value}
        onChange={(sel) => setDaywiseMonth(sel.value)}
        styles={selectStyles}
        isSearchable={false}
        menuPortalTarget={document.body}
        menuPosition="fixed"
      />
    </div>
  );
};

export default MonthSelector;
