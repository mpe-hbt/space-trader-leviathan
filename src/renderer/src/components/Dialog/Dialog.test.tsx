// @vitest-environment jsdom
import { useState } from "react";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Button } from "../Button/Button";
import { Dialog } from "./Dialog";

afterEach(cleanup);

function Harness({ onClose }: { onClose?: () => void }) {
  const [open, setOpen] = useState(false);
  const close = () => {
    onClose?.();
    setOpen(false);
  };
  return (
    <>
      <Button onClick={() => setOpen(true)}>Navigation</Button>
      <Dialog
        open={open}
        onClose={close}
        title="Schiff"
        footer={<Button onClick={close}>Schließen</Button>}
      >
        <Button>Erster</Button>
        <Button>Zweiter</Button>
      </Dialog>
    </>
  );
}

describe("Dialog", () => {
  it("traps focus, closes with Escape and returns focus to the opener", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(<Harness onClose={onClose} />);
    const opener = screen.getByRole("button", { name: "Navigation" });

    await user.click(opener);
    const dialog = screen.getByRole("dialog");
    expect(dialog.getAttribute("aria-modal")).toBe("true");
    expect(document.activeElement).toBe(screen.getByRole("button", { name: "Erster" }));

    await user.tab();
    expect(document.activeElement).toBe(screen.getByRole("button", { name: "Zweiter" }));
    await user.tab();
    const last = screen.getByRole("button", { name: "Schließen" });
    expect(document.activeElement).toBe(last);

    await user.tab();
    expect(document.activeElement).toBe(screen.getByRole("button", { name: "Erster" }));
    await user.tab({ shift: true });
    expect(document.activeElement).toBe(last);

    await user.keyboard("{Escape}");
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(document.activeElement).toBe(opener);
  });

  it("is labelled by its title", async () => {
    const user = userEvent.setup();
    render(<Harness />);
    await user.click(screen.getByRole("button", { name: "Navigation" }));
    expect(screen.getByRole("dialog", { name: "Schiff" })).toBeTruthy();
  });
});
