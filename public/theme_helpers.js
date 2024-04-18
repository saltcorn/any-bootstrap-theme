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
    changeTheme: (e) => {
      currentTheme = e.value;
      const colors = themeColors[currentTheme];
      if (!colors)
        for (const fName of [
          "backgroundColor",
          "cardBackgroundColor",
          "cardHeaderBackgroundColor",
          "cardFooterBackgroundColor",
        ])
          $(`[data-fieldname='${fName}']`)[0].value = "#ffffff";
      else {
        for (const key of Object.keys(colors)) {
          const input = $(`[data-fieldname=${key}]`)[0];
          const color = colors[key];
          if (input) input.value = `#${safeColor(color)}`;
        }
        for (const fName of [
          "backgroundColorDark",
          "cardBackgroundColorDark",
          "cardHeaderBackgroundColorDark",
          "cardFooterBackgroundColorDark",
        ]) {
          $("[data-fieldname='" + fName + "']")[0].value = `#${safeColor(
            colors.darkBg
          )}`;
        }
        for (const fName of [
          "backgroundColor",
          "cardBackgroundColor",
          "cardHeaderBackgroundColor",
          "cardFooterBackgroundColor",
        ]) {
          $("[data-fieldname='" + fName + "']")[0].value = `#${safeColor(
            colors.lightBg
          )}`;
        }

        $(
          "[name='sass_file_name']"
        )[0].value = `bootstrap.min.${tenantSchema}.${currentTheme}.${new Date().valueOf()}.css`;
      }
    },
    bsColorChanged: (e) => {
      $(
        "[name='sass_file_name']"
      )[0].value = `bootstrap.min.${tenantSchema}.${currentTheme}.${new Date().valueOf()}.css`;
    },
  };
})();
