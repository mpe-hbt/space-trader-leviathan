import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { Button } from "../Button/Button";
import { Dialog } from "./Dialog";

const meta = {
  title: "Komponenten/Dialog",
  component: Dialog,
  args: { open: true, title: "Schiff verkaufen?", onClose: () => {} },
} satisfies Meta<typeof Dialog>;

export default meta;
type Story = StoryObj<typeof meta>;

function DialogDemo({ initiallyOpen }: { initiallyOpen: boolean }) {
  const [open, setOpen] = useState(initiallyOpen);
  const close = () => setOpen(false);
  return (
    <>
      <Button variant="primary" onClick={() => setOpen(true)}>
        Dialog öffnen
      </Button>
      <Dialog
        open={open}
        onClose={close}
        title="Schiff verkaufen?"
        footer={
          <>
            <Button variant="secondary" onClick={close}>
              Schließen
            </Button>
            <Button variant="danger" onClick={close}>
              Verkaufen
            </Button>
          </>
        }
      >
        <p>LEVIATHAN-3 wird für 12.500 Credits verkauft. Die Navigation zur Werft entfällt.</p>
      </Dialog>
    </>
  );
}

export const Offen: Story = { render: () => <DialogDemo initiallyOpen /> };

export const Geschlossen: Story = { render: () => <DialogDemo initiallyOpen={false} /> };
