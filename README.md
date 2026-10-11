# Excalidraw Wallpaper for Plash

Локальный редактор Excalidraw и отдельное прозрачное представление для обоев macOS. Рисунок сохраняется как локальный SVG в `work/wallpaper.svg`; `wallpaper.html` проверяет его примерно раз в секунду. Вручную экспортировать SVG не нужно.

## Запуск

Требуется Node.js 18+.

```bash
npm install
npm run dev
```

Откройте URL, который напечатает Vite (обычно `http://127.0.0.1:5173/`), в обычном браузере и рисуйте. Затем откройте `http://127.0.0.1:5173/wallpaper.html`.

## Подключение к Plash

Для рисования прямо в Plash укажите `http://127.0.0.1:5173/draw.html`. Это прозрачный полноэкранный Excalidraw без шапки сайта. Включите в Plash взаимодействие с веб-страницей — иначе мышь будет проходить к рабочему столу.

Для показа готового рисунка без возможности рисовать укажите `http://127.0.0.1:5173/wallpaper.html` и включите click-through / отключите взаимодействие.

Не закрывайте `npm run dev`, пока нужны интерактивные обои.

## Автозапуск после входа в macOS

Для постоянной работы используйте `launchd`, а не cron. Готовый агент находится в `com.excalidraw-plash.server.plist`; после установки он запускает локальный сервер при каждом входе в ваш аккаунт и перезапускает его при сбое.

Сначала остановите запущенный вручную `npm run dev` клавишами `Ctrl+C`, иначе оба процесса попытаются занять порт `5173`.

```bash
chmod +x scripts/start-plash-server.sh
cp com.excalidraw-plash.server.plist ~/Library/LaunchAgents/
launchctl bootstrap gui/$(id -u) ~/Library/LaunchAgents/com.excalidraw-plash.server.plist
```

Чтобы отключить автозапуск:

```bash
launchctl bootout gui/$(id -u) ~/Library/LaunchAgents/com.excalidraw-plash.server.plist
rm ~/Library/LaunchAgents/com.excalidraw-plash.server.plist
```

## Импорт старого SVG

Кнопка «Показать SVG» заменит отображаемый слой на выбранный SVG — удобно для просмотра ранее экспортированного рисунка. После следующего изменения в Excalidraw wallpaper view снова показывает новый автогенерированный SVG.

## Важные ограничения

- Canvas Excalidraw сам по себе не является прозрачным интерактивным окном: браузерный canvas рисуется на своей странице. Поэтому редактор и wallpaper view — две разные страницы.
- Автообновление передаётся через локальный сервер, поэтому Plash не обязан разделять с браузером `localStorage`. SVG сохраняется только в папке проекта: `work/wallpaper.svg`.
- API для автосохранения доступен при `npm run dev`. `npm run preview` пригоден лишь для просмотра собранного интерфейса и не включает сохранение SVG.
