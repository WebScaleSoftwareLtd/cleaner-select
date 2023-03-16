// cleaner-select. Copyright (C) Web Scale Software Ltd 2023.
// This code is licensed under the MIT license. See the LICENSE file for details.

type OptStyles = Partial<CSSStyleDeclaration>;

function applyStyles(element: HTMLElement, styles: OptStyles) {
    const keys = Object.keys(styles) as (keyof CSSStyleDeclaration)[];
    for (let i = 0; i < keys.length; i++) {
        const key = keys[i];
        const val = styles[key];
        if (val !== undefined) (element.style as any)[key] = val;
    }
}

function halfCaseInsensitiveIncludes(haystack: string, needle: string) {
    return haystack.toLowerCase().includes(needle);
}

// Defines some constants.
const MENU_HEIGHT = 300;
const MENU_WIDTH = 200;

export default class CustomSelect {
    private resizeObserver: ResizeObserver | undefined;
    private dropdownOverride: HTMLElement | undefined;
    private keyEv: any;
    private clickEv: any;
    private globalClickEv: any;
    private globalKeyEv: any;
    private ariaPopupBackup: string | null;

    constructor(
        private parent: HTMLSelectElement, private searchPlaceholder: string,
        private themeType: "light" | "dark" | undefined,
        private darkHighlightColor: string, private lightHighlightColor: string,
    ) {
        // Hook key down and click events.
        this.keyEv = this.onSelectKeyDown.bind(this);
        this.parent.addEventListener("keydown", this.keyEv);
        this.clickEv = this.onSelectClick.bind(this);
        this.parent.addEventListener("mousedown", this.clickEv);

        // Globally hook clicks or key downs to check if its outside the dropdown.
        this.globalClickEv = this.onGlobalClickOrKey.bind(this);
        document.addEventListener("mousedown", this.globalClickEv);
        this.globalKeyEv = this.onGlobalClickOrKey.bind(this);
        document.addEventListener("keydown", this.globalKeyEv);

        // Backup the original aria popup value.
        this.ariaPopupBackup = this.parent.getAttribute("aria-haspopup");

        // Set the aria popup value.
        this.parent.setAttribute("aria-haspopup", "true");
    }

    private halfKill() {
        // Remove the resize observer.
        if (this.resizeObserver) {
            this.resizeObserver.disconnect();
            this.resizeObserver = undefined;
        }

        // Remove the overlay element.
        if (this.dropdownOverride) {
            this.dropdownOverride.remove();
            this.dropdownOverride = undefined;
        }
    }

    private onGlobalClickOrKey(e: Event) {
        if (!this.dropdownOverride) return;
        let el = e.target as HTMLElement | null;
        while (el) {
            if (el === this.dropdownOverride || el === this.parent) return;
            el = el.parentElement;
        }
        this.halfKill();
    }

    private searchInput(e?: Event) {
        // If this is a event, prevent the default.
        if (e) e.preventDefault();
        if (!this.dropdownOverride) return;

        // Get the input element.
        const input = this.dropdownOverride.querySelector("input") as HTMLInputElement;

        // Get the value.
        const value = input.value.toLowerCase();

        // Get all the options containing the value somewhere.
        const options = this.dropdownOverride.querySelectorAll("[data-option]");
        for (let i = 0; i < options.length; i++) {
            const option = options[i] as HTMLDivElement;
            if (
                halfCaseInsensitiveIncludes(option.textContent || "", value) ||
                halfCaseInsensitiveIncludes(option.getAttribute("data-value") || "", value)
            ) {
                // Show the option.
                option.style.display = "";
            } else {
                // Hide the option.
                option.style.display = "none";
            }
        }

        // Return false.
        return false;
    }

    private onOptionClick(e: Event) {
        // Get the target.
        let target = e.target as HTMLElement;

        // Go back until we find the value.
        let value = target.getAttribute("data-value");
        while (!value) {
            if (target.parentElement) {
                target = target.parentElement;
                value = target.getAttribute("data-value");
            }
        }

        // Set the value.
        this.parent.value = value || "";

        // Dispatch a change event.
        this.parent.dispatchEvent(new Event("change"));

        // Half kill the custom select.
        this.halfKill();
    }

    private mount(prepopulate?: string) {
        // Check if this is a mobile device.
        const isMobile = window.innerWidth < 670;

        // Build the styles.
        const styles: OptStyles = {
            position: "absolute",
            zIndex: "999999",
        };
        if (isMobile) {
            // Mobile is full height and width.
            styles.top = "0px";
            styles.left = "0px";
            styles.width = "100%";
            styles.height = "100%";
        } else {
            // Get some size measurements from the DOM.
            const docHeight = document.documentElement.scrollHeight;
            const selectRect = this.parent.getBoundingClientRect();

            // Set the width value.
            styles.width = `${MENU_WIDTH}px`;

            // Get the left pixels as a number and then do maths from there.
            const left = selectRect.left + (selectRect.width / 2) - (MENU_WIDTH / 2);
            if (left < 0) {
                // The left is less than 0, so we need to set it to 0.
                styles.left = "0px";
            } else {
                // The left is greater than 0, so we can set it to a string.
                styles.left = `${left}px`;
            }

            // Set the height value.
            styles.height = `${MENU_HEIGHT}px`;

            // Get the top pixels as a number and then do maths from there.
            let top = selectRect.top + selectRect.height;
            if (top + MENU_HEIGHT > docHeight) {
                // The top might be too high. Try and move it up,
                let topAttempt = selectRect.top - MENU_HEIGHT;
                if (topAttempt > 0) {
                    // This is fine, set the top to the attempt.
                    top = topAttempt;
                }
            } else {
                // Do like 5px of margin on the top.
                top += 5;
            }
            styles.top = `${top}px`;
        }

        // Create the dropdown element.
        const dropdown = document.createElement("div");
        const id = `custom-select-${Math.random().toString(36).substring(2, 9)}`;
        dropdown.id = id;
        applyStyles(dropdown, styles);

        // Create the search box.
        const form = document.createElement("form");
        form.style.padding = "10px";
        form.autocomplete = "off";
        form.addEventListener("submit", e => {
            e.preventDefault();
            return false;
        });
        dropdown.appendChild(form);
        const searchBox = document.createElement("input");

        // Set the search box placeholder.
        searchBox.placeholder = this.searchPlaceholder;

        // Set the search box styles.
        applyStyles(searchBox, {
            width: "100%",
            height: "40px",
            padding: "10px",
            outline: "none",
            fontSize: "16px",
            boxSizing: "border-box",
            border: "none",
            borderRadius: "5px",
        });

        // Set the search box value.
        if (prepopulate !== undefined) searchBox.value = prepopulate;

        // Handle the search box input.
        searchBox.addEventListener("input", this.searchInput.bind(this));

        // Add the search box to the form.
        form.appendChild(searchBox);

        // Create the options container.
        const optionsContainer = document.createElement("div");
        applyStyles(optionsContainer, {
            height: "calc(100% - 63px)",
            overflowY: "auto",
        });
        dropdown.appendChild(optionsContainer);

        // Defines the name of the highlighted option class. Is randomly generated.
        const highlightedOptionClass = `highlighted-option-${Math.random().toString(36).substring(2, 9)}`;

        // Add the options.
        const parentChildren = this.parent.children;
        for (let i = 0; i < parentChildren.length; i++) {
            // Get the option elements.
            const child = parentChildren[i];
            if (!(child instanceof HTMLOptionElement)) continue;

            // Create the option element.
            const option = document.createElement("div");
            option.dataset.value = child.value;
            option.dataset.option = "true";
            const description = child.getAttribute("data-description");

            // Set the inner text within 2 dom elements of different boldness and size.
            const title = document.createElement("span");
            title.innerText = child.innerText;
            applyStyles(title, {
                fontWeight: "bold",
                fontSize: "16px",
            });
            option.appendChild(title);
            if (description !== null) {
                const desc = document.createElement("div");
                desc.innerText = description;
                applyStyles(desc, {
                    fontSize: "14px",
                });
                option.appendChild(desc);
            }

            // Set the option styles.
            applyStyles(option, {
                padding: "10px",
                cursor: "pointer",
                boxSizing: "border-box",
                width: "100%",
                height: "auto",
            });
            if (child.selected) {
                // Apply the selected class.
                option.className = highlightedOptionClass;
            }

            // Add the click event.
            option.addEventListener("click", this.onOptionClick.bind(this));

            // Set the tab index of this option to 0.
            option.setAttribute("tabindex", "0");

            // Add the keydown event.
            option.addEventListener("keydown", e => {
                if (e.key === "Enter" || e.key === " ") {
                    // The enter or space key was pressed. Click the option.
                    e.preventDefault();
                    this.onOptionClick(e);
                    return false;
                }
            });

            // Add the option to the options container.
            optionsContainer.appendChild(option);
        }

        // Create the CSS for the highlighted option.
        const style = document.createElement("style");
        const darkInput = `#${id} input {
    background-color: #202020;
    color: #fff;
}`
        let css = `#${id} {
    background-color: ${this.themeType === "dark" ? "#333" : "#e1e1e1"};
    color: ${this.themeType === "dark" ? "#fff" : "#000"};
}

.${highlightedOptionClass} {
    background-color: ${this.themeType === "dark" ? this.darkHighlightColor : this.lightHighlightColor};
    color: ${this.themeType === "dark" ? "#fff" : "#000"};
}

${this.themeType === "dark" ? darkInput : ""}
`;
        if (!this.themeType) {
            css += `@media (prefers-color-scheme: dark) {
    #${id} {
        background-color: #333;
        color: #fff;
    }

    ${darkInput}

    .${highlightedOptionClass} {
        background-color: ${this.darkHighlightColor};
        color: #fff;
    }
}`;
        }
        style.innerHTML = css;
        dropdown.appendChild(style);

        // Add the dropdown to the body.
        document.body.appendChild(dropdown);

        // Spawn a resize observer to check if this turns into or out of a mobile device.
        this.resizeObserver = new ResizeObserver(() => {
            const mobileChange = isMobile !== (window.innerWidth < 670);
            if (mobileChange) {
                // Half kill the dropdown and respawn it.
                const inputValue = searchBox.value;
                this.halfKill();
                this.mount(inputValue);
            }
        });
        this.resizeObserver.observe(document.body);

        // Set the element to the object.
        this.dropdownOverride = dropdown;

        // Focus the search box.
        searchBox.focus();

        // Run the search input handler.
        this.searchInput();
    }

    private onSelectKeyDown(e: KeyboardEvent) {
        if (e.key === "Enter" || e.key === " ") {
            // Treat this as a click.
            this.onSelectClick(e);
            return false;
        }

        // Ignore non-alphanumeric keys.
        if (e.key.length !== 1 || !e.key.match(/[A-Za-z0-9]/i)) return;

        // Prevent the default action.
        e.preventDefault();

        // If this isn't mounted, mount it.
        if (!this.dropdownOverride) {
            this.mount(e.key);
            return false;
        }

        // Add to the search box.
        const searchBox = this.dropdownOverride.querySelector("input") as HTMLInputElement;
        searchBox.value += e.key;

        // Trigger the input event.
        searchBox.dispatchEvent(new Event("input"));
    }

    private onSelectClick(e: Event) {
        e.preventDefault();

        // Focus the parent.
        this.parent.focus();

        if (this.dropdownOverride) {
            // Half kill the dropdown.
            this.halfKill();
            return false;
        }

        // Call the mount function.
        this.mount();
        return false;
    }

    unmount() {
        // Remove the key down and click events.
        this.parent.removeEventListener("keydown", this.keyEv);
        this.parent.removeEventListener("mousedown", this.clickEv);
        document.removeEventListener("mousedown", this.globalClickEv);
        document.removeEventListener("keydown", this.globalKeyEv);

        // Remove the dropdown override and resize observer.
        this.halfKill();

        // Restore the aria popup value.
        if (this.ariaPopupBackup) {
            this.parent.setAttribute("aria-haspopup", this.ariaPopupBackup);
        } else {
            this.parent.removeAttribute("aria-haspopup");
        }
    }
}
