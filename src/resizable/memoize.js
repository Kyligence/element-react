import memoize from 'memoize-one';
import { calcSize } from './handler';

export const generateGetMaxSize = () => memoize((maxSize, wrapperSize) => {
  return calcSize(maxSize, wrapperSize);
});

export const generateGetMinSize = () => memoize((minSize, wrapperSize) => {
  return calcSize(minSize, wrapperSize);
});

export const generateGetDefaultSize = () => memoize((defaultSize, wrapperSize) => {
  return calcSize(defaultSize, wrapperSize);
});
