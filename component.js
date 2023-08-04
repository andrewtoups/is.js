import { StateManager, Is } from './engine.js';
import { IsJs } from './is.js';
import { stateBindings } from './stateBindings.js';
import { getConstructor, traverseFragment, parseDataBinding, stringIsNum } from './utils.js';

function Component(caller) {
  this.params = new Map();
  this.addParam = ({name, value}) => {this.params.set(name, value)};
  this.bindingRefs = [];
  this.state = state => {
    const stateMan = new StateManager(state);
    stateMan.components.add(this);
    return stateMan;
  };
  this.is = (strArr, ...states) => {
    states.forEach(state => {
      state.components.add(this);
    });
    return new Is(strArr, states);
  };
  this.fragment   = null;
  this.arrs       = [];
  this.states     = [];
  this.ises       = [];
  this.comps      = [];
  this.nodes      = [];
  this.funcs      = [];
  this.bools      = [];
  this.objs       = [];
  this.onMounts  = new Set();
  this.onMount = onMount => {onMount && typeof onMount === 'function' && this.onMounts.add(onMount)};
  this.doOnMounts = () => {this.onMounts.forEach(cb => {cb({nodes: this.nodes})})};
  this.template = async (htmlArr, ...values) => {
    const html = [htmlArr[0]];
    values.forEach((val, i) => {
      switch (typeof val) {
        case 'function':
          html.push(`_func_${this.funcs.length}_`);
          this.funcs.push(val);
        break;
        case 'string':
        case 'number':
          html.push(val);
        break;
        case 'boolean':
          html.push(`_bool_${this.bools.length}_`);
          this.bools.push(val);
        break;
        case 'object':

          switch (getConstructor(val)) {
            case 'Array':
              html.push(`_arr_${this.arrs.length}_`);
              this.arrs.push(val);
            break;
            case 'StateManager':
              html.push(`_state_${this.states.length}_`);
              this.states.push(val);
            break;
            case 'Is':
              html.push(`_is_${this.ises.length}_`);
              this.ises.push(val);
            break;
            case 'Component':
              html.push(`_comp_${this.comps.length}_`);
              this.comps.push(val);
            break;
            default:
              html.push(`_obj_${this.objs.length}_`);
              this.objs.push(val);
            break;
          }
        break;
        default:
        break;
      }
      html.push(htmlArr[i+1]);
    });
  
    const template = document.createElement('template');
    template.innerHTML = html.join('').trim();
    const fragment = template.content.cloneNode(true);
    traverseFragment(fragment, this.handleBindings);
    this.fragment = fragment;
    this.nodes = Array.from(fragment.childNodes);
  };
  this.deferredBindings = [];
  this.applyDeferreds = () => {this.deferredBindings.forEach(cb => {cb && typeof cb === 'function' && cb()})};
  this.handleBindings = async node => {
    const isElement = node.nodeType === 1;
    const childNodes = Array.from(node.childNodes);
    const annotations = ['_func_', '_bool_', '_obj_', '_arr_', '_state_', '_is_', '_comp_'];
    const statefulBindings = isElement ? Object.values(node.attributes).filter(({value}) => {
      return annotations.some(str => value.includes(str));
    }).map(({name, value}) => {
      const [type, i] = value.slice(1).split('_');
      const dataRef = type === 'is' ? 'ises' : `${type}s`;
      const accessor = this[dataRef][parseInt(i)];
      return {attr: name, accessor, type};
    }) : [];

    const isText = node.nodeType === 3;
    const textBinding = isText && node.textContent.includes(`_state_`) || node.textContent.includes(`_is_`);

    statefulBindings.forEach(({attr, accessor, type}) => {
      const isFunc  = type === 'func';
      const isBool  = type === 'bool';
      const isObj   = type === 'obj';
      const isArr   = type === 'arr';
      const isState = type === 'state';
      const isIs    = type === 'is';
      const isComp  = type === 'comp';
      const isStr   = typeof accessor === 'string';

      const isData = attr.startsWith('data-');
      
      const is = isIs && accessor;
      const binding = parseDataBinding(attr);
      switch (binding) {

        case 'component':
          if (isComp) stateBindings['component']({node, component: accessor});
        break;

        case 'list':
          if (isArr) stateBindings['list']({node, list: accessor});
        break;

        case 'event':
          if (isFunc && isData) stateBindings.event({node, event: attr.split('data-')[1], handler: accessor});
        break;
  
        case 'if':
          if (isBool && accessor === false) node.remove();
          else {
            const parentNode = node.parentNode;
            const replacement = new DocumentFragment();
            const chunkSize = node.childNodes.length;
            Array.from(node.childNodes).forEach(node => {replacement.appendChild(node)});
            const startIndex = Array.from(parentNode.childNodes).indexOf(node);
            node.replaceWith(replacement);
            if (isIs) {
              const nodeArr = [];
              for (let i = startIndex; i < startIndex+chunkSize; i++) {
                nodeArr.push(parentNode.childNodes[i]);
              }
              const applyBinding = () => {stateBindings['if']({nodeArr, parentNode, is, startIndex})};
              this.bindingRefs.push({
                component: this,
                states: is.states,
                binding: binding,
                applyBinding: applyBinding
              });
              this.deferredBindings.push(applyBinding);
            }
          }
        break;

        case 'class':
          if (isIs) {
            const baseClassList = Array.from(node.classList);
            const applyBinding = () => {stateBindings['class']({node, baseClassList, is})};
            this.bindingRefs.push({
              component: this,
              states: is.states,
              binding,
              applyBinding
            });
            applyBinding();
          }
        break;
        
        case 'textinput':
          if (isState && ['INPUT', 'TEXTAREA', 'SELECT'].includes(node.tagName)) {
            node.addEventListener('keyup', ({target}) => {
              accessor.set(target.value);
            });
            const applyBinding = () => stateBindings['textinput']({node, state: accessor});
            this.bindingRefs.push({
              component: this,
              states: [accessor],
              binding,
              applyBinding
            });
            applyBinding();
          }
        break;
        case 'attr':
          if (isState || isIs) {
            const applyBinding = () => {stateBindings['attr']({node, attr, accessor})};
            if (isState && ['INPUT', 'TEXTAREA', 'SELECT'].includes(node.tagName) && attr === 'value') {
              node.addEventListener('change', ({target}) => {
                accessor.set(target.value);
              });
            }
            const states = isIs ? is.states : isState ? [accessor] : [];
            this.bindingRefs.push({
              component: this,
              states,
              binding,
              applyBinding
            });
            applyBinding();
          } else {
            stateBindings['attr']({node, attr, accessor});
          }
        break;
  
        default:
          IsJs.parseCustomBinding({node, accessor, component: this, bindingName: binding, type});
        break;
      }
      if (isData) node.removeAttribute(attr);
    });
    if (textBinding) {
      const [typeStr, index] = node.textContent.trim().split('_');
      const i = parseInt(index);
      const isState = typeStr.includes('state');
      const isIs = typeStr.includes('is');
      if (isState) {
        const state = this.states[i];
        const applyBinding = () => stateBindings['text']({node, state});
        this.bindingRefs.push({
          component: this,
          states: [state],
          binding: 'text',
          applyBinding
        });
        applyBinding();
      } else if (isIs) {
        const is = this.ises[i];
        const applyBinding = () => stateBindings['text']({node, is});
        this.bindingRefs.push({
          component: this,
          states: is.vals.filter(val => getConstructor(val) === 'StateManager'),
          binding: 'text',
          applyBinding
        });
        applyBinding();
      }
    }

    if (childNodes) childNodes.forEach(this.handleBindings);
  };
};
export { Component };