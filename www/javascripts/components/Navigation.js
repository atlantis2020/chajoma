'use strict';

import React from 'react';
// import Dropdown from 'react-dropdown';

class Dropdown extends React.Component {
  // displayName: 'Dropdown'

  constructor(props) {
    super(props);

    this.state = {
      selected: props.value || { label: 'Select ', value: '' },
      isOpen: false
    }
    this.mounted = true;
  }

  componentWillReceiveProps(newProps) {
    if (newProps.value && newProps.value !== this.state.selected) {
      this.setState({selected: newProps.value});
    }
  }

  componentDidMount() {
    document.addEventListener('click', this.handleDocumentClick.bind(this), false);
  }

  componentWillUnmount() {
    this.mounted = false;
    document.removeEventListener('click', this.handleDocumentClick.bind(this), false);
  }

  handleMouseDown(event) {

    if (event.type == 'mousedown' && event.button !== 0) return;
    event.stopPropagation();
    event.preventDefault();

    this.setState({
      isOpen: !this.state.isOpen
    });
  }

  setValue(option) {
    let newState = {
      selected: option,
      isOpen: false
    };

    this.fireChangeEvent(newState);
    this.setState(newState);
  }

  fireChangeEvent(newState) {
    if (newState.selected !== this.state.selected && this.props.onChange) {
        this.props.onChange(newState.selected);
    }
  }

  renderOption (option) {
    return <li><a key={option.value} onMouseDown={this.setValue.bind(this, option)} onClick={this.setValue.bind(this, option)}>{option.label}</a></li>
  }

  buildMenu() {
    let ops = this.props.options.map((option) => {
        return this.renderOption(option);
    })

    return ops;
  }

  handleDocumentClick(event) {
    if(this.mounted) {
      if (!React.findDOMNode(this).contains(event.target)) {
        this.setState({isOpen:false});
      }
    }
  }

  render() {
    let value = this.state.selected.label;
    let menu = this.state.isOpen ? <div className="mui-dropdown-menu">{this.buildMenu()}</div> : null;

    return (
      <div className="mui-dropdown" onMouseDown={this.handleMouseDown.bind(this)} onTouchEnd={this.handleMouseDown.bind(this)} >
        <button className="mui-btn mui-btn-primary" data-mui-toggle="dropdown">
            {value}
            <span className="mui-caret"></span>
        </button>
        {menu}
      </div>
    );
  }
}

class Navigation extends React.Component {
  constructor(...props) {
    super(...props);
  }

  _onSelect(option) {
    console.log('You selected ', option.label)
    this.setState({selected: option})
  }

  render() {
    const options = [
      { value: 'one', label: 'One' },
      { value: 'two', label: 'Two' },
    ]

    return (
      <Dropdown options={options} onChange={this._onSelect.bind(this)} />
    )
  }
}

export default Navigation;
