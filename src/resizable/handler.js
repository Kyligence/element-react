export function getSize(alignment, { width, height }) {
  switch (alignment) {
    case 'horizontal':
      return width;
    case 'vertical':
      return height;
    default:
      return 0;
  }
}

function numeral(percentage) {
  return +percentage.replace('%', '') / 100;
}

/* eslint-disable no-eval */
export function calcSize(expression = '', totalSize) {
  const percentages = expression.match(/[0-9.]+%/g) || [];

  let result = expression;

  for (const percentage of percentages) {
    const value = numeral(percentage);
    result = result.replace(percentage, value * totalSize);
  }
  return eval(result.replace(/px/g, ''));
}
/* eslint-enable */

export function findParents(el) {
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

export function getPagePosition(alignment, { pageX, pageY }) {
  switch (alignment) {
    case 'horizontal':
      return pageX;
    case 'vertical':
      return pageY;
    default:
      return 0;
  }
}
