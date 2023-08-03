export const getConstructor = obj => !!obj.constructor && obj.constructor.name;

export const select = type => Array.from(document.querySelectorAll(`[data-${type}]`));

export const classList = arr => `'${arr.join(' ').trim()}'`;

export const traverseFragment = (fragment, cb) => { Array.from(fragment.childNodes).filter(node => node.nodeType === 1).forEach(cb); };

const events = Object.keys(window).filter(key => key.startsWith('on')).map(key => key.slice(2).toLowerCase());
const bindings = [
  ...events, 'list', 'component', 'class', 'press', 'edit', 'if', 'state', 'textinput'
];
export const parseDataBinding = attr => {
  if (attr.startsWith('data-')) {
    const type = attr.split('data-')[1];
    if (events.includes(type)) return 'event';
    else if (bindings.includes(type)) return type;
  } else return 'attr';
};