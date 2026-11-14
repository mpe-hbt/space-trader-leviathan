// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";
import { Table, type TableColumn } from "./Table";

afterEach(cleanup);

interface Ship {
  symbol: string;
  credits: number;
}

const rows: Ship[] = [
  { symbol: "LEVIATHAN-2", credits: 500 },
  { symbol: "LEVIATHAN-1", credits: 1500 },
  { symbol: "LEVIATHAN-3", credits: 20 },
];

const columns: TableColumn<Ship>[] = [
  { key: "symbol", header: "Schiff", render: (s) => s.symbol },
  {
    key: "credits",
    header: "Credits",
    numeric: true,
    sortable: true,
    render: (s) => String(s.credits),
    sortValue: (s) => s.credits,
  },
];

function shipOrder(): string[] {
  return screen
    .getAllByRole("row")
    .slice(1)
    .map((row) => row.querySelector("td")?.textContent ?? "");
}

describe("Table", () => {
  it("sorts a column ascending and descending with the keyboard", async () => {
    const user = userEvent.setup();
    render(<Table caption="Flotte" rows={rows} rowKey={(s) => s.symbol} columns={columns} />);
    const header = screen.getByRole("columnheader", { name: /Credits/ });
    expect(header.getAttribute("aria-sort")).toBe("none");
    expect(shipOrder()).toEqual(["LEVIATHAN-2", "LEVIATHAN-1", "LEVIATHAN-3"]);

    await user.tab();
    expect(document.activeElement).toBe(screen.getByRole("button", { name: /Credits/ }));

    await user.keyboard("{Enter}");
    expect(header.getAttribute("aria-sort")).toBe("ascending");
    expect(shipOrder()).toEqual(["LEVIATHAN-3", "LEVIATHAN-2", "LEVIATHAN-1"]);

    await user.keyboard("{Enter}");
    expect(header.getAttribute("aria-sort")).toBe("descending");
    expect(shipOrder()).toEqual(["LEVIATHAN-1", "LEVIATHAN-2", "LEVIATHAN-3"]);
  });

  it("marks numeric cells", () => {
    render(<Table caption="Flotte" rows={rows} rowKey={(s) => s.symbol} columns={columns} />);
    const cell = screen.getByRole("cell", { name: "1500" });
    expect(cell.className).toContain("stl-table__cell--numeric");
    expect(
      screen.getByRole("columnheader", { name: "Schiff" }).getAttribute("aria-sort"),
    ).toBeNull();
  });
});
