import { useEffect } from 'react';

/**
 * Suppress the system webview context menu so right-clicks only open app-owned
 * menus. Tauri uses different webviews per OS, but they all honor the DOM
 * contextmenu cancellation.
 */
export function useDisableWebviewContextMenu() {
  useEffect(() => {
    if (!import.meta.env.PROD) {
      return;
    }

    const handleContextMenu = (event: MouseEvent) => {
      event.preventDefault();
    };

    document.addEventListener('contextmenu', handleContextMenu, { capture: true });

    return () => {
      document.removeEventListener('contextmenu', handleContextMenu, { capture: true });
    };
  }, []);
}
