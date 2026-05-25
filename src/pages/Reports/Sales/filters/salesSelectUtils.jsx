import React from 'react';
import { components as ReactSelectComponents } from 'react-select';

export const CheckOption = (props) => (
  <ReactSelectComponents.Option {...props}>
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 4 }}>
      <span>{props.children}</span>
      {props.isSelected && <i className="bi bi-check2" style={{ fontSize: '0.9rem', flexShrink: 0 }} />}
    </div>
  </ReactSelectComponents.Option>
);
