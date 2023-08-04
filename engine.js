import { getConstructor, select } from "./utils.js";
import { IsJs } from './is.js';
export const StateManager = function(state) {
  this.val = state;
  this.components = new Set();
  this.toggle = () => {
    if (typeof this.val === 'boolean') this.set(!this.val);
    else console.error(`${this.val} is not boolean!`);
  };
  this.doOnSet = new Set();
  this.onSet = cb => { if (cb && typeof cb === 'function') this.doOnSet.add(cb) };
  this.onApplyBinding = null;
  this.set = newVal => {
    const oldVal = this.val;
    this.val = newVal;
    this.doOnSet.forEach(cb => {cb({oldVal, newVal})});
    this.components.forEach(component => {
      component.bindingRefs.forEach(bindingRef => {
        if (bindingRef.states.includes(this)) {
          bindingRef.applyBinding();
          this.onApplyBinding && typeof this.onApplyBinding === 'function' && this.onApplyBinding({bindingRef, component, val: this.val, newVal});
        }
      });
    });
  };
  this.is = test => typeof test === 'undefined' ? this.val : this.val === true || this.val === test;
};
export function Is (arr, vals) {
  this.arr = arr;
  this.vals = vals;
  this.states = vals.filter(val => getConstructor(val) === 'StateManager');
  this.evaluate = () => {
    const expr = [this.arr[0]];
    this.vals.forEach((state, i) => {
      if (getConstructor(state) === 'StateManager') {
        const result = typeof state.is() === 'string' ? `\`${state.is()}\`` : state.is();
        if (typeof result !== 'function') {
          expr.push(result.toString());
        }
      } else if (typeof state === 'function') {
        expr.push(state());
      } else {
        expr.push(state);
      }
      expr.push(this.arr[i+1]);
    });
    return new Function(`return ${expr.join('')}`)();
  };
};
export function Render() {
  const components = Array.from(IsJs.registry);
  const lists = select('list');
  const singles = select('component');
  lists.forEach(listNode => {
    const name = listNode.dataset.list;
    if (name && name in components) {
      const aggregate = new DocumentFragment();
      const deferreds = components[name].flatMap(({deferredBindings}) => deferredBindings);
      components[name].forEach(({fragment, onMounts, nodes}) => {
        aggregate.append(fragment);
        onMounts.forEach(cb => {cb && typeof cb === 'function' && cb(nodes)});
      });
      listNode.replaceWith(aggregate);
      deferreds.forEach(cb => {cb && typeof cb === 'function' && cb()});
    }
    else listNode.remove();
  });
  singles.forEach(component => {
    const name = component.dataset.component;
    if (name && components[name]) {
      component.replaceWith(components[name]);
    }
    else component.remove();
  });
};