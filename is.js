import { Component } from './component.js';
const IsJs = function(){
  this.render = rootComponent => {
    const root = document.querySelector(`[data-is='root']`);
    root.appendChild(rootComponent.fragment);
    root.removeAttribute('data-is');
    rootComponent.doOnMounts();
  };
  this.customBindings = new Map();
  this.addBinding = ({name, binding}) => {this.customBindings.set(name, binding)};
  this.parseCustomBinding = ({node, component, type, accessor, bindingName}) => {
    const binding = this.customBindings.get(bindingName);
    return binding && typeof binding === 'function' && binding({node, component, type, accessor});
  };
  this.components = new Set();
  this.newComponent = () => {
    const component = new Component();
    this.components.add(component);
    return component;
  }
};
const instance = new IsJs();

export { instance as IsJs };