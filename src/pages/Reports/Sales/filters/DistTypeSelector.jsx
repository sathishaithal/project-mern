import React from 'react';
import Select from 'react-select';
import { CheckOption } from './salesSelectUtils';
import { useSalesFilterStore } from '../../../../store/salesFilterStore';
import { useColorMode } from '../../../../theme/ThemeContext';
import { useSalesSelectStyles } from './useSalesSelectStyles';

const ASM_SOFF_TABS = ['asm', 'soff'];
// Both Month Wise and Day Wise use loggedInRolex with truthy check — mirrors Angular HTML *ngIf lines 663 + 195
const SHOPS_BLOCKED_ROLES = ['Distributor', 'Sales Man', 'Sales Executive', 'Asst, Manager Sales'];

const DistTypeSelector = ({ mode = 'monthwise', activeReportTab = '', loggedInRole = null, loggedInRolex = null }) => {
  const {
    monthwisedisttype, setMonthwiseDisttype, monthwisecompany,
    daywisedisttype, setDaywiseDisttype, daywisecompany,
  } = useSalesFilterStore();
  const { isDarkMode, selectedAccent } = useColorMode();
  const accent = selectedAccent?.primary || '#2563eb';

  const disttype  = mode === 'daywise' ? daywisedisttype  : monthwisedisttype;
  const company   = mode === 'daywise' ? daywisecompany   : monthwisecompany;
  const setFn     = mode === 'daywise' ? setDaywiseDisttype : setMonthwiseDisttype;

  // Angular HTML: loggedInRolex must be truthy AND not in blocked list (same condition for both tabs)
  const showShops = company === 'SBL' && !!loggedInRolex && !SHOPS_BLOCKED_ROLES.includes(loggedInRolex);

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
