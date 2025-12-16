/**
 * SidebarControls Component
 * Adds collapse/expand and resize functionality to the Docusaurus sidebar
 */
import { useEffect, useRef, useCallback } from "react";

const STORAGE_KEY_COLLAPSED = "phoenix-sidebar-collapsed";
const STORAGE_KEY_WIDTH = "phoenix-sidebar-width";
const DEFAULT_WIDTH = 280;
const MIN_WIDTH = 200;
const MAX_WIDTH = 400;

export function SidebarControls(): null {
  const isResizing = useRef(false);
  const startX = useRef(0);
  const startWidth = useRef(DEFAULT_WIDTH);

  // Initialize sidebar state from localStorage
  useEffect(() => {
    const sidebar = document.querySelector(
      ".theme-doc-sidebar-container"
    ) as HTMLElement;
    if (!sidebar) return;

    // Restore collapsed state
    const isCollapsed = localStorage.getItem(STORAGE_KEY_COLLAPSED) === "true";
    if (isCollapsed) {
      sidebar.classList.add("sidebar--collapsed");
    }

    // Restore width
    const savedWidth = localStorage.getItem(STORAGE_KEY_WIDTH);
    if (savedWidth && !isCollapsed) {
      const width = Math.min(Math.max(parseInt(savedWidth, 10), MIN_WIDTH), MAX_WIDTH);
      sidebar.style.setProperty("--sidebar-width", `${width}px`);
    }

    // Add toggle button if not exists
    if (!sidebar.querySelector(".sidebar-toggle")) {
      const toggleBtn = document.createElement("button");
      toggleBtn.className = "sidebar-toggle";
      toggleBtn.setAttribute("aria-label", "Toggle sidebar");
      toggleBtn.setAttribute("title", "Toggle sidebar (Ctrl+B)");
      toggleBtn.innerHTML = '<span class="sidebar-toggle__icon">◀</span>';
      toggleBtn.addEventListener("click", handleToggle);
      sidebar.appendChild(toggleBtn);
    }

    // Add resize handle if not exists
    if (!sidebar.querySelector(".sidebar-resize-handle")) {
      const resizeHandle = document.createElement("div");
      resizeHandle.className = "sidebar-resize-handle";
      resizeHandle.setAttribute("aria-label", "Resize sidebar");
      resizeHandle.setAttribute("title", "Drag to resize sidebar");
      resizeHandle.addEventListener("mousedown", handleResizeStart);
      sidebar.appendChild(resizeHandle);
    }

    // Keyboard shortcut (Ctrl+B)
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === "b") {
        e.preventDefault();
        handleToggle();
      }
    };
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  const handleToggle = useCallback(() => {
    const sidebar = document.querySelector(
      ".theme-doc-sidebar-container"
    ) as HTMLElement;
    if (!sidebar) return;

    const isCollapsed = sidebar.classList.toggle("sidebar--collapsed");
    localStorage.setItem(STORAGE_KEY_COLLAPSED, String(isCollapsed));
  }, []);

  const handleResizeStart = useCallback((e: MouseEvent) => {
    const sidebar = document.querySelector(
      ".theme-doc-sidebar-container"
    ) as HTMLElement;
    if (!sidebar || sidebar.classList.contains("sidebar--collapsed")) return;

    e.preventDefault();
    isResizing.current = true;
    startX.current = e.clientX;
    startWidth.current =
      parseInt(
        getComputedStyle(sidebar).getPropertyValue("--sidebar-width"),
        10
      ) || DEFAULT_WIDTH;

    const handle = sidebar.querySelector(".sidebar-resize-handle");
    handle?.classList.add("resizing");
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";

    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing.current) return;

      const delta = e.clientX - startX.current;
      const newWidth = Math.min(
        Math.max(startWidth.current + delta, MIN_WIDTH),
        MAX_WIDTH
      );
      sidebar.style.setProperty("--sidebar-width", `${newWidth}px`);
    };

    const handleMouseUp = () => {
      if (!isResizing.current) return;

      isResizing.current = false;
      handle?.classList.remove("resizing");
      document.body.style.cursor = "";
      document.body.style.userSelect = "";

      // Save width to localStorage
      const currentWidth = getComputedStyle(sidebar).getPropertyValue(
        "--sidebar-width"
      );
      localStorage.setItem(STORAGE_KEY_WIDTH, parseInt(currentWidth, 10).toString());

      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  }, []);

  // This component doesn't render anything, it just adds functionality
  return null;
}

export default SidebarControls;
