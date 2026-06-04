import React from 'react';
import Select from 'react-select';
import { CheckOption } from './salesSelectUtils';
import { useSalesFilterStore } from '../../../../store/salesFilterStore';
import { useColorMode } from '../../../../theme/ThemeContext';
import { useSalesSelectStyles } from './useSalesSelectStyles';

const ASM_SOFF_TABS = ['asm', 'soff'];

const DistTypeSelector = ({ mode = 'monthwise', activeReportTab = '' }) => {
  const {
    monthwisedisttype, setMonthwiseDisttype, monthwisecompany,
    daywisedisttype, setDaywiseDisttype, daywisecompany,
  } = useSalesFilterStore();
  const { isDarkMode, selectedAccent } = useColorMode();
  const accent = selectedAccent?.primary || '#2563eb';

  const disttype  = mode === 'daywise' ? daywisedisttype  : monthwisedisttype;
  const company   = mode === 'daywise' ? daywisecompany   : monthwisecompany;
  const setFn     = mode === 'daywise' ? setDaywiseDisttype : setMonthwiseDisttype;
  const showShops = company === 'SBL';

  const options = [
    { value: 'Distribution', label: 'Distribution' },
    ...(showShops && !ASM_SOFF_TABS.includes(activeReportTab) ? [{ value: 'Shops', label: 'Shops' }] : []),
  ];
  const value = options.find(o => o.value === disttype) || options[0];

  const selectStyles = useSalesSelectStyles({ minWidth: 120 });

  return (
    <div className="sr-sel-wrap">
      <label className="sr-filter-label" style={{ color: isDarkMode ? '#94a3b8' : accent }}>
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
