import React, { useCallback, useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import { Excalidraw, exportToSvg } from "@excalidraw/excalidraw";
import "@excalidraw/excalidraw/index.css";
import "./styles.css";

const STORAGE_KEY = "plash-excalidraw-scene-v1";
const SVG_KEY = "plash-excalidraw-svg-v1";
const CHANNEL = "plash-excalidraw-sync";

const starterScene = [
  {
    id: "welcome-text", type: "text", x: 80, y: 80, width: 360, height: 40,
    angle: 0, strokeColor: "#ffffff", backgroundColor: "transparent", fillStyle: "solid",
    strokeWidth: 2, strokeStyle: "solid", roughness: 0, opacity: 100, groupIds: [],
    frameId: null, roundness: null, seed: 12345, version: 1, versionNonce: 67890,
    isDeleted: false, boundElements: null, updated: 1, link: null, locked: false,
    text: "Нарисуй что-нибудь ✦", fontSize: 32, fontFamily: 1, textAlign: "left",
    verticalAlign: "top", containerId: null, originalText: "Нарисуй что-нибудь ✦", lineHeight: 1.25,
  },
];

function loadScene() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) ?? starterScene;
  } catch {
    return starterScene;
  }
}

async function renderSvg(elements) {
  const svg = await exportToSvg({
    elements: elements.filter((element) => !element.isDeleted),
    appState: { exportBackground: false, viewBackgroundColor: "transparent" },
    files: {},
  });
  return new XMLSerializer().serializeToString(svg);
}

function Wallpaper() {
  const [svg, setSvg] = useState("");

  useEffect(() => {
    const refresh = async () => {
      try {
        const response = await fetch(`/api/wallpaper?at=${Date.now()}`, { cache: "no-store" });
        if (response.ok) setSvg(await response.text());
      } catch { /* The editor's browser-local fallback is still useful in normal tabs. */ }
    };
    refresh();
    const timer = window.setInterval(refresh, 900);
    return () => {
      window.clearInterval(timer);
    };
  }, []);

  return <main className="wallpaper" aria-label="Прозрачный рисунок" dangerouslySetInnerHTML={{ __html: svg }} />;
}

function Editor({ plash = false }) {
  const [initialData] = useState(() => ({
    elements: loadScene(),
    appState: { viewBackgroundColor: plash ? "transparent" : "#171717" },
  }));
  const [status, setStatus] = useState("Готово");
  const channel = useMemo(() => new BroadcastChannel(CHANNEL), []);

  useEffect(() => () => channel.close(), [channel]);

  const save = useCallback(async (elements) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(elements));
    try {
      const svg = await renderSvg(elements);
      localStorage.setItem(SVG_KEY, svg);
      await fetch("/api/wallpaper", { method: "POST", headers: { "Content-Type": "image/svg+xml" }, body: svg });
      channel.postMessage("updated");
      setStatus(`Сохранено ${new Date().toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}`);
    } catch (error) {
      console.error(error);
      setStatus("Не удалось обновить SVG");
    }
  }, [channel]);

  const importSvg = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const svg = await file.text();
    localStorage.setItem(SVG_KEY, svg);
    await fetch("/api/wallpaper", { method: "POST", headers: { "Content-Type": "image/svg+xml" }, body: svg });
    channel.postMessage("updated");
    setStatus(`SVG «${file.name}» показан в обоях`);
    event.target.value = "";
  };

  if (plash) {
    return (
      <main className="plash-editor" aria-label="Excalidraw поверх рабочего стола">
        <Excalidraw initialData={initialData} onChange={save} />
      </main>
    );
  }

  return (
    <div className="editor-page">
      <header>
        <div>
          <p className="eyebrow">LOCAL · macOS · PLASH</p>
          <h1>Excalidraw Wallpaper</h1>
        </div>
        <div className="actions">
          <label className="secondary">Показать SVG <input type="file" accept="image/svg+xml" onChange={importSvg} /></label>
          <a className="primary" href="/wallpaper.html" target="_blank" rel="noreferrer">Открыть wallpaper view</a>
        </div>
      </header>
      <p className="status"><span />{status}. Изменения автоматически отправляются в wallpaper view.</p>
      <section className="canvas-shell">
        <Excalidraw initialData={initialData} onChange={save} />
      </section>
      <footer>Откройте <code>/wallpaper.html</code> в Plash. Редактор держите открытым отдельно в браузере.</footer>
    </div>
  );
}

const root = createRoot(document.getElementById("root"));
root.render(
  location.pathname.endsWith("wallpaper.html")
    ? <Wallpaper />
    : <Editor plash={location.pathname.endsWith("draw.html")} />,
);
