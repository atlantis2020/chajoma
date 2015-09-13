'use strict';

import React from 'react';

class Dropdown extends React.Component {
  displayName: 'Dropdown'

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
    return (<li key={option.value}>
      <a onMouseDown={this.setValue.bind(this, option)} onClick={this.setValue.bind(this, option)}>{option.label}</a>
    </li>);
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
// onMouseDown={this.handleMouseDown.bind(this)} onTouchEnd={this.handleMouseDown.bind(this)}
  render() {
    let value = (<span>{this.state.selected.label} <span className="mui-caret"></span></span>);
    let menu = (<div className="mui-dropdown-menu" onMouseDown={this.handleMouseDown.bind(this)} onTouchEnd={this.handleMouseDown.bind(this)} >{this.buildMenu()}</div>);

    return (
      <div className="mui-dropdown" >
        <button className="mui-btn mui-btn-primary" data-mui-toggle="dropdown" >
          {value}
        </button>
        {menu}
      </div>
    );
  }
}

export default Dropdown;

