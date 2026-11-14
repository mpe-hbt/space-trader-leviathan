import { useEffect, useState, type FormEvent } from "react";
import {
  SECRET_NAMES,
  type SaveResult,
  type SecretName,
  type SettingsStatus,
} from "@leviathan/shared";
import { Badge, Button, Dialog } from "../components";
import { LOAD_FAILED_MESSAGE, SAVE_FAILED_MESSAGE, settingsMessages } from "./messages";

const LABELS: Record<SecretName, string> = {
  anthropicApiKey: "Anthropic-API-Key",
  githubToken: "GitHub-Token",
};

interface SettingsDialogProps {
  open: boolean;
  onClose(): void;
}

export function SettingsDialog({ open, onClose }: SettingsDialogProps) {
  const [status, setStatus] = useState<SettingsStatus | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;

    let active = true;
    window.leviathan.getSettings().then(
      (settings) => {
        if (!active) return;
        setStatus(settings);
        setError(null);
      },
      () => {
        if (active) setError(LOAD_FAILED_MESSAGE);
      },
    );
    const unsubscribe = window.leviathan.onCoreEvent((event) => {
      if (event.type === "settings-changed") setStatus(event.settings);
    });
    return () => {
      active = false;
      unsubscribe();
    };
  }, [open]);

  function handleResult(result: SaveResult): void {
    if (result.ok) {
      setStatus(result.settings);
      setError(null);
    } else {
      setError(result.message);
    }
  }

  async function save(name: SecretName, input: HTMLInputElement): Promise<void> {
    try {
      handleResult(await window.leviathan.setSecret(name, input.value));
    } catch {
      setError(SAVE_FAILED_MESSAGE);
    } finally {
      input.value = "";
    }
  }

  async function clear(name: SecretName): Promise<void> {
    try {
      handleResult(await window.leviathan.clearSecret(name));
    } catch {
      setError(SAVE_FAILED_MESSAGE);
    }
  }

  const messages = status ? settingsMessages(status) : [];

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Einstellungen"
      footer={
        <Button variant="secondary" onClick={onClose}>
          Schließen
        </Button>
      }
    >
      {error && (
        <p role="alert">
          <Badge tone="danger">{error}</Badge>
        </p>
      )}
      {messages.length > 0 && (
        <ul>
          {messages.map((message) => (
            <li key={message}>
              <Badge tone="warning">{message}</Badge>
            </li>
          ))}
        </ul>
      )}
      {SECRET_NAMES.map((name) => {
        const configured = status?.secrets[name].configured ?? false;
        const inputId = `secret-${name}`;
        const onSubmit = (event: FormEvent<HTMLFormElement>) => {
          event.preventDefault();
          const input = event.currentTarget.elements.namedItem("value");
          if (input instanceof HTMLInputElement) void save(name, input);
        };
        return (
          <form key={name} onSubmit={onSubmit}>
            <label htmlFor={inputId}>{LABELS[name]}</label>{" "}
            <input id={inputId} name="value" type="password" autoComplete="off" />{" "}
            <Badge tone={configured ? "success" : "info"}>
              {configured ? "hinterlegt" : "nicht hinterlegt"}
            </Badge>{" "}
            <Button variant="primary" type="submit">
              Speichern
            </Button>{" "}
            <Button variant="danger" disabled={!configured} onClick={() => void clear(name)}>
              Entfernen
            </Button>
          </form>
        );
      })}
    </Dialog>
  );
}
