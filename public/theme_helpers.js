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
      const newTheme = e.value === "bootstrap" ? "lux" : e.value;
      if (newTheme !== currentTheme) {
        currentTheme = newTheme;
        const colors = themeColors[currentTheme];
        if (!colors)
          for (const fName of ["backgroundColor", "cardBackgroundColor"])
            $(`[data-fieldname='${fName}']`)[0].value = "#ffffff";
        else {
          for (const key of Object.keys(colors)) {
            const input = $(`[data-fieldname=${key}]`)[0];
            const color = colors[key];
            if (input) input.value = `#${safeColor(color)}`;

            const darkInput = $(`[data-fieldname=${key}Dark]`)[0];
            if (darkInput) darkInput.value = `#${safeColor(color)}`;
          }
          for (const fName of [
            "backgroundColorDark",
            "cardBackgroundColorDark",
          ]) {
            $("[data-fieldname='" + fName + "']")[0].value = `#${safeColor(
              colors.darkBg
            )}`;
          }
          for (const fName of ["backgroundColor", "cardBackgroundColor"]) {
            $("[data-fieldname='" + fName + "']")[0].value = `#${safeColor(
              colors.lightBg
            )}`;
          }
          for (const fName of [
            "cardHeaderText",
            "cardFooterText",
            "cardHeaderTextDark",
            "cardFooterTextDark",
          ]) {
            $("[data-fieldname='" + fName + "']")[0].value = `#${safeColor(
              colors.primary
            )}`;
          }
          const now = new Date().valueOf();
          $(
            "[name='sass_file_name']"
          )[0].value = `bootstrap.min.${tenantSchema}.${currentTheme}.${now}.css`;
          $(
            "[name='sass_file_name_dark']"
          )[0].value = `bootstrap.min.${tenantSchema}.${currentTheme}.${now}.dark.css`;
        }
      }
    },
    bsColorChanged: (e) => {
      const now = new Date().valueOf();
      $(
        "[name='sass_file_name']"
      )[0].value = `bootstrap.min.${tenantSchema}.${currentTheme}.${now}.css`;
      $(
        "[name='sass_file_name_dark']"
      )[0].value = `bootstrap.min.${tenantSchema}.${currentTheme}.${now}.dark.css`;
    },
  };
})();
