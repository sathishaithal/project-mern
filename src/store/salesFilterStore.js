import { create } from 'zustand';

const currentYear = new Date().getFullYear();
const currentMonth = new Date().getMonth() + 1;

export const useSalesFilterStore = create((set) => ({
  multiyear: [String(currentYear)],
  monthwisecompany: 'SBL',
  monthwisedisttype: 'Distribution',

  setMultiyear: (years) => set({ multiyear: years }),
  setMonthwiseCompany: (company) => set((s) => ({
    monthwisecompany: company,
    monthwisedisttype: company !== 'SBL' && s.monthwisedisttype === 'Shops'
      ? 'Distribution'
      : s.monthwisedisttype,
  })),
  setMonthwiseDisttype: (disttype) => set((s) => ({
    monthwisedisttype: disttype,
    monthwisecompany: disttype === 'Shops' && s.monthwisecompany !== 'SBL'
      ? 'SBL'
      : s.monthwisecompany,
  })),

  daywiseyear: currentYear,
  daywisemonth: currentMonth,
  daywisecompany: 'SBL',
  daywisedisttype: 'Distribution',

  setDaywiseYear: (year) => set({ daywiseyear: year }),
  setDaywiseMonth: (month) => set({ daywisemonth: month }),
  setDaywiseCompany: (company) => set((s) => ({
    daywisecompany: company,
    daywisedisttype: company !== 'SBL' && s.daywisedisttype === 'Shops'
      ? 'Distribution'
      : s.daywisedisttype,
  })),
  setDaywiseDisttype: (disttype) => set({ daywisedisttype: disttype }),
}));

export const YEAR_OPTIONS = Array.from(
  { length: currentYear - 2017 + 1 },
  (_, i) => {
    const calYear = currentYear - i;
    return { value: String(calYear), label: String(calYear) };
  },
);

export const MONTH_OPTIONS = [
  { value: 1, label: 'Jan' }, { value: 2, label: 'Feb' }, { value: 3, label: 'Mar' },
  { value: 4, label: 'Apr' }, { value: 5, label: 'May' }, { value: 6, label: 'Jun' },
  { value: 7, label: 'Jul' }, { value: 8, label: 'Aug' }, { value: 9, label: 'Sep' },
  { value: 10, label: 'Oct' }, { value: 11, label: 'Nov' }, { value: 12, label: 'Dec' },
];
