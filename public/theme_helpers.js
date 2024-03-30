var themeHelpers = (() => {
  function safeColor(color) {
    if (color.length === 3) {
      let newColor = "";
      for (const char of color) {
        newColor += char + char;
      }
      return newColor;
    }
    return color;
  }
  return {
    changeThemeMode: (e) => {
      const themeSelector = $("[data-fieldname=theme]")[0];
      if (themeSelector) {
        const currentTheme = themeSelector.value;
        const color = themeColors[currentTheme][`${e.value}Bg`];
        $("[data-fieldname='backgroundColor']")[0].value = `#${safeColor(
          color
        )}`;
      }
    },
    changeTheme: (e) => {
      const colors = themeColors[e.value];
      for (const key of Object.keys(colors)) {
        const input = $(`[data-fieldname=${key}]`)[0];
        const color = colors[key];
        if (input) input.value = `#${safeColor(color)}`;
      }
      const currentMode = $("[data-fieldname=mode]")[0].value;
      $("[data-fieldname='backgroundColor']")[0].value =
        currentMode === "dark"
          ? `#${safeColor(colors.darkBg)}`
          : `#${safeColor(colors.lightBg)}`;
    },
  };
})();
