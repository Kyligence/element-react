// @flow
import React from 'react';
import classnames from 'classnames';
import { Component, PropTypes } from '../../libs';
import { getRowIdentity, getValueByPath } from "./utils";
// import {toDate} from "../date-picker/utils/index";

import Checkbox from '../checkbox';
import Radio from '../radio';
import OverflowTooltip from '../OverflowTooltip/OverflowTooltip';
import Tooltip from './TableCellTooltip';

import type {_Column, TableBodyProps} from "./Types";
export default class TableBody extends Component<TableBodyProps> {
  static contextTypes = {
    tableStore: PropTypes.any,
    layout: PropTypes.any,
  };

  isOverflowTooltipShow = false;

  rowRefs = [];

  constructor(props: TableBodyProps) {
    super(props);
    ['handleMouseLeave'].forEach((fn) => {
      this[fn] = this[fn].bind(this);
    });
  }

  getIsRowTooltipAtCell = (row: Object, column: _Column, index: number, rowKey: string | number) => {
    const { rowTooltip = {} } = this.props;

    switch (typeof rowTooltip.columnAt) {
      case 'string': return column.prop === rowTooltip.columnAt;
      case 'function': return rowTooltip.columnAt(row, column, index, rowKey);
      default: return false;
    }
  }

  handleShowRowTooltip = (event: any, index: number) => {
    if (!this.isOverflowTooltipShow) {
      const { tooltipRef } = this.rowRefs[index];
      if (tooltipRef.current) {
        tooltipRef.current.showPopper();
      }
    }
  };

  handleHideRowTooltip = () => {
    for (const { tooltipRef } of this.rowRefs) {
      if (tooltipRef.current) {
        tooltipRef.current.hidePopper();
      }
    }
  };

  handleOverflowTooltipShow = () => {
    this.handleHideRowTooltip();
    this.isOverflowTooltipShow = true;
  };

  handleOverflowTooltipHide = () => {
    this.isOverflowTooltipShow = false;
  };

  handleMouseEnter = (event: any, index: number) => {
    this.context.tableStore.setHoverRow(index);
  };

  handleMouseMove = (event: any, index: number) => {
    this.handleShowRowTooltip(event, index);
  };

  handleMouseLeave = () => {
    this.context.tableStore.setHoverRow(null);
    this.handleHideRowTooltip();
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

  renderExpandCell = (row: Object, column: _Column, index: number, rowKey: string | number): React.DOM => {
    const { tableStore } = this.context;
    const cellClassName = this.classNames('el-table__expand-icon ', {
      'el-table__expand-icon--expanded': tableStore.isRowExpanding(row, rowKey)
    });

    return (
      <div className={cellClassName} onClick={() => this.handleExpandClick(row, rowKey)}>
        <i className="el-icon el-icon-arrow-right" />
      </div>
    )
  }

  renderIndexCell = (row: Object, column: _Column, index: number, rowKey: string | number): React.DOM => {
    return <div>{index + 1}</div>;
  }

  renderSelectionCell = (row: Object, column: _Column, index: number, rowKey: string | number): React.DOM => {
    const { disabled } = this.props;
    const { tableStore } = this.context;
    const { selectable } = column;
    const isSelected = tableStore.isRowSelected(row, rowKey);
    const isDisabled = (selectable && !selectable(row, index)) || disabled;
    const handleToggleRowSelection = () => tableStore.toggleRowSelection(row, !isSelected);

    const renderData = { isSelected, handleToggleRowSelection, isDisabled };
    const rendered = column.render(row, column, index, renderData);

    return !rendered ? (
      <Checkbox checked={isSelected} disabled={isDisabled} onChange={handleToggleRowSelection} />
    ) : rendered;
  }

  renderRadioCell = (row: Object, column: _Column, index: number, rowKey: string | number): React.DOM => {
    const { highlightCurrentRow, disabled } = this.props;
    const { tableStore } = this.context;
    const { selectable } = column;
    const isSelected = highlightCurrentRow && tableStore.isCurrentRow(row, rowKey);
    const isDisabled = (selectable && !selectable(row, index)) || disabled;

    const renderData = { isSelected, isDisabled };
    const rendered = column.render(row, column, index, renderData);

    return !rendered ? (
      <Radio disabled={isDisabled} checked={isSelected} value="" />
    ) : rendered;
  }

  renderNormalCell = (row: Object, column: _Column, index: number, rowKey: string | number): React.DOM => {
    const { showOverflowTooltip } = this.props;

    const popperProps = {
      modifiers: {
        flip: { enabled: false },
        hide: { enabled: false },
        preventOverflow: { enabled: false },
      },
    };

    return showOverflowTooltip ? (
      <OverflowTooltip popperProps={popperProps} content={getValueByPath(row, column.property)} onShow={this.handleOverflowTooltipShow} onHide={this.handleOverflowTooltipHide}>
        <span>{column.render(row, column, index)}</span>
      </OverflowTooltip>
    ) : column.render(row, column, index);
  }

  renderCell(row: Object, column: _Column, index: number, rowKey: string | number): React.DOM {
    switch (column.type) {
      case 'expand': return this.renderExpandCell(row, column, index, rowKey);
      case 'index': return this.renderIndexCell(row, column, index, rowKey);
      case 'selection': return this.renderSelectionCell(row, column, index, rowKey);
      case 'radio': return this.renderRadioCell(row, column, index, rowKey);
      default: return this.renderNormalCell(row, column, index, rowKey);
    }
  }

  renderCellIfRowTooltip(row: Object, column: _Column, index: number, rowKey: string | number): React.DOM {
    const { rowTooltip, showOverflowTooltip } = this.props;
    const { getIsRowTooltipAtCell } = this;
    const isRowTooltipAtCell = getIsRowTooltipAtCell(row, column, index, rowKey);

    const { tooltipRef } = this.rowRefs[index];

    let tooltipContent = null;
    if (rowTooltip && rowTooltip.content) {
      tooltipContent = typeof rowTooltip.content === 'function'
        ? rowTooltip.content(row, index)
        : rowTooltip.content;
    }

    const cellClassName = classnames('cell',
      showOverflowTooltip && 'overflow-tooltip',
      isRowTooltipAtCell && 'row-tooltip'
    );

    const popperProps = {
      modifiers: {
        flip: { enabled: false },
        hide: { enabled: false },
        preventOverflow: { enabled: false },
      },
    };

    return (
      <div className={cellClassName}>
        {rowTooltip && isRowTooltipAtCell && tooltipContent ? (
          <Tooltip positionFixed placement="top" ref={tooltipRef} popperClass={rowTooltip.popperClass} content={tooltipContent} popperProps={popperProps}>
            {this.renderCell(row, column, index, rowKey)}
          </Tooltip>
        ) : this.renderCell(row, column, index, rowKey)}
      </div>
    )
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
            const { rowRef } = this.rowRefs[rowIndex];
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
                onMouseEnter={e => this.handleMouseEnter(e, rowIndex)}
                onMouseMove={e => this.handleMouseMove(e, rowIndex)}
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
                    {this.renderCellIfRowTooltip(row, column, rowIndex, rowKey)}
                  </td>
                ))}
                {!props.fixed && layout.scrollY && !!layout.gutterWidth && (
                  <td className="gutter" />
                )}
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
