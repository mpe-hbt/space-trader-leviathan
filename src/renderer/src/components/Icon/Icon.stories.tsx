import type { Meta, StoryObj } from "@storybook/react-vite";
import { Navigation, Rocket, Coins } from "lucide-react";
import { Icon } from "./Icon";

const meta = {
  title: "Komponenten/Icon",
  component: Icon,
  args: { icon: Rocket },
} satisfies Meta<typeof Icon>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Dekorativ: Story = {};

export const MitBeschriftung: Story = { args: { icon: Navigation, label: "Navigation" } };

export const Groß: Story = { args: { icon: Coins, size: 32, label: "Credits" } };
