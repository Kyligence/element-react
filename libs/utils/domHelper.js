export function getParents(el) {
  let currentEl = el;
  const parents = [];
  while (currentEl.parentNode && currentEl.nodeType !== 9) {
    currentEl = currentEl.parentNode;
    if (currentEl.nodeType === 1) {
      parents.push(currentEl);
    }
  }
  return parents;
}

export function getScrollParent(el) {
  const currentPosition = window.getComputedStyle(el, null).position;
  const excludeStaticParent = currentPosition === 'absolute';
  const overflowRegex = /(auto|scroll)/;
  const parents = getParents(el);
  const scrollParent = parents.find(parent => {
    const parentStyle = window.getComputedStyle(parent, null);
    const parentPosition = parentStyle.position;

    if (excludeStaticParent && parentPosition === 'static') {
      return false;
    }
    return overflowRegex.test(parentStyle.overflow + parentStyle.overflowY + parentStyle.overflowX);
  });

  return currentPosition === 'fixed' || !scrollParent ? window : scrollParent;
}
