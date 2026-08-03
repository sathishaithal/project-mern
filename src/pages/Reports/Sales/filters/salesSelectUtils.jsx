import React from 'react';
import { components as ReactSelectComponents } from 'react-select';
import '../Sales.css';

export const CheckOption = (props) => (
  <ReactSelectComponents.Option {...props}>
    <div className="sr-check-option">
      <span>{props.children}</span>
      {props.isSelected && <i className="bi bi-check2 sr-check-icon" />}
    </div>
  </ReactSelectComponents.Option>
);

// Caps rendered chips at MAX_VISIBLE_CHIPS so a multi-select's control height stays
// fixed no matter how many options are selected — beyond that, collapses into a
// single "+N more" chip instead of wrapping onto more lines (which caused a
// layout-jump/menu-jitter glitch, especially noticeable on narrow/mobile widths).
export const MAX_VISIBLE_CHIPS = 2;

export const CappedMultiValue = (props) => {
  const { index, getValue } = props;
  if (index < MAX_VISIBLE_CHIPS) return <ReactSelectComponents.MultiValue {...props} />;
  if (index > MAX_VISIBLE_CHIPS) return null;
  const overflowCount = getValue().length - MAX_VISIBLE_CHIPS;
  return <div className="sr-multivalue-more">+{overflowCount} more</div>;
};

// Extends a react-select styles object so the value container never wraps onto a
// second line — pairs with CappedMultiValue to keep the control's height constant.
// `container` also gets minWidth:0/maxWidth:100% because react-select's outer div is
// a flex item whose default min-width:auto lets long chip text (e.g. a full
// distributor name) grow the whole control past its allotted space — with no bound to
// shrink to, valueContainer's overflow:hidden has nothing to actually clip against,
// so the control (and the page) overflows horizontally on narrow screens.
export const withNoWrapValueContainer = (styles = {}) => ({
  ...styles,
  container: (base, state) => ({
    ...(styles.container ? styles.container(base, state) : base),
    minWidth: 0,
    maxWidth: '100%',
  }),
  valueContainer: (base, state) => ({
    ...(styles.valueContainer ? styles.valueContainer(base, state) : base),
    flexWrap: 'nowrap',
    overflow: 'hidden',
  }),
});
