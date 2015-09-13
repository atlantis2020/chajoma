'use strict';

import React from 'react';
import Dropdown from './Dropdown';

const options = [
  { value: 'map', label: 'Map' },
  { value: 'realtime', label: 'Realtime' },
  { value: 'planning', label: 'Planning' }
];

class Navigation extends React.Component {
  constructor(...props) {
    super(...props);

    this.state = {
        selected: options[0]
    }
  }

  _onSelect(option) {
    this.setState({ selected: option });
    window.views[option.value]();
  }

  render() {
    let defaultOption = this.state.selected;

    window.views[defaultOption.value]();

    return (
      <Dropdown options={options} onChange={this._onSelect.bind(this)} value={defaultOption} />
    )
  }
}

export default Navigation;
