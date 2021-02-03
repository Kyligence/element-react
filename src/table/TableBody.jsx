// @flow
import React from 'react';
import Popper from 'popper.js';
import classnames from 'classnames';
import { Component, PropTypes, Transition, View, MountBody } from '../../libs';
import { getRowIdentity, getValueByPath } from "./utils";
// import {toDate} from "../date-picker/utils/index";

import Checkbox from '../checkbox';
import Radio from '../radio';
import OverflowTooltip from '../OverflowTooltip/OverflowTooltip';

import type {_Column, TableBodyProps} from "./Types";

class Tooltip extends Component {
  static propTypes = {
    children: PropTypes.node,
    onEnter: PropTypes.func,
    popperClass: PropTypes.string,
  };

  state = {
    isShow: false,
  };

  contentRef = React.createRef();

  toggleTooltip = (isShow, callback) => {
    this.setState({ isShow }, callback);
  };

  render() {
    const { children, onEnter, popperClass } = this.props;
    const { isShow } = this.state;

    return (
      <MountBody>
        <Transition name="fade-in-linear" onEnter={onEnter}>
          <View show={isShow}>
            <div ref={this.contentRef} className={this.classNames('el-tooltip__popper', 'is-dark', popperClass)}>
              {children}
              <div className="popper__arrow" x-arrow="" />
            </div>
          </View>
        </Transition>
      </MountBody>
    );
  }
}

export default class TableBody extends Component<TableBodyProps> {
  static contextTypes = {
    tableStore: PropTypes.any,
    layout: PropTypes.any,
  };

  rowRefs = [];
  poppers = [];

  constructor(props: TableBodyProps) {
    super(props);
    ['handleMouseLeave'].forEach((fn) => {
      this[fn] = this[fn].bind(this);
    });
  }

  componentDidMount() {
    const { rowTooltip } = this.props;

    if (rowTooltip && rowTooltip.content) {
      this.generateTooltip();
    }
  }

  componentDidUpdate() {
    const { rowTooltip } = this.props;

    if (rowTooltip && rowTooltip.content) {
      this.generateTooltip();
    }
  }

  generateTooltip = () => {
    const { tableStoreState, rowTooltip: { placement } } = this.props;

    for (const popper of this.poppers) {
      popper.destroy();
    }

    const tooltipOptions = {
      placement,
      modifiers: {
        computeStyle: {
          gpuAcceleration: false
        },
        preventOverflow: {
          boundariesElement: 'window',
        }
      }
    };

    this.poppers = tableStoreState.data.map((row, index) => {
      const { rowRef, tooltipRef } = this.rowRefs[index];
      return new Popper(rowRef.current, tooltipRef.current.contentRef.current, tooltipOptions);
    });
  };

  handleShowTooltip = (event: any, index: number) => {
    if (event.target.tagName === 'TD' && event.currentTarget.tagName === 'TR') {
      const { tooltipRef } = this.rowRefs[index];
      if (tooltipRef.current) {
        tooltipRef.current.toggleTooltip(true);
      }
    }
  };

  handleHideTooltip = () => {
    for (const { tooltipRef } of this.rowRefs) {
      if (tooltipRef.current) {
        tooltipRef.current.toggleTooltip(false);
      }
    }
  };

  handleTooltipEnter = () => {
    for (const popper of this.poppers) {
      popper.update();
    }
  };

  handleMouseEnter = (event: any, index: number, canShowTooltip: boolean) => {
    this.context.tableStore.setHoverRow(index);

    if (canShowTooltip) {
      this.handleShowTooltip(event, index);
    }
  };

  handleMouseLeave = () => {
    this.context.tableStore.setHoverRow(null);
    this.handleHideTooltip();
  };

  handleCellMouseEnter(row: Object, column: _Column, event: SyntheticEvent<HTMLTableCellElement>) {
    this.dispatchEvent('onCellMouseEnter', row, column, event.currentTarget, event)
  }

  handleCellMouseLeave(row: Object, column: _Column, event: SyntheticEvent<HTMLTableCellElement>) {
    this.dispatchEvent('onCellMouseLeave', row, column, event.currentTarget, event)
  }

  handleCellClick(row: Object, column: _Column, event: SyntheticEvent<HTMLTableCellElement>) {
    this.dispatchEvent('onCellClick', row, column, event.currentTarget, event)
    this.dispatchEvent('onRowClick', row, event, column);
  }

  handleCellDbClick(row: Object, column: _Column, event: SyntheticEvent<HTMLTableCellElement>) {
    this.dispatchEvent('onCellDbClick', row, column, event.currentTarget, event)
    this.dispatchEvent('onRowDbClick', row, column)
  }

  handleRowContextMenu(row: Object, event: SyntheticEvent<HTMLTableRowElement>) {
    this.dispatchEvent('onRowContextMenu', row, event)
  }

  dispatchEvent(name: string, ...args: Array<any>) {
    const fn = this.props[name];
    fn && fn(...args);
  }

  isColumnHidden(index: number): boolean {
    const { tableStoreState, layout, ...props } = this.props;
    if (props.fixed === true || props.fixed === 'left') {
      return index >= this.leftFixedCount;
    } else if (props.fixed === 'right') {
      return index < this.columnsCount - this.rightFixedCount;
    } else {
      return (index < this.leftFixedCount) || (index >= this.columnsCount - this.rightFixedCount);
    }
  }

  getRowStyle(row: Object, index: number): Object {
    const { rowStyle } = this.props;
    if (typeof rowStyle === 'function') {
      return rowStyle.call(null, row, index);
    }

    return rowStyle;
  }

  getKeyOfRow(row: Object, index: number): number | string {
    const { rowKey } = this.props;
    if (rowKey) {
      return getRowIdentity(row, rowKey);
    }

    return index;
  }

  // getRowClass(row, index) {
  //   const { rowClassName, stripe } = this.props;
  //
  // }

  get columnsCount(): number {
    return this.props.tableStoreState.columns.length;
  }

  get leftFixedCount(): number {
    return this.props.tableStoreState.fixedColumns.length;
  }

  get rightFixedCount(): number {
    return this.props.tableStoreState.rightFixedColumns.length;
  }

  isSelectableRow(row: Object, index: number) {
    const { tableStoreState } = this.props;
    const selectableColumn = tableStoreState.columns.find(column => ['radio', 'selection'].includes(column.type));

    return selectableColumn
      ? selectableColumn.selectable ? selectableColumn.selectable(row, index) : true
      : true;
  }

  handleExpandClick(row: Object, rowKey: string | number) {
    this.context.tableStore.toggleRowExpanded(row, rowKey);
  }

  handleClick(row: Object, index: number) {
    const { tableStoreState } = this.props;
    const { tableStore } = this.context;
    const radioColumn = tableStoreState.columns.find(column => column.type === 'radio');

    if (radioColumn && radioColumn.selectable) {
      if (radioColumn.selectable(row, index)) {
        tableStore.setCurrentRow(row);
      }
    } else {
      tableStore.setCurrentRow(row);
    }
  }

  renderCell(row: Object, column: _Column, index: number, rowKey: string | number): React.DOM {
    const { showOverflowTooltip } = this.props;
    const { type, selectable } = column;
    if (type === 'expand') {
      return (
        <div
          className={this.classNames('el-table__expand-icon ', {
            'el-table__expand-icon--expanded': this.context.tableStore.isRowExpanding(row, rowKey)
          })}
          onClick={this.handleExpandClick.bind(this, row, rowKey)}
        >
          <i className="el-icon el-icon-arrow-right" />
        </div>
      )
    }

    if (type === 'index') {
      return <div>{index + 1}</div>;
    }

    if (type === 'selection') {
      const isSelected = this.context.tableStore.isRowSelected(row, rowKey);
      const isDisabled = (selectable && !selectable(row, index)) || this.props.disabled;
      const handleToggleRowSelection = () => this.context.tableStore.toggleRowSelection(row, !isSelected);

      const renderData = { isSelected, handleToggleRowSelection, isDisabled };
      const rendered = column.render(row, column, index, renderData);

      return !rendered ? (
        <Checkbox
          checked={isSelected}
          disabled={isDisabled}
          onChange={handleToggleRowSelection}
        />
      ) : rendered;
    }

    if (type === 'radio') {
      const isSelected = this.props.highlightCurrentRow
        && this.context.tableStore.isCurrentRow(row, rowKey);
      const isDisabled = (selectable && !selectable(row, index)) || this.props.disabled;

      const renderData = { isSelected, isDisabled };
      const rendered = column.render(row, column, index, renderData);

      return !rendered ? (
        <Radio
          disabled={isDisabled}
          checked={isSelected}
          value=""
        />
      ) : rendered;
    }

    const popperProps = {
      modifiers: {
        flip: { enabled: false },
        hide: { enabled: false },
        preventOverflow: { enabled: false },
      },
    };

    return showOverflowTooltip ? (
      <OverflowTooltip popperProps={popperProps} content={getValueByPath(row, column.property)}>
        <span>{column.render(row, column, index)}</span>
      </OverflowTooltip>
    ) : column.render(row, column, index);
  }

  render() {
    const { tableStoreState, layout, showOverflowTooltip, ...props } = this.props;
    const columnsHidden = tableStoreState.columns.map((column, index) => this.isColumnHidden(index));
    this.rowRefs = tableStoreState.data.map(() => ({
      rowRef: React.createRef(),
      tooltipRef: React.createRef(),
    }));
    return (
      <table
        className="el-table__body"
        cellPadding={0}
        cellSpacing={0}
        style={this.style({
          borderSpacing: 0,
          border: 0
        })}
      >
        <colgroup>
          {tableStoreState.columns.map((column, index) => (
            <col width={column.realWidth} style={{ width: column.realWidth }} key={index} />
          ))}
        </colgroup>
        <tbody>
          {tableStoreState.data.map((row, rowIndex) => {
            const rowKey = this.getKeyOfRow(row, rowIndex);
            const isCurrentRow = this.context.tableStore.isCurrentRow(row, rowKey);
            const { rowRef, tooltipRef } = this.rowRefs[rowIndex];

            let tooltipContent = null;
            if (props.rowTooltip && props.rowTooltip.content) {
              tooltipContent = typeof props.rowTooltip.content === 'function'
                ? props.rowTooltip.content(row, rowIndex)
                : props.rowTooltip.content;
            }

            return [(
              <tr
                ref={rowRef}
                key={rowKey}
                style={this.getRowStyle(row, rowIndex)}
                className={this.className('el-table__row', {
                  'el-table__row--striped': props.stripe && rowIndex % 2 === 1,
                  'hover-row': tableStoreState.hoverRow === rowIndex,
                  'current-row': props.highlightCurrentRow && isCurrentRow,
                  'not-selectable': !this.isSelectableRow(row, rowIndex)
                }, typeof props.rowClassName === 'string'
                  ? props.rowClassName
                  : typeof props.rowClassName === 'function'
                  && props.rowClassName(row, rowIndex))}
                onMouseEnter={e => this.handleMouseEnter(e, rowIndex, !!tooltipContent)}
                onMouseLeave={this.handleMouseLeave}
                onClick={this.handleClick.bind(this, row, rowIndex)}
                onContextMenu={this.handleRowContextMenu.bind(this, row)}
              >
                {tableStoreState.columns.map((column, cellIndex) => (
                  <td
                    key={cellIndex}
                    className={this.classNames(column.className, column.bodyClassName, column.align, column.columnKey, {
                      'is-hidden': columnsHidden[cellIndex]
                    })}
                    onMouseEnter={this.handleCellMouseEnter.bind(this, row, column)}
                    onMouseLeave={this.handleCellMouseLeave.bind(this, row, column)}
                    onClick={this.handleCellClick.bind(this, row, column)}
                    onDoubleClick={this.handleCellDbClick.bind(this, row, column)}
                  >
                    <div className={classnames('cell', 'overflow-tooltip')}>
                      {this.renderCell(row, column, rowIndex, rowKey)}
                    </div>
                  </td>
                ))}
                {!props.fixed && layout.scrollY && !!layout.gutterWidth && (
                  <td className="gutter" />
                )}
                {props.rowTooltip && props.rowTooltip.content ? (
                  <Tooltip ref={tooltipRef} popperClass={props.rowTooltip.popperClass} onEnter={this.handleTooltipEnter}>
                    {tooltipContent}
                  </Tooltip>
                ) : null}
              </tr>
            ), this.context.tableStore.isRowExpanding(row, rowKey) && (
              <tr key={`${rowKey}Expanded`}>
                <td
                  colSpan={tableStoreState.columns.length}
                  className="el-table__expanded-cell"
                >
                  {typeof props.renderExpanded === 'function' && props.renderExpanded(row, rowIndex)}
                </td>
              </tr>
            )];
          })}
        </tbody>
      </table>
    );
  }
}
