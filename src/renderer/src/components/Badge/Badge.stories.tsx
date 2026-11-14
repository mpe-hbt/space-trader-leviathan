import type { Meta, StoryObj } from "@storybook/react-vite";
import { Badge } from "./Badge";

const meta = {
  title: "Komponenten/Badge",
  component: Badge,
  args: { tone: "success", children: "Schiff angedockt" },
} satisfies Meta<typeof Badge>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Erfolg: Story = {};
export const Warnung: Story = { args: { tone: "warning", children: "Treibstoff knapp" } };
export const Fehler: Story = { args: { tone: "danger", children: "Zu wenig Credits" } };
export const Info: Story = { args: { tone: "info", children: "Schiff unterwegs" } };

export const AlleTöne: Story = {
  render: () => (
    <div className="stl-story-row">
      <Badge tone="success">Schiff angedockt</Badge>
      <Badge tone="warning">Treibstoff knapp</Badge>
      <Badge tone="danger">Zu wenig Credits</Badge>
      <Badge tone="info">Schiff unterwegs</Badge>
    </div>
  ),
};
