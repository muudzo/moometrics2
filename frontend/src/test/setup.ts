import '@testing-library/jest-dom';
import { expect, afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';

// Runs a cleanup after each test case (e.g. clearing jsdom)
afterEach(() => {
    cleanup();
});

// Polyfills for Radix UI
if (typeof window !== 'undefined') {
    // scrollIntoView is not implemented in JSDOM
    window.HTMLElement.prototype.scrollIntoView = vi.fn();
    window.HTMLElement.prototype.hasPointerCapture = vi.fn();
    window.HTMLElement.prototype.releasePointerCapture = vi.fn();

    // ResizeObserver polyfill
    window.ResizeObserver = vi.fn().mockImplementation(() => ({
        observe: vi.fn(),
        unobserve: vi.fn(),
        disconnect: vi.fn(),
    }));

    // PointerEvent polyfill
    if (!window.PointerEvent) {
        class PointerEvent extends Event {
            pointerId: number = 0;
            pointerType: string = '';
            constructor(type: string, params: any = {}) {
                super(type, params);
                this.pointerId = params.pointerId || 0;
                this.pointerType = params.pointerType || '';
            }
        }
        window.PointerEvent = PointerEvent as any;
    }
}
