import type { Meta, StoryObj } from "@storybook/react-vite";
import { Table, type TableColumn } from "./Table";

interface Ship {
  symbol: string;
  role: string;
  location: string;
  credits: number;
}

const ships: Ship[] = [
  { symbol: "LEVIATHAN-1", role: "Kommando", location: "X1-DF55-20250Z", credits: 175000 },
  { symbol: "LEVIATHAN-2", role: "Frachter", location: "X1-DF55-17335A", credits: 42350 },
  { symbol: "LEVIATHAN-3", role: "Sonde", location: "X1-DF55-69207D", credits: 980 },
];

const columns: TableColumn<Ship>[] = [
  {
    key: "symbol",
    header: "Schiff",
    sortable: true,
    render: (s) => s.symbol,
    sortValue: (s) => s.symbol,
  },
  { key: "role", header: "Rolle", render: (s) => s.role },
  { key: "location", header: "Navigation", render: (s) => s.location },
  {
    key: "credits",
    header: "Credits",
    numeric: true,
    sortable: true,
    render: (s) => s.credits.toLocaleString("de-DE"),
    sortValue: (s) => s.credits,
  },
];

const meta = {
  title: "Komponenten/Tabelle",
  component: Table<Ship>,
  args: { caption: "Flotte", rows: ships, rowKey: (s: Ship) => s.symbol, columns },
} satisfies Meta<typeof Table<Ship>>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Unsortiert: Story = {};

export const NachCreditsAbsteigend: Story = {
  args: { initialSort: { key: "credits", direction: "descending" } },
};
