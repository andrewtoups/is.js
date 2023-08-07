import { StateManager, Is } from './engine.js';
import { IsJs } from './is.js';
import { stateBindings } from './stateBindings.js';
import { getConstructor, traverseFragment, parseDataBinding, stringIsNum, extractStates } from './utils.js';

function Component() {
  this.initializing = true;
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
  this.deferredBindings = [];
  this.applyDeferreds = () => {this.deferredBindings.forEach(cb => {cb && typeof cb === 'function' && cb()})};
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
    this.fragment = fragment;
    this.nodes = Array.from(this.fragment.childNodes);
    traverseFragment(this.fragment, this.handleBindings);
    this.applyDeferreds();
    this.initializing = false;
  };
  this.handleBindings = async node => {
    const isElement = node.nodeType === 1;
    const childNodes = Array.from(node.childNodes);
    if (childNodes) childNodes.forEach(this.handleBindings);
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
    const textBinding = isText && (node.textContent.includes(`_state_`) || node.textContent.includes(`_is_`));

    statefulBindings.forEach(({attr, accessor, type}) => {
      const isFunc  = type === 'func';
      const isBool  = type === 'bool';
      const isObj   = type === 'obj';
      const isArr   = type === 'arr';
      const isState = type === 'state';
      const isIs    = type === 'is';
      const isComp  = type === 'comp';
      const isStr   = typeof accessor === 'string';

      const isReactive = isIs || isState;
      const isData = attr.startsWith('data-');
      
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
          else if (isBool && accessor === true || (isIs || isState)) {
            const parentNode = node.parentNode;
            const replacement = new DocumentFragment();
            const chunkSize = node.childNodes.length;
            Array.from(node.childNodes).forEach(node => {replacement.appendChild(node)});
            const startIndex = Array.from(parentNode.childNodes).indexOf(node);
            node.replaceWith(replacement);
            if (isIs || isState) {
              const applyBinding = () => {stateBindings['if']({nodeArr, parentNode, accessor, startIndex, initializing: this.initializing})};
              const nodeArr = Array.from(parentNode.childNodes).slice(startIndex, startIndex+chunkSize);
              this.bindingRefs.push({
                component: this,
                states: extractStates(accessor),
                binding: binding,
                applyBinding: applyBinding
              });
              this.deferredBindings.push(applyBinding);
            }
          }
        break;

        case 'class':
          if (isReactive) {
            const baseClassList = Array.from(node.classList);
            const applyBinding = () => {stateBindings['class']({node, baseClassList, is: accessor})};
            this.bindingRefs.push({
              component: this,
              states: accessor.states,
              binding,
              applyBinding
            });
            applyBinding();
          } else if (isArr) {
            accessor.forEach(val => {node.classList.add(val)});
          } else if (isStr) {
            accessor.split(' ').forEach(val => {node.classList.add(val)});
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
          if (isReactive) {
            const applyBinding = () => {stateBindings['attr']({node, attr, accessor})};
            if (isState && ['INPUT', 'TEXTAREA', 'SELECT'].includes(node.tagName) && attr === 'value') {
              node.addEventListener('change', ({target}) => {
                accessor.set(target.value);
              });
            }
            const states = extractStates(accessor);
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
          const applyBinding = IsJs.parseCustomBinding({node, accessor, component: this, bindingName: binding, type});
          if (isReactive && applyBinding && typeof applyBinding === 'function') {
            this.bindingRefs.push({
              component: this,
              states: extractStates(accessor),
              binding,
              applyBinding
            });
            applyBinding();
          }
        break;
      }
      if (isData) node.removeAttribute(attr);
    });
    if (textBinding) {
      let typeStr = null;
      let lastIndex = null;
      let justPushed = false;
      const reset = () => {typeStr = null, lastIndex = null, justPushed = false};
      const states = new Set();
      const textMap = node.textContent.trim().split('_').reduce((result, item, i) => {
        const subsequent = lastIndex !== null && i - lastIndex === 1;
        if (['is', 'state'].includes(item) && subsequent === false) {
          typeStr = item;
          lastIndex = i;
        } else if (subsequent === true && stringIsNum(item)) {
          const i = parseInt(item);
          const isState = typeStr === 'state', isIs = typeStr === 'is';
          const accessor = isState ? this.states[i] : isIs ? this.ises[i] : null;
          if (accessor !== null) {
            if (isState) states.add(accessor);
            else if (isIs) accessor.states.forEach(state => {states.add(state)});
            result.push(accessor);
            reset();
            justPushed = true;
          } else {
            result.push(`_${typeStr}_${item}`);
            reset();
          }
        } else if (subsequent === true) {
          result.push(`_${typeStr}_${item}`);
          reset();
        } else {
          result.push(i === 0 || justPushed ? item : `_${item}`);
          justPushed = false;
        }
        return result;
      }, []);
      const applyBinding = () => stateBindings['text']({node, textMap});
      this.bindingRefs.push({
        component: this,
        states: Array.from(states),
        binding: 'text',
        applyBinding
      });
      applyBinding();
    }
  };
};
export { Component };