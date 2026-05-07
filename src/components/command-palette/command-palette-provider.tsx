"use client";

import * as React from "react";
import { CommandPalette } from "./index";
import { HelpDialog } from "./help-dialog";
import { useKeyboardShortcuts } from "@/hooks/use-keyboard-shortcuts";

interface CommandPaletteContextValue {
  openCmdK: () => void;
  openHelp: () => void;
}

const CommandPaletteContext = React.createContext<CommandPaletteContextValue | null>(
  null
);

export function useCommandPalette() {
  const ctx = React.useContext(CommandPaletteContext);
  if (!ctx) {
    throw new Error(
      "useCommandPalette debe usarse dentro de <CommandPaletteProvider>"
    );
  }
  return ctx;
}

export function CommandPaletteProvider({
  children,
  isAdmin,
}: {
  children: React.ReactNode;
  isAdmin: boolean;
}) {
  const [open, setOpen] = React.useState(false);
  const [helpOpen, setHelpOpen] = React.useState(false);

  useKeyboardShortcuts({
    onOpenCmdK: () => setOpen(true),
    onOpenHelp: () => setHelpOpen(true),
  });

  return (
    <CommandPaletteContext.Provider
      value={{
        openCmdK: () => setOpen(true),
        openHelp: () => setHelpOpen(true),
      }}
    >
      {children}
      <CommandPalette
        open={open}
        onOpenChange={setOpen}
        isAdmin={isAdmin}
      />
      <HelpDialog open={helpOpen} onOpenChange={setHelpOpen} />
    </CommandPaletteContext.Provider>
  );
}
