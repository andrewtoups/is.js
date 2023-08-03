const IsJs = function(){
  this.render = rootComponent => {
    const root = document.querySelector(`[data-is='root']`);
    root.appendChild(rootComponent.fragment);
    root.removeAttribute('data-is');
  };
  this.customBindings = new Map();
  this.addBinding = ({name, binding}) => {this.customBindings.set(name, binding)};
  this.parseCustomBinding = ({node, component, type, accessor, bindingName}) => {
    const binding = this.customBindings.get(bindingName);
    binding && typeof binding === 'function' && binding({node, component, type, accessor});
  };
};
const instance = new IsJs();

export { Component } from './component.js';
export { instance as IsJs };