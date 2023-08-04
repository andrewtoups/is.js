import { getConstructor, unwrapAccessor } from './utils.js';
export const stateBindings = {
  'component': async ({node, component}) => {
    if (component && getConstructor(component) === 'Component') {
      node.replaceWith(component.fragment);
      component.doOnMounts();
    }
    else node.remove();
  },
  'list': ({node, list}) => {
    if (list && list.every(l => getConstructor(l) === 'Component')) {
      const aggregate = new DocumentFragment();
      const deferreds = list.flatMap(({applyDeferreds, doOnMounts}) => [applyDeferreds, doOnMounts]);
      list.forEach(({fragment}) => {
        aggregate.append(fragment);
      });
      node.replaceWith(aggregate);
      deferreds.forEach(deferred => {deferred()});
    } else node.remove();
  },
  'event': ({node, event, handler}) => {
    node.addEventListener(event, handler);
  },
  'textinput': ({node, state}) => {
    if (node.tagName === 'TEXTAREA') node.value = state.is();
    else node.setAttribute('value', state.is());
  },
  'if': ({nodeArr, accessor, parentNode, startIndex, initializing}) => {
    const value = unwrapAccessor(accessor);
    const inDocument = parentNode.isConnected && nodeArr.every(node => node.isConnected === true);
    if ((inDocument || initializing) && value === false) nodeArr.forEach(node => {node.remove()});
    else if (!inDocument && value === true) {
      const frag = new DocumentFragment();
      nodeArr.forEach(node => {frag.appendChild(node)});
      if (parentNode.childNodes[startIndex + 1]) parentNode.insertBefore(frag, parentNode.childNodes[startIndex + 1]);
      else parentNode.appendChild(frag);
    }
  },
  'class': ({node, baseClassList, is}) => {
    const result = is.evaluate();
    const rawList = typeof result === 'string' ? result.split(' ') : Array.isArray(result) ? result : [];
    const classList = rawList.filter(item => typeof item === 'string' && item !== '');
    Array.from(node.classList).forEach(className => {node.classList.remove(className)});
    [...baseClassList, ...classList].forEach(className => {node.classList.add(className)})
  },
  'attr': (({node, attr, accessor}) => {
    let result;
    switch (typeof accessor) {
      case 'object':
        switch(getConstructor(accessor)) {
          case 'StateManager':
            result = accessor.is();
          break;
          case 'Is':
            result = accessor.evaluate();
          break;
          default:
          break;
        }
      break;
      case 'function':
        result = accessor();
      break;
      case 'number':
      case 'boolean':
        result = accessor.toString();
      break;
      default:
        result = accessor;
      break;
    }
    if (['string', 'number'].includes(typeof result)) node.setAttribute(attr, result);
  }),
  'text': ({node, textMap}) => {
    node.textContent = textMap.map(item => {
      if (typeof item === 'string') return item;
      else if (unwrapAccessor(item)) return unwrapAccessor(item);
      else return '';
    }).join('');
  }
};
