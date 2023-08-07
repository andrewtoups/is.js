# IsJs
An experimental, event-based Javascript framework. Designed to be tidy, unobtrusive, and require no dependencies.

> [!WARNING]
> 
> This project is an alpha prototype and subject to sweeping, syntax-breaking changes. Feel free to play around, but it's not production-ready!

## Usage
**IsJs** uses [tagged template literals](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Template_literals#tagged_templates) along with [data-* attributes](https://developer.mozilla.org/en-US/docs/Learn/HTML/Howto/Use_data_attributes) to declare markup and data bindings for reuseable, reactive components.
After components are parsed, all data-attributes and container elements are removed from the resulting markup, resulting in clean, unpolluted HTML. Because **IsJs** is purely event-based, this can be done without losing functionality.

> [!NOTE]
> 
> IDE's will not usually provide HTML or Javascript syntax highlighting inside template literals, but there are a number of plugins that can provide this functionality given the appropriate tags. I haven't found any Visual Studio Code plugins that work reliably for user-configured tags, but [this](https://marketplace.visualstudio.com/items?itemName=sissel.language-literals) does the job reasonably well with the `html` and `js` tags. To use with **IsJs**, you can simply destructure the following methods from the `component` object and alias them accordingly, like so:
> ```javascript
> const app = IsJs.newComponent();
> const { is: js, template: html } = app;
> ```
> I'll probably fork this extension someday and make it more configurable so it can be used without altering any code, but for now this is better than nothing!

### 1. Choose a root container and add a `data-is` attribute to.
Using `body` is fine -- unlike parsed component containers, the root container is not removed on mounting.

<sub>**`index.html`**</sub>
```html
<body data-is='root'>
</body>
```
### 2. Clone this repository into your project. Add a `script` tag with the attribute `type` set to ***module***. In that javascript file, import `is.js`.
<sub>**`index.html`**</sub>
```html
<script src="index.js" type="module"></script>
```
<sub>**`index.js`**</sub>
```javascript
import { IsJs } from './is/is.js';
```
### 3. Create a root component using `IsJs.newComponent()` method, and define its markup with the `Component.template()` method. Render it by passing the component to `IsJs.render()`.
String variables will be interpolated into the template as expected:

<sub>**`index.js`**</sub>
```javascript
import { IsJs } from './is/is.js';

const app = IsJs.newComponent();
const mood = 'hate';

app.template`
```
```html
  <div class="card-container">
    <h2>Frameworks I ${mood}!</h2>
    <ul class="hate-list">
      <!-- to be populated -->
    </ul>
  </div>
```
```javascript
`;

IsJs.render(app);
```
### 4. Create additional components and render them using the attributes `data-component` and `data-list`.
You can also render content conditionally using `data-if`.

<sub>**`index.js`**</sub>
```javascript
...
const list = [
  'react',
  'angular',
  'vuejs',
  'jQuery',
  'and most of all, is.js!!'
];

const listItems = list.map(item => {
  const c = IsJs.newComponent()
  c.template`<li>${item}</li>`;
  return c;
});

const justKidding = IsJs.newComponent();
justKidding.template`<p>Just kidding haha</p>`;

const app = IsJs.newComponent();
const feelingForgiving = true;
const mood = 'hate';

app.template`
```
```html
  <div class="card-container">
    <h2>Frameworks I ${mood}!</h2>
    <ul class="hate-list">
      <div data-list=${listItems}></div>
    </ul>
    <div data-if=${feelingForgiving}>
      <div data-component=${justKidding}></div>
    </div>
    <div data-if=${feelingForgiving === false}}>
      <p>...or am I??</p>
    </div>
  </div>
```
```javascript
`;

IsJs.render(app);
```
### 5. Add stateful data by passing initial data to `Component.State()`. Bind it to the template by passing a javascript expression containing that state to `Component.is()`.
* `Component.is()` is another tagged template method. It evaluates a js expression with interpolated states.
* Events can be bound by passing a function to the `data-{event}` binding.

<sub>**`index.js`**</sub>
```javascript
...
const list = [
  'react',
  'angular',
  'vuejs',
  'jQuery',
  'and most of all, is.js!!'
];

const listItems = list.map(item => {
  const c = IsJs.newComponent()
  c.template`<li>${item}</li>`;
  return c;
});

const justKidding = IsJs.newComponent();
justKidding.template`<p>Just kidding haha</p>`;

const app = IsJs.newComponent();
const badMood = app.state(true);
const feelingForgiving = app.state(false);
const becomeForgiving = () => {feelingForgiving.set(true)};
const is = app.is;

app.template`
```
```html
<div class="card-container">
  <h2>Frameworks I ${is`${badMood} === true ? 'hate' : 'love'`}!</h2>
  <button data-click=${badMood.toggle}>Toggle Mood</button>
  <div data-if=${is`${feelingForgiving} === false && ${badMood} === true`}>
    <button data-click=${becomeForgiving}}>I'm feeling forgiving</button>
  </div>
  <ul class="hate-list">
    <div data-list=${listItems}></div>
  </ul>
  <div data-if=${is`${badMood} === true && ${feelingForgiving} === true`}>
    <div data-component=${justKidding}></div>
  </div>
  <div data-if=${is`${badMood} === true && ${feelingForgiving} === false`}>
    <p>And I really mean it!!</p>
  </div>
</div>
```
```javascript
`;

IsJs.render(app);
```
### 6. Bind to attributes using any of the `data-*` attribute bindings.
* The parser doesn't care if it's a real attribute or not.
* However, binding to the `value` of an `input` or `select` element will create a bi-directional binding.

<sub>**`index.js`**</sub>
```javascript
...
app.template`
```
```html
<div class="card-container">
  <h2>Frameworks I ${is`${badMood} === true ? 'hate' : 'love'`}!</h2>
  <button data-click=${badMood.toggle}>Toggle Mood</button>
  <div data-if=${is`${feelingForgiving} === false && ${badMood} === true`}>
    <button data-click=${becomeForgiving}}>I'm feeling forgiving</button>
  </div>
  <ul data-class=${is`${badMood} === true ? 'hate-list' : 'love-list'`}>
    <div data-list=${listItems}></div>
  </ul>
  <div data-if=${is`${badMood} === true && ${feelingForgiving} === true`}>
    <div data-component=${justKidding}></div>
  </div>
  <div data-if=${is`${badMood} === true && ${feelingForgiving} === false`}>
    <p>And I really mean it!!</p>
  </div>
</div>
```
```javascript
`;

IsJs.render(app);
```
## Other features
### Custom bindings with `IsJs.addCustomBinding()`
> [!NOTE]
> 
> This feature hasn't been extensively tested yet. If you encounter issues, please report them!

You can extend the functionality of `IsJs` by registering your own custom bindings with `IsJs.addCustomBinding`.

`addCustomBinding()` takes a single object with two properties as its sole parameter:
* `name`: A string used to reference the binding as a `data-*` attribute (i.e., the binding `myBinding` can be used with the `data-myBinding` attribute).
* `binding`:
  * A function which takes an object with the following properties as its sole parameter:
    * `node`: The [DOM Node](https://developer.mozilla.org/en-US/docs/Web/API/Node) the binding is attached to.
    * `component`: The `IsJs` `Component` that node is a child of.
    * `accessor`: The value passed to the binding. If the `type` (see below) is `state` or `is`, `accessor` can be passed to `IsJs.unwrapAccessor()` to retrieve its current value.
    * `type`: The accessor's type. Not a primitive type, but a keyword from the following list. (Values of type `string`s and `number`s are always ignored and interpolated as normal.)
      * `func`: A Javascript [function](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Function).
      * `string`: A literal Javascript primitive [string](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String) value.
      * `bool`: A literal Javascript primitive [boolean](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Boolean) value.
      * `arr`: A Javascript [Array](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array) object.
      * `obj`: A Javascript [object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object).
      * `state`: An `IsJs` `StateManager` object (created when using `component.state()`).
      * `is`: An `IsJs` `Is` object (created when using `component.is()`).
  * Optionally returns a new `applyBinding` function that tells the engine how to react to changes of a `StateManager` or `Is` type `accessor`. Things to note:
    * This function will only be registered if the binding's `accessor` is reactive, i.e. it's either a `StateManager` or `Is` object.
    * Be sure to return the fucntion **without calling it**. `IsJs` will call it once per binding when first parsing markup and then subsequently for each binding when the `accessor` changes. Calling it here too could have unexpected side-effects.
    * Be sure to use the **unwrapped** `accessor` object in the function body, and pass it to `unwrapAccessor()` to ensure that it reacts to new changes. If this function uses the unwrapped value, it will only update based on what the `accessor` initially evaluated to.
      
### Using states
The following methods can be used with `StateManager` objects:
* `set(newValue)`: Pass a `newValue` to update the state.
* `is(testValue)`: Call without a parameter to retrieve the current value. Pass a parameter to determine if the state is currently equal to that value.
* `onSet(callBack)`: This method takes a single function as its sole parameter. The function takes a single object as its sole parameter, with the following properties:
  * `oldVal`: the previous value of the state.
  * `newVal`: the value about to be assigned to the state.
