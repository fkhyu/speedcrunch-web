type DebugEvent = { ts: number; tag: string; data?: unknown };

class DebugBus {
    private enabled: boolean = false;
    private buffer: DebugEvent[] = [];
    private capacity: number;

    constructor(capacity: number = 200) {
        this.capacity = capacity;
    }

    setEnabled(on: boolean) {
        this.enabled = on;
        if (!on) this.clear();
    }

    isEnabled() {
        return this.enabled;
    }

    toggle() {
        this.setEnabled(!this.enabled);
        return this.enabled;
    }

    clear() {
        this.buffer.length = 0;
    }

    trace(tag: string, data?: unknown) {
        if (!this.enabled) return;
        const ev: DebugEvent = { ts: Date.now(), tag, data };
        this.buffer.push(ev);
        if (this.buffer.length > this.capacity) this.buffer.shift();
    }

    getRecent(max: number = 20): DebugEvent[] {
        const start = Math.max(0, this.buffer.length - max);
        return this.buffer.slice(start);
    }

    // Render concise lines for UI hint
    getRecentLines(max: number = 20): string[] {
        return this.getRecent(max).map(ev => {
            try {
                const d = ev.data === undefined ? "" : typeof ev.data === "string" ? ev.data : JSON.stringify(ev.data);
                return `${new Date(ev.ts).toISOString().split("T")[1]?.replace("Z", "")} ${ev.tag}${d ? ": " + d : ""}`;
            } catch {
                return `${ev.tag}`;
            }
        });
    }
}

export const debug = new DebugBus(400);

export type { DebugEvent };


