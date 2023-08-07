# Is.js
An experimental, event-based Javascript framework. Designed to be unobtrusive and require no dependencies.

> [!WARNING]
> 
> This project is an alpha prototype and subject to sweeping, syntax-breaking changes. Feel free to play around, but it's not production-ready!

## Usage
**Is.js** uses [tagged template literals](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Template_literals#tagged_templates) along with [data-* attributes](https://developer.mozilla.org/en-US/docs/Learn/HTML/Howto/Use_data_attributes) to declare markup and data bindings for reuseable components.
After components are parsed, all data-attributes and container elements are removed from the resulting markup, resulting in clean, unpolluted HTML.

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
* Syntax highlighting is for losers! There are [IDE extensions](https://marketplace.visualstudio.com/items?itemName=Tobermory.es6-string-html) for that though.

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
This method takes a single object with two properties as its sole parameter:
* `name`: A string used to reference the binding as a `data-*` attribute (i.e., the binding `myBinding` can be used with the `data-myBinding` attribute).
* `binding`: A function which takes an object with the following properties as its sole parameter:
  * `node`: The [DOM Node](https://developer.mozilla.org/en-US/docs/Web/API/Node) the binding is attached to.
  * `component`: The `IsJs` `Component` that node is a child of.
  * `accessor`: The value passed to the binding.
  * `type`: The accessor's type. Not a primitive type, but a keyword from the following list. (Values of type `string`s and `number`s are always ignored and interpolated as normal.)
    * `func`: A Javascript [function](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Function).
    * `string`: A literal Javascript primitive [string](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String) value.
    * `bool`: A literal Javascript primitive [boolean](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Boolean) value.
    * `arr`: A Javascript [Array](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array) object.
    * `obj`: A Javascript [object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object).
    * `state`: An `IsJs` `StateManager` object (created when using `component.state()`).
    * `is`: An `IsJs` `Is` object (created when using `component.is()`).
### Using states
The following methods can be used with `StateManager` objects:
* `set(newValue)`: Pass a `newValue` to update the state.
* `is(testValue)`: Call without a parameter to retrieve the current value. Pass a parameter to determine if the state is currently equal to that value.
* `onSet(callBack)`: This method takes a single function as its sole parameter. The function takes a single object as its sole parameter, with the following properties:
  * `oldVal`: the previous value of the state.
  * `newVal`: the value about to be assigned to the state.
