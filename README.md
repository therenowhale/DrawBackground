# DrawBackground

Локальный Excalidraw для macOS и Plash. Проект работает только на этом Mac: он не публикует рисунки в интернет и не требует аккаунтов. Рисунок автоматически сохраняется как SVG в `work/wallpaper.svg`.

## Что где находится

| Что нужно сделать | Адрес в Plash или браузере |
| --- | --- |
| Рисовать прямо в Plash | `http://127.0.0.1:5173/draw.html` |
| Показать готовый рисунок поверх рабочего стола | `http://127.0.0.1:5173/wallpaper.html` |
| Открыть редактор с обычной страницей и подсказками | `http://127.0.0.1:5173/` |

`draw.html` — прозрачный холст Excalidraw с плавающей панелью инструментов. Чтобы рисовать, в Plash нужно выключить **Click-through** / включить взаимодействие с веб-страницей. Чтобы снова пользоваться рабочим столом, включите Click-through. Одновременно рисовать и пропускать клики к macOS невозможно — это два разных режима.

## Быстрый старт

Откройте Terminal и выполните:

```bash
cd /Users/mykytatishkin/Documents/DrawBackground
npm install
npm run dev
```

Пока эта команда работает, сайт доступен по адресу `http://127.0.0.1:5173/`. Не закрывайте это окно Terminal, если запускаете сервер вручную.

## Автозапуск после входа в macOS

Для постоянной работы используется `launchd`, а не cron. Агент запускается при входе в ваш аккаунт и автоматически перезапускает сервер, если тот завершился.

Это не означает «сайт работает во время выключенного Mac»: при выключении или сне работа останавливается, а после следующего входа в macOS запускается снова.

### Установить автозапуск

Сначала остановите вручную запущенный сервер, если он есть: в окне с `npm run dev` нажмите `Ctrl+C`.

Затем выполните:

```bash
cd /Users/mykytatishkin/Documents/DrawBackground
chmod +x scripts/start-plash-server.sh
cp com.excalidraw-plash.server.plist ~/Library/LaunchAgents/
launchctl bootstrap gui/$(id -u) ~/Library/LaunchAgents/com.excalidraw-plash.server.plist
```

После этого снова войдите в macOS или проверьте сразу:

```bash
launchctl print gui/$(id -u)/com.excalidraw-plash.server
curl -I http://127.0.0.1:5173/draw.html
```

Если во втором ответе есть `HTTP/1.1 200 OK`, сервер работает.

### Остановить или удалить автозапуск

Временно остановить до следующего входа в macOS:

```bash
launchctl bootout gui/$(id -u)/com.excalidraw-plash.server
```

Удалить автозапуск полностью:

```bash
launchctl bootout gui/$(id -u) ~/Library/LaunchAgents/com.excalidraw-plash.server.plist
rm ~/Library/LaunchAgents/com.excalidraw-plash.server.plist
```

## Как редактировать проект

Откройте папку проекта в редакторе кода, например VS Code:

```bash
code /Users/mykytatishkin/Documents/DrawBackground
```

Главные файлы:

- `src/main.jsx` — поведение редактора, автосохранение SVG и страницы;
- `src/styles.css` — внешний вид и прозрачность режима Plash;
- `vite.config.js` — локальный API, который сохраняет `work/wallpaper.svg`;
- `draw.html` — прозрачный режим рисования для Plash;
- `wallpaper.html` — режим показа уже готового рисунка.

После изменения `src/` Vite обычно обновляет страницу сам. Если в Plash изменения не появились, перезагрузите wallpaper в Plash. После изменения `scripts/start-plash-server.sh` или `.plist` перезапустите агент:

```bash
launchctl bootout gui/$(id -u)/com.excalidraw-plash.server
cp com.excalidraw-plash.server.plist ~/Library/LaunchAgents/
launchctl bootstrap gui/$(id -u) ~/Library/LaunchAgents/com.excalidraw-plash.server.plist
```

## Проверки и диагностика

Выполняйте команды из папки проекта.

| Задача | Команда | Нормальный результат |
| --- | --- | --- |
| Установить зависимости | `npm install` | Завершается без ошибок |
| Проверить сборку | `npm run build` | Сообщение `built in ...` |
| Запустить вручную | `npm run dev` | URL `http://127.0.0.1:5173/` |
| Проверить страницу Plash | `curl -I http://127.0.0.1:5173/draw.html` | `200 OK` |
| Проверить агента | `launchctl print gui/$(id -u)/com.excalidraw-plash.server` | Информация об агенте, без ошибки |
| Посмотреть журнал сервера | `tail -f work/launchd.log` | Строки запуска Vite |
| Посмотреть ошибки | `tail -f work/launchd-error.log` | Пусто или понятная причина ошибки |
| Узнать, кто занял порт | `lsof -nP -iTCP:5173 -sTCP:LISTEN` | Один процесс Node/Vite |

`npm run preview` не используйте для Plash: он показывает собранные файлы, но не включает API, который автоматически сохраняет SVG.

## Импорт ранее экспортированного SVG

На обычной странице редактора (`http://127.0.0.1:5173/`) нажмите **«Показать SVG»** и выберите файл. Он сразу отобразится в `wallpaper.html`. После следующего изменения на холсте Excalidraw этот SVG заменится новым автосохранённым рисунком.

## Нативная утилита DeskSketch

Папка `native-overlay/` содержит отдельный экспериментальный overlay для рисования поверх всех окон macOS. Для режима Excalidraw в Plash она не нужна. Подробности — в [native-overlay/README.md](native-overlay/README.md).
