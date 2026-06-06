import { useEffect } from "react";
import { getOpenErrors, loadStore } from "@/lib/store";

type Navigate = (path: string) => void;

function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  const tagName = target.tagName.toLowerCase();
  return (
    tagName === "input" ||
    tagName === "textarea" ||
    tagName === "select" ||
    target.isContentEditable
  );
}

function isActiveSessionRoute(location: string): boolean {
  return (
    location.startsWith("/router") ||
    location.startsWith("/practice") ||
    location.startsWith("/mock")
  );
}

export function useKeyboardShortcuts(location: string, navigate: Navigate) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (
        event.defaultPrevented ||
        event.metaKey ||
        event.ctrlKey ||
        event.altKey ||
        isTypingTarget(event.target) ||
        isActiveSessionRoute(location)
      ) {
        return;
      }

      const key = event.key.toLowerCase();
      const store = loadStore();
      const openErrors = getOpenErrors(store.practiceAttempts, store.cards);

      if (key === "r") {
        event.preventDefault();
        navigate("/router");
      } else if (key === "p") {
        event.preventDefault();
        navigate("/practice");
      } else if (key === "e" && openErrors > 0) {
        event.preventDefault();
        navigate("/review");
      } else if (key === "m") {
        event.preventDefault();
        navigate("/mock");
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [location, navigate]);
}
