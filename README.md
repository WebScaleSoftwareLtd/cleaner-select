<h1 style="text-align: center">cleaner-select</h1>

<p style="text-align: center">
<img alt="desktop" src="https://i.imgur.com/hcRdCr0.gif" />
<img alt="mobile" src="https://i.imgur.com/gMeLZYG.gif" />
</p>

A pretty clean and incredibly simple select menu patcher featuring search and descriptions. It has the following advantages over other libraries:
- **No other libraries required:** Unlike some other libraries which require jQuery, this runs without any additional libraries needed. It is not dependent on any framework such as React which makes it ideal for frameworks such as Hotwired, as well as traditional ones like React.
- **Fairly lightweight:** There are a few small tradeoffs for size to allow for true library independence, but we'd class 6kb as pretty small. Especially since you can dynamically import it in!
- **Search:** Unlike the default select menu, you can quickly search for what you want.
- **Descriptions support:** You can add descriptions to your options!
- **Accessible:** A lot of effort was put into trying to make this as accessible as possible.
- **Mobile friendly:** Automatically scales to fit nicely on mobile displays.
- **Simple interface:** I'm sure you will agree after reading below!
- **Data tags powered:** Whilst being very easy to port to frameworks such as React, this also makes it a perfect fit for server side frameworks like Rails.

## Compatibility

cleaner-select works on any browser that supports ResizeObserver. This means if your browser was made after 2020 (I *really* hope it is), it should work fine. The one exception to this is Internet Explorer where you might still need to polyfill if you need to support it for whatever reason.

## Usage

To use cleaner-select, you will need to import the module and then call the `mount` method on it with the select element.
```js
// Make this your select element. For example, in Stimulus, it may be desirable to put all this in a controller and use `this.element` instead of a variable.
const selectElement = document.getElementById("select_menu");

// Move this variable whereever is appropriate for the framework you are using.
let destructor = () => {};

// You probably want to dynamically import this. No point making bundles bigger than needed for something dynamic.
import("cleaner-select").then(({ mount }) => {
    destructor = mount(selectElement);
});
```

**Please note it is important that before you destroy the site of the page, you call the destructor. This will stop any leaks and destroy active menus.**

cleaner-select will use the font attached to the body. This is useful because you may want to change this for accessibility reasons.

cleaner-select can recognise the following data attributes on select tags:
- `data-search-text`: Replaces the default `Search...` text. Useful for internationalisation.
- `data-force-theme`: Can be either `light` or `dark` to force a specific theme. By default, will use the system to figure out what theme it should use.
- `data-dark-highlight-color`: The color used to highlight the background of a selected item in dark mode. Defaults to `#0176ff`.
- `data-light-highlight-color`: The color used to highlight the background of a selected item in light mode. Defaults to `#77b9fc`.

Each option inside your select can also have an additional `data-description` attribute. This will include some additional information that will be rendered in the menu:

```html
<select>
    <option data-description="This is a description!">Title</option>
</select>
```
![description preview](https://i.imgur.com/oFN0Yc4.png)

## Hotwired Example

It is this simple to get working with Hotwired:
```js
import { Controller } from "@hotwired/stimulus"
import { mount } from "cleaner-select"

// Connects to data-controller="select"
export default class extends Controller {
  connect() {
    this.destructor = mount(this.element)
  }

  disconnect() {
    this.destructor()
  }
}
```
If you are using import maps in Rails, make sure to pin `cleaner-select`. Boom!
