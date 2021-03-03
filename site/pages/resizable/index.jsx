import Markdown from '../../../libs/markdown';

import './style.scss';

export default class Resizable extends Markdown {
  document(locale) {
    return require(`../../docs/${locale}/resizable.md`);
  }
}
