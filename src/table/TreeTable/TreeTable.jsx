import React, { PureComponent, Fragment } from 'react';
import memoize from 'memoize-one';
import PropTypes from 'prop-types';
import classnames from 'classnames';

import Table from '../TableStore';
import { getTreeTableRows, getRowId, getRowChildren, filterHiddenRows, getInitState } from './handler';

export default class TreeTable extends PureComponent {
  static propTypes = {
    rowKey: PropTypes.oneOfType([PropTypes.func, PropTypes.string]),
    data: PropTypes.arrayOf(PropTypes.object),
    columns: PropTypes.arrayOf(PropTypes.object),
    treeProps: PropTypes.shape({ children: PropTypes.string }),
    indent: PropTypes.number,
    isExpandAll: PropTypes.bool,
  };

  static defaultProps = {
    data: [],
    columns: [],
    treeProps: { children: 'children' },
    indent: 16,
    isExpandAll: false,
  };

  state = {
    expandedRows: [],
    hiddenRows: [],
  };

  constructor(props) {
    super(props);

    const { treeProps, rowKey, isExpandAll, data } = props;
    const allData = this.getData(data, treeProps, rowKey);
    const { expandedRows, hiddenRows } = getInitState(allData, isExpandAll, rowKey);

    window.data1 = data;
    window.treeProps1 = treeProps;
    window.rowKey1 = rowKey;
    window.allData1 = allData;

    this.state.expandedRows = expandedRows;
    this.state.hiddenRows = hiddenRows;
    this.renderExpandColumn = this.renderExpandColumn.bind(this);
  }

  getData = memoize((data, treeProps, rowKey) => getTreeTableRows(data, treeProps, rowKey));
  getDataWithoutHidden = memoize((data, hiddenRows, rowKey) => filterHiddenRows(data, hiddenRows, rowKey));

  get columns() {
    const { columns } = this.props;
    const { renderExpandColumn } = this;
    const [firstColumn, ...otherColumns] = columns;
    const render = (...args) => renderExpandColumn(firstColumn.render, ...args);

    const expandColumn = { ...firstColumn, render };

    return [expandColumn, ...otherColumns];
  }

  toggleExpandedRows(rows, isExpand) {
    const { rowKey, treeProps } = this.props;
    let { expandedRows, hiddenRows } = this.state;
    // 生成新数组
    expandedRows = [...expandedRows];
    hiddenRows = [...hiddenRows];

    for (const row of rows) {
      const rowId = getRowId(row, rowKey);
      // 判断当前row是否需要被展开
      const isRowExpanded = this.isRowExpanded(row);
      const canExpandRow = !isRowExpanded && (isExpand || isExpand === undefined);
      const canCollapseRow = isRowExpanded && (!isExpand || isExpand === undefined);

      if (canExpandRow) {
        const rowChildren = getRowChildren(row, treeProps);
        const rowChildrenIds = rowChildren.map(child => getRowId(child, rowKey));
        expandedRows = [...expandedRows, rowId];
        hiddenRows = hiddenRows.filter(hiddenRowId => !rowChildrenIds.includes(hiddenRowId));
      }
      if (canCollapseRow) {
        const rowChildren = getRowChildren(row, treeProps);
        const rowChildrenIds = rowChildren.map(child => getRowId(child, rowKey));
        expandedRows = expandedRows.filter(expandedRowId => expandedRowId !== rowId);
        hiddenRows = [...hiddenRows, ...rowChildrenIds];
      }
    }

    this.setState({ expandedRows, hiddenRows });
  }

  isRowExpanded(row) {
    const { rowKey } = this.props;
    const { expandedRows } = this.state;
    const rowId = getRowId(row, rowKey);

    return expandedRows.includes(rowId);
  }

  renderExpandColumn(render, row, column, index) {
    const { indent } = this.props;
    const renderText = row[column.prop];
    const isRowExpanded = this.isRowExpanded(row);
    const isLeafRow = !(row.children && row.children.length);

    const expandIconClass = classnames('el-tree-node__expand-icon', { expanded: isRowExpanded });
    const expandIconStyle = {
      marginLeft: row.__level__ * indent + 'px',
      opacity: isLeafRow ? 0 : null,
      pointerEvents: isLeafRow ? 'none' : null,
    };

    return (
      <Fragment>
        <i
          className={expandIconClass}
          style={expandIconStyle}
          onClick={() => this.toggleExpandedRows([row])}
          onKeyUp={() => this.toggleExpandedRows([row])}
        />
        {!render ? (
          <span className="el-table-cell__text">{renderText}</span>
        ) : render(row, column, index) }
      </Fragment>
    );
  }

  render() {
    const { data, rowKey, treeProps } = this.props;
    const { hiddenRows } = this.state;
    const allData = this.getData(data, treeProps, rowKey);
    const tableData = this.getDataWithoutHidden(allData, hiddenRows, rowKey);

    window.data2 = data;
    window.treeProps2 = treeProps;
    window.rowKey2 = rowKey;
    window.allData2 = allData;
    window.getAllData = () => this.getData(data, treeProps, rowKey);

    return (
      <Table
        {...this.props}
        columns={this.columns}
        data={tableData}
      />
    );
  }
}
