import { Sun, Moon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";

interface ThemeToggleProps {
  isDark?: boolean;
  onToggle?: (dark: boolean) => void;
}

export default function ThemeToggle({ isDark: controlledDark, onToggle }: ThemeToggleProps = {}) {
  const [localDark, setLocalDark] = useState(() => {
    if (typeof window === "undefined") return true;
    return document.documentElement.classList.contains("theme-dark");
  });

  const isDark = controlledDark ?? localDark;

  useEffect(() => {
    if (controlledDark !== undefined) return;
    const html = document.documentElement;
    html.classList.remove("theme-light", "theme-dark");
    html.classList.add(isDark ? "theme-dark" : "theme-light");
  }, [isDark, controlledDark]);

  const toggle = () => {
    const next = !isDark;
    if (onToggle) {
      onToggle(next);
    } else {
      setLocalDark(next);
    }
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      className="h-8 w-8"
      onClick={toggle}
      title={isDark ? "Tema claro" : "Tema escuro"}
    >
      {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </Button>
  );
}
