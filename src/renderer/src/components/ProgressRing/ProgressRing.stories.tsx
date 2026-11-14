import type { Meta, StoryObj } from "@storybook/react-vite";
import { ProgressRing } from "./ProgressRing";

const meta = {
  title: "Komponenten/Fortschrittsring",
  component: ProgressRing,
  args: { value: 50, remaining: "2:30", label: "Ankunft", kind: "arrival" },
} satisfies Meta<typeof ProgressRing>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Ankunft: Story = {};
export const Cooldown: Story = { args: { kind: "cooldown", label: "Cooldown", remaining: "0:45" } };

export const AlleStufen: Story = {
  render: () => (
    <div className="stl-story-row">
      <ProgressRing kind="arrival" label="Ankunft" value={0} remaining="5:00" />
      <ProgressRing kind="arrival" label="Ankunft" value={50} remaining="2:30" />
      <ProgressRing kind="arrival" label="Ankunft" value={100} remaining="0:00" />
      <ProgressRing kind="cooldown" label="Cooldown" value={0} remaining="1:30" />
      <ProgressRing kind="cooldown" label="Cooldown" value={50} remaining="0:45" />
      <ProgressRing kind="cooldown" label="Cooldown" value={100} remaining="0:00" />
    </div>
  ),
};
