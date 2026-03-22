/** @jsxImportSource preact */
import { useEffect, useRef } from "preact/hooks";

export default function BuyMeCoffeeButton() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const script = document.createElement("script");
    script.type = "text/javascript";
    script.src = "https://cdnjs.buymeacoffee.com/1.0.0/button.prod.min.js";
    script.setAttribute("data-name", "bmc-button");
    script.setAttribute("data-slug", "davpin");
    script.setAttribute("data-color", "#FFDD00");
    script.setAttribute("data-emoji", "");
    script.setAttribute("data-font", "Cookie");
    script.setAttribute("data-text", "Buy me a coffee");
    script.setAttribute("data-outline-color", "#000000");
    script.setAttribute("data-font-color", "#000000");
    script.setAttribute("data-coffee-color", "#ffffff");
    containerRef.current.appendChild(script);
  }, []);

  return (
    <div
      ref={containerRef}
      class="mt-4 flex justify-center"
      data-bmc-container
    />
  );
}
