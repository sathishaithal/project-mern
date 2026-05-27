import React from 'react';
import Select from 'react-select';
import { CheckOption } from './salesSelectUtils';
import { useSalesFilterStore } from '../../../../store/salesFilterStore';
import { useColorMode } from '../../../../theme/ThemeContext';
import { useSalesSelectStyles } from './useSalesSelectStyles';

const CompanySelector = ({ mode = 'monthwise' }) => {
  const {
    monthwisecompany, setMonthwiseCompany, monthwisedisttype,
    daywisecompany, setDaywiseCompany, daywisedisttype,
  } = useSalesFilterStore();
  const { isDarkMode, selectedAccent } = useColorMode();
  const accent = selectedAccent?.primary || '#2563eb';

  const company  = mode === 'daywise' ? daywisecompany  : monthwisecompany;
  const disttype = mode === 'daywise' ? daywisedisttype : monthwisedisttype;
  const setFn    = mode === 'daywise' ? setDaywiseCompany : setMonthwiseCompany;
  const showBalaji = disttype === 'Distribution';

  const options = [
    { value: 'SBL', label: 'SBL' },
    ...(showBalaji ? [{ value: 'BALAJI', label: 'BALAJI' }] : []),
  ];
  const value = options.find(o => o.value === company) || options[0];

  const selectStyles = useSalesSelectStyles({ minWidth: 90 });

  return (
    <div className="sr-sel-wrap">
      <label className="sr-filter-label" style={{ color: isDarkMode ? '#94a3b8' : accent }}>
        Companys :
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

export default CompanySelector;
