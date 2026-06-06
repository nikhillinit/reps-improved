import { useEffect, type DependencyList } from "react";

type KeyHandler = (event: KeyboardEvent) => void;

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

export function useHotkeys(
  keyMap: Record<string, KeyHandler>,
  dependencies: DependencyList = []
) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (
        event.defaultPrevented ||
        event.metaKey ||
        event.ctrlKey ||
        event.altKey ||
        isTypingTarget(event.target)
      ) {
        return;
      }

      const handler = keyMap[event.key];
      if (!handler) return;

      if (event.key === " ") event.preventDefault();
      handler(event);
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, dependencies);
}
