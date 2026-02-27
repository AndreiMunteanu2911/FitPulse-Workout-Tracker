// Theme initialization script - runs immediately to prevent flash of wrong theme
export const themeInitScript = `
(function() {
  try {
    var theme = localStorage.getItem("theme-storage");
    if (theme) {
      var parsed = JSON.parse(theme);
      if (parsed.state && parsed.state.isDark) {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
    }
  } catch (e) {
    // Ignore errors
  }
})();
`;
