// @vitest-environment jsdom
import { act, cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Button } from "../Button/Button";
import { Tooltip } from "./Tooltip";

// Testing Library advances fake timers only through a `jest` global; without it, its async
// helpers wait for a real timer that never fires under Vitest's fake timers.
const globals = globalThis as { jest?: { advanceTimersByTime(ms: number): void } };

beforeEach(() => {
  vi.useFakeTimers();
  globals.jest = { advanceTimersByTime: (ms) => vi.advanceTimersByTime(ms) };
});

afterEach(() => {
  cleanup();
  delete globals.jest;
  vi.useRealTimers();
});

function setup() {
  const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
  render(
    <>
      <Tooltip content="Öffnet die Navigation">
        <Button>Navigation</Button>
      </Tooltip>
      <Button>Credits</Button>
    </>,
  );
  return { user, trigger: screen.getByRole("button", { name: "Navigation" }) };
}

function advance(ms: number): void {
  act(() => {
    vi.advanceTimersByTime(ms);
  });
}

describe("Tooltip", () => {
  it("appears 200 ms after keyboard focus and is linked via aria-describedby", async () => {
    const { user, trigger } = setup();
    await user.tab();
    expect(document.activeElement).toBe(trigger);
    expect(screen.queryByRole("tooltip")).toBeNull();

    advance(199);
    expect(screen.queryByRole("tooltip")).toBeNull();
    advance(1);
    const tooltip = screen.getByRole("tooltip");
    expect(trigger.getAttribute("aria-describedby")).toBe(tooltip.id);
    expect(tooltip.textContent).toBe("Öffnet die Navigation");
  });

  it("hides with Escape", async () => {
    const { user } = setup();
    await user.tab();
    advance(200);
    expect(screen.queryByRole("tooltip")).not.toBeNull();
    await user.keyboard("{Escape}");
    expect(screen.queryByRole("tooltip")).toBeNull();
  });

  it("hides on blur", async () => {
    const { user } = setup();
    await user.tab();
    advance(200);
    expect(screen.queryByRole("tooltip")).not.toBeNull();
    await user.tab();
    expect(screen.queryByRole("tooltip")).toBeNull();
  });

  it("stays visible while the pointer moves onto the tooltip and hides after leaving both", async () => {
    const { user, trigger } = setup();
    await user.hover(trigger);
    expect(screen.queryByRole("tooltip")).toBeNull();
    advance(200);
    const tooltip = screen.getByRole("tooltip");

    await user.hover(tooltip);
    advance(200);
    expect(screen.queryByRole("tooltip")).not.toBeNull();

    await user.hover(screen.getByRole("button", { name: "Credits" }));
    expect(screen.queryByRole("tooltip")).toBeNull();
  });
});
