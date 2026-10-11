import AppKit

final class DrawingView: NSView {
    private var strokes: [[NSPoint]] = []
    private var currentStroke: [NSPoint] = []
    var isDrawing = false { didSet { needsDisplay = true } }

    override var acceptsFirstResponder: Bool { true }

    override func draw(_ dirtyRect: NSRect) {
        super.draw(dirtyRect)
        guard isDrawing else { return }

        NSGraphicsContext.current?.shouldAntialias = true
        for stroke in strokes + (currentStroke.isEmpty ? [] : [currentStroke]) {
            guard stroke.count > 1 else { continue }
            let path = NSBezierPath()
            path.move(to: stroke[0])
            for point in stroke.dropFirst() { path.line(to: point) }
            path.lineCapStyle = .round
            path.lineJoinStyle = .round
            path.lineWidth = 5
            NSColor.white.withAlphaComponent(0.92).setStroke()
            path.stroke()
        }
    }

    override func mouseDown(with event: NSEvent) {
        guard isDrawing else { return }
        currentStroke = [convert(event.locationInWindow, from: nil)]
    }

    override func mouseDragged(with event: NSEvent) {
        guard isDrawing else { return }
        currentStroke.append(convert(event.locationInWindow, from: nil))
        needsDisplay = true
    }

    override func mouseUp(with event: NSEvent) {
        guard isDrawing, !currentStroke.isEmpty else { return }
        currentStroke.append(convert(event.locationInWindow, from: nil))
        strokes.append(currentStroke)
        currentStroke = []
        needsDisplay = true
    }

    // Two keyboard-free emergency exits from drawing mode.
    override func rightMouseDown(with event: NSEvent) {
        NotificationCenter.default.post(name: .deskSketchStopDrawing, object: nil)
    }

    override func keyDown(with event: NSEvent) {
        if event.keyCode == 53 { // Escape
            NotificationCenter.default.post(name: .deskSketchStopDrawing, object: nil)
        } else {
            super.keyDown(with: event)
        }
    }

    func clear() {
        strokes = []
        currentStroke = []
        needsDisplay = true
    }
}

extension Notification.Name {
    static let deskSketchStopDrawing = Notification.Name("DeskSketchStopDrawing")
}

final class OverlayWindow: NSWindow {
    init(screen: NSScreen) {
        super.init(
            contentRect: screen.frame,
            styleMask: [.borderless],
            backing: .buffered,
            defer: false
        )
        isOpaque = false
        backgroundColor = .clear
        hasShadow = false
        level = .screenSaver
        collectionBehavior = [.canJoinAllSpaces, .fullScreenAuxiliary, .stationary]
        ignoresMouseEvents = true
        contentView = DrawingView(frame: NSRect(origin: .zero, size: screen.frame.size))
    }

    var drawingView: DrawingView { contentView as! DrawingView }

    override var canBecomeKey: Bool { true }
    override var canBecomeMain: Bool { false }
}

final class AppDelegate: NSObject, NSApplicationDelegate {
    private var overlays: [OverlayWindow] = []
    private let statusItem = NSStatusBar.system.statusItem(withLength: NSStatusItem.squareLength)
    private var drawingMode = false

    func applicationDidFinishLaunching(_ notification: Notification) {
        setupStatusMenu()
        rebuildOverlays()
        NotificationCenter.default.addObserver(
            self,
            selector: #selector(rebuildOverlays),
            name: NSApplication.didChangeScreenParametersNotification,
            object: nil
        )
        NotificationCenter.default.addObserver(
            self,
            selector: #selector(stopDrawing),
            name: .deskSketchStopDrawing,
            object: nil
        )
    }

    private func setupStatusMenu() {
        statusItem.button?.image = NSImage(systemSymbolName: "pencil.tip", accessibilityDescription: "DeskSketch")
        let menu = NSMenu()
        menu.addItem(withTitle: "Начать рисовать", action: #selector(toggleDrawing), keyEquivalent: "d")
        menu.addItem(withTitle: "Очистить рисунок", action: #selector(clear), keyEquivalent: "")
        menu.addItem(.separator())
        menu.addItem(withTitle: "Выйти", action: #selector(NSApplication.terminate(_:)), keyEquivalent: "q")
        menu.items.forEach { $0.target = self }
        statusItem.menu = menu
    }

    @objc private func rebuildOverlays() {
        overlays.forEach { $0.orderOut(nil) }
        overlays = NSScreen.screens.map { OverlayWindow(screen: $0) }
        overlays.forEach { $0.orderFrontRegardless() }
        applyMode()
    }

    @objc private func toggleDrawing() {
        drawingMode.toggle()
        applyMode()
    }

    @objc private func stopDrawing() {
        guard drawingMode else { return }
        drawingMode = false
        applyMode()
    }

    private func applyMode() {
        overlays.forEach { window in
            window.ignoresMouseEvents = !drawingMode
            window.drawingView.isDrawing = drawingMode
            if drawingMode { window.makeKeyAndOrderFront(nil) }
        }
        statusItem.button?.image = NSImage(
            systemSymbolName: drawingMode ? "pencil.tip.crop.circle.fill" : "pencil.tip",
            accessibilityDescription: drawingMode ? "Рисование включено" : "Рисование выключено"
        )
        statusItem.menu?.items.first?.title = drawingMode ? "Закончить рисовать" : "Начать рисовать"
    }

    @objc private func clear() { overlays.forEach { $0.drawingView.clear() } }
}

let app = NSApplication.shared
let delegate = AppDelegate()
app.delegate = delegate
app.setActivationPolicy(.accessory)
app.run()
