import type { Meta, StoryObj } from "@storybook/react-vite";
import { Navigation, Rocket, Trash2 } from "lucide-react";
import { Button, type ButtonVariant } from "./Button";

const meta = {
  title: "Komponenten/Button",
  component: Button,
  args: { children: "Schiff starten", variant: "primary" },
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

const variants: { variant: ButtonVariant; label: string }[] = [
  { variant: "primary", label: "Schiff starten" },
  { variant: "secondary", label: "Navigation" },
  { variant: "quiet", label: "Details" },
  { variant: "danger", label: "Fracht abwerfen" },
];

export const Einzeln: Story = {};

export const AlleVarianten: Story = {
  render: () => (
    <div className="stl-story-grid">
      {variants.map(({ variant, label }) => (
        <div key={variant} className="stl-story-row">
          <Button variant={variant}>{label}</Button>
          <Button variant={variant} disabled>
            {label}
          </Button>
          <Button variant={variant} loading>
            {label}
          </Button>
        </div>
      ))}
    </div>
  ),
};

export const MitIcon: Story = {
  render: () => (
    <div className="stl-story-row">
      <Button variant="primary" icon={Rocket}>
        Schiff starten
      </Button>
      <Button variant="secondary" icon={Navigation}>
        Navigation
      </Button>
      <Button variant="danger" icon={Trash2}>
        Fracht abwerfen
      </Button>
    </div>
  ),
};

export const Deaktiviert: Story = { args: { disabled: true } };

export const Lädt: Story = { args: { loading: true, children: "Credits werden gebucht" } };
