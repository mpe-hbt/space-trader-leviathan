import type { Meta, StoryObj } from "@storybook/react-vite";
import { Navigation } from "lucide-react";
import { Button } from "../Button/Button";
import { Tooltip } from "./Tooltip";

const meta = {
  title: "Komponenten/Tooltip",
  component: Tooltip,
  args: {
    content: "Öffnet die Navigation für das gewählte Schiff.",
    children: (
      <Button variant="secondary" icon={Navigation}>
        Navigation
      </Button>
    ),
  },
} satisfies Meta<typeof Tooltip>;

export default meta;
type Story = StoryObj<typeof meta>;

export const AnButton: Story = {};

export const AnPrimärButton: Story = {
  args: {
    content: "Kostet 1.200 Credits Treibstoff.",
    children: <Button variant="primary">Schiff starten</Button>,
  },
};
