export const getConstructor = obj => !!obj.constructor && obj.constructor.name;

export const select = type => Array.from(document.querySelectorAll(`[data-${type}]`));

export const classList = arr => `'${arr.join(' ').trim()}'`;

export const traverseFragment = (fragment, cb) => { Array.from(fragment.childNodes).forEach(cb); };

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

export const unwrapAccessor = accessor => {
  return getConstructor(accessor) === 'StateManager' ? accessor.is() : getConstructor(accessor) === 'Is' ? accessor.evaluate() : null;
};

export const extractStates = accessor => {
  return getConstructor(accessor) === 'StateManager' ? [accessor] : getConstructor(accessor) === 'Is' ? accessor.states : [];
}

export const stringIsNum = str => isNaN(+str) === false;