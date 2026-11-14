import type { Meta, StoryObj } from "@storybook/react-vite";
import { Navigation } from "lucide-react";
import { Button } from "../Button/Button";
import { Card } from "./Card";

const meta = {
  title: "Komponenten/Karte",
  component: Card,
  args: {
    title: "Schiff LEVIATHAN-1",
    children: "Angedockt an X1-DF55-20250Z. Fracht: 12 von 40 Einheiten.",
  },
} satisfies Meta<typeof Card>;

export default meta;
type Story = StoryObj<typeof meta>;

export const MitKopf: Story = {};

export const OhneKopf: Story = {
  args: { title: undefined, children: "Kontostand: 175.000 Credits" },
};

export const MitAktion: Story = {
  args: {
    actions: (
      <Button variant="quiet" icon={Navigation}>
        Navigation
      </Button>
    ),
  },
};

export const Aktiv: Story = { args: { active: true } };
