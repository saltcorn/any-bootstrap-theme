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
      const color = themeColors[currentTheme][`${e.value}Bg`];
      const existingInput = $("[name='backgroundColor']")[0];
      if (existingInput) existingInput.value = `#${safeColor(color)}`;
    },
    changeTheme: (e) => {
      currentTheme = e.value;
      const colors = themeColors[currentTheme];
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

      $(
        "[name='sass_file_name']"
      )[0].value = `bootstrap.min.${tenantSchema}.${currentTheme}.${new Date().valueOf()}.css`;
    },
    bsColorChanged: (e) => {
      $(
        "[name='sass_file_name']"
      )[0].value = `bootstrap.min.${tenantSchema}.${currentTheme}.${new Date().valueOf()}.css`;
    },
  };
})();
