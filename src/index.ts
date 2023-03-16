// cleaner-select. Copyright (C) Web Scale Software Ltd 2023.
// This code is licensed under the MIT license. See the LICENSE file for details.

import CustomSelect from "./CustomSelect";

export type UnmountMethod = () => void;

export const mount = (select: HTMLSelectElement): UnmountMethod => {
    // Get the dataset.
    let {
        searchText, forceTheme, darkHighlightColor, lightHighlightColor,
    } = select.dataset;

    // Validate everything that we grabbed.
    if (!searchText) searchText = "Search...";
    if (forceTheme) {
        forceTheme = forceTheme.toLowerCase();
    } else {
        forceTheme = undefined;
    }
    if (!darkHighlightColor) darkHighlightColor = "#0176ff";
    if (!lightHighlightColor) lightHighlightColor = "#77b9fc";

    // Change the force theme type.
    let forceThemeType: "light" | "dark" | undefined;
    switch (forceTheme) {
        case "light":
        case "dark":
        case undefined:
            forceThemeType = forceTheme;
            break;
        default:
            throw new Error(`Invalid force theme: ${forceTheme}`);
    }

    // Mount everything and return the unmount function.
    const selectHn = new CustomSelect(
        select, searchText, forceThemeType, darkHighlightColor, lightHighlightColor,
    );
    return () => selectHn.unmount();
};
