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
