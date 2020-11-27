import Node from './node';
import { getNodeKey } from './util';

export default class TreeStore {
  constructor(options) {
    this.currentNode = null;
    this.currentNodeKey = null;

    for (let option in options) {
      if (options.hasOwnProperty(option)) {
        this[option] = options[option];
      }
    }

    this.nodesMap = {};

    this.root = new Node({
      data: this.data,
      store: this
    });

    if (this.lazy && this.load) {
      const loadFn = this.load;
      loadFn(this.root, (data) => {
        this.root.doCreateChildren(data);
        this._initDefaultCheckedNodes();
      });
    } else {
      this._initDefaultCheckedNodes();
    }
  }

  filter(value, isEnableByChildren = true) {
    const filterNodeMethod = this.filterNodeMethod;
    const traverse = function(node) {
      const childNodes = node.root ? node.root.childNodes : node.childNodes;

      childNodes.forEach((child) => {
        child.visible = filterNodeMethod.call(child, value, child.data, child);

        traverse(child);
      });

      if (!node.visible && childNodes.length && isEnableByChildren) {
        let allHidden = true;

        childNodes.forEach((child) => {
          if (child.visible) allHidden = false;
        });

        if (node.root) {
          node.root.visible = allHidden === false;
        } else {
          node.visible = allHidden === false;
        }
      }

      if (node.visible && !node.isLeaf) node.expand();
    };
    traverse(this);
  }

  setData(newVal) {
    const instanceChanged = newVal !== this.root.data;
    this.root.setData(newVal);
    if (instanceChanged) {
      this._initDefaultCheckedNodes();
    }
  }

  getNode(data) {
    const nodeKey = typeof data !== 'object' ? data : getNodeKey(this.key, data);
    return this.nodesMap[nodeKey];
  }

  insertBefore(data, refData) {
    const refNode = this.getNode(refData);
    refNode.parent.insertBefore({ data }, refNode);
  }

  insertAfter(data, refData) {
    const refNode = this.getNode(refData);
    refNode.parent.insertAfter({ data }, refNode);
  }

  remove(data) {
    const node = this.getNode(data);
    if (node) {
      node.parent.removeChild(node);
    }
  }

  append(data, parentData) {
    const parentNode = parentData ? this.getNode(parentData) : this.root;

    if (parentNode) {
      parentNode.insertChild({ data });
    }
  }

  _initDefaultCheckedNodes() {
    const defaultCheckedKeys = this.defaultCheckedKeys || [];
    const nodesMap = this.nodesMap;

    defaultCheckedKeys.forEach((checkedKey) => {
      const node = nodesMap[checkedKey];

      if (node) {
        node.setChecked(true, !this.checkStrictly);
      }
    });
  }

  _initDefaultCheckedNode(node) {
    const defaultCheckedKeys = this.defaultCheckedKeys || [];

    if (defaultCheckedKeys.indexOf(node.key) !== -1) {
      node.setChecked(true, !this.checkStrictly);
    }
  }

  setDefaultCheckedKey(newVal) {
    if (newVal !== this.defaultCheckedKeys) {
      this.defaultCheckedKeys = newVal;
      this._initDefaultCheckedNodes();
    }
  }

  registerNode(node) {
    const key = this.key;
    if (!key || !node || !node.data) return;

    const nodeKey = node.key;
    if (nodeKey !== undefined) this.nodesMap[node.key] = node;
  }

  deregisterNode(node) {
    const key = this.key;
    if (!key || !node || !node.data) return;

    delete this.nodesMap[node.key];
  }

  getCheckedNodes(leafOnly = false) {
    const checkedNodes = [];
    const traverse = function(node) {
      const childNodes = node.root ? node.root.childNodes : node.childNodes;

      childNodes.forEach((child) => {
        if ((!leafOnly && child.checked) || (leafOnly && child.isLeaf && child.checked)) {
          checkedNodes.push(child.data);
        }

        traverse(child);
      });
    };

    traverse(this);

    return checkedNodes;
  }

  getCheckedKeys(leafOnly = false) {
    const key = this.key;
    const allNodes = this._getAllNodes();
    const keys = [];
    allNodes.forEach((node) => {
      if (!leafOnly || (leafOnly && node.isLeaf)) {
        if (node.checked) {
          keys.push((node.data || {})[key]);
        }
      }
    });
    return keys;
  }

  _getAllNodes() {
    const allNodes = [];
    const nodesMap = this.nodesMap;
    for (let nodeKey in nodesMap) {
      if (nodesMap.hasOwnProperty(nodeKey)) {
        allNodes.push(nodesMap[nodeKey]);
      }
    }

    return allNodes;
  }

  _setCheckedKeys(key, leafOnly = false, checkedKeys) {
    const allNodes = this._getAllNodes();
    allNodes.sort((a, b) => b.level - a.level);

    const keys = Object.keys(checkedKeys);
    allNodes.forEach((node) => {
      let checked = keys.indexOf(node.data[key] + '') > -1;

      if (!node.isLeaf) {
        if (!this.checkStrictly) {
          const childNodes = node.childNodes;

          let all = true;
          let none = true;

          for (let i = 0, j = childNodes.length; i < j; i++) {
            const child = childNodes[i];
            if (child.checked !== true || child.indeterminate) {
              all = false;
            }
            if (child.checked !== false || child.indeterminate) {
              none = false;
            }
          }

          if (all) {
            node.setChecked(true, !this.checkStrictly);
          } else if (!all && !none) {
            checked = checked ? true : 'half';
            node.setChecked(checked, !this.checkStrictly && checked === true);
          } else if (none) {
            node.setChecked(checked, !this.checkStrictly);
          }
        } else {
          node.setChecked(checked, false);
        }

        if (leafOnly) {
          node.setChecked(false, false);
          const traverse = function(node) {
            const childNodes = node.childNodes;

            childNodes.forEach((child) => {
              if (!child.isLeaf) {
                child.setChecked(false, false);
              }
              traverse(child);
            });
          };

          traverse(node);
        }
      } else {
        node.setChecked(checked, false);
      }
    });
  }

  setCheckedNodes(array, leafOnly = false) {
    const key = this.key;
    const checkedKeys = {};
    array.forEach((item) => {
      checkedKeys[(item || {})[key]] = true;
    });

    this._setCheckedKeys(key, leafOnly, checkedKeys);
  }

  setCheckedKeys(keys, leafOnly = false) {
    this.defaultCheckedKeys = keys;
    const key = this.key;
    const checkedKeys = {};
    keys.forEach((key) => {
      checkedKeys[key] = true;
    });

    this._setCheckedKeys(key, leafOnly, checkedKeys);
  }

  setDefaultExpandedKeys(keys) {
    keys = keys || [];
    this.defaultExpandedKeys = keys;

    keys.forEach((key) => {
      const node = this.getNode(key);
      if (node) node.expand(null, this.autoExpandParent);
    });
  }

  setChecked(data, checked, deep) {
    const node = this.getNode(data);

    if (node) {
      node.setChecked(!!checked, deep);
    }
  }

  getCurrentNode() {
    return this.currentNode;
  }

  setCurrentNode(node) {
    this.currentNode = node;
  }

  setCurrentNodeKey(key) {
    const node = this.getNode(key);
    if (node) {
      this.currentNode = node;
    }
  }

  getNodePosition(data) {
    const scrollNodeKey = typeof data !== 'object' ? data : getNodeKey(this.key, data);
    const { position } = this.travelNodePosition(this.root, scrollNodeKey);
    return position - 36;
  }

  getLevelOffset(nodes = [], scrollNodeKey) {
    let offset = 0;

    for (let node of nodes) {
      const nodeKey = typeof node.data !== 'object' ? node.data : getNodeKey(this.key, node.data);

      if (nodeKey === scrollNodeKey) {
        return offset;
      } else {
        offset += 36;
      }
    }

    return 0;
  }

  travelNodePosition(parentNode, scrollNodeKey, scrollTop = 0) {
    const parentNodeKey = getNodeKey(this.key, parentNode.data);
    const { childNodes } = parentNode;

    // 如果当前节点是要找的节点
    if (parentNodeKey === scrollNodeKey) {
      // 返回当前节点的位置
      return { position: scrollTop, height: 36 };

      // 如果当前节点不是要找的节点，且没有子节点
    } else if (!childNodes.length) {
      // 返回空
      const position = null;
      return { position, height: parentNode.visible ? 36 : 0 };

      // 如果当前节点不是要找的节点，但有子节点
    } else if (childNodes.length) {
      if (parentNode.expanded) {
        let childrenHeight = 0;
        // 遍历寻找子节点
        for (const childNode of childNodes) {
          const { position, height } = this.travelNodePosition(childNode, scrollNodeKey, scrollTop + childrenHeight, childNodes);
          // 如果找到要找的子节点位置，则返回位置
          if (position !== null) {
            return { position: position + 36, height };
          } else {
            childrenHeight += height;
          }
        }
        // 否则返回空
        return { position: null, height: childrenHeight + 36 };
      } else {
        return { position: null, height: 36 };
      }
    }
  }
}
