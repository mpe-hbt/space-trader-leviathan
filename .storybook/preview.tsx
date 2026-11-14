import type { Preview } from "@storybook/react-vite";
import "../src/renderer/src/theme/fonts";
import "../src/renderer/src/theme/global.css";
import { applyTheme } from "../src/renderer/src/theme/apply";
import "./preview.css";

applyTheme(document);
document.documentElement.lang = "de";

const preview: Preview = {
  parameters: {
    // The dark theme from the design tokens is the only background.
    backgrounds: { disable: true },
    layout: "padded",
  },
};

export default preview;
