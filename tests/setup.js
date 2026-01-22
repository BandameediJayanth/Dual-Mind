/**
 * Jest Test Setup
 * Global test configuration and mocks
 */

// Mock localStorage
const localStorageMock = {
    store: {},
    getItem: function(key) {
        return this.store[key] || null;
    },
    setItem: function(key, value) {
        this.store[key] = String(value);
    },
    removeItem: function(key) {
        delete this.store[key];
    },
    clear: function() {
        this.store = {};
    },
    get length() {
        return Object.keys(this.store).length;
    },
    key: function(i) {
        return Object.keys(this.store)[i] || null;
    }
};

Object.defineProperty(global, 'localStorage', {
    value: localStorageMock
});

// Mock IndexedDB (simplified)
const indexedDBMock = {
    open: jest.fn(() => ({
        onupgradeneeded: null,
        onsuccess: null,
        onerror: null
    }))
};

Object.defineProperty(global, 'indexedDB', {
    value: indexedDBMock
});

// Mock requestAnimationFrame
global.requestAnimationFrame = callback => setTimeout(callback, 16);
global.cancelAnimationFrame = id => clearTimeout(id);

// Mock performance.now
if (!global.performance) {
    global.performance = {};
}
global.performance.now = () => Date.now();

// Mock canvas context
HTMLCanvasElement.prototype.getContext = jest.fn(() => ({
    fillRect: jest.fn(),
    clearRect: jest.fn(),
    getImageData: jest.fn(),
    putImageData: jest.fn(),
    createImageData: jest.fn(),
    setTransform: jest.fn(),
    drawImage: jest.fn(),
    save: jest.fn(),
    restore: jest.fn(),
    scale: jest.fn(),
    rotate: jest.fn(),
    translate: jest.fn(),
    transform: jest.fn(),
    beginPath: jest.fn(),
    closePath: jest.fn(),
    moveTo: jest.fn(),
    lineTo: jest.fn(),
    arc: jest.fn(),
    arcTo: jest.fn(),
    bezierCurveTo: jest.fn(),
    quadraticCurveTo: jest.fn(),
    rect: jest.fn(),
    fill: jest.fn(),
    stroke: jest.fn(),
    clip: jest.fn(),
    isPointInPath: jest.fn(),
    measureText: jest.fn(() => ({ width: 0 })),
    fillText: jest.fn(),
    strokeText: jest.fn(),
    createLinearGradient: jest.fn(() => ({ addColorStop: jest.fn() })),
    createRadialGradient: jest.fn(() => ({ addColorStop: jest.fn() })),
    createPattern: jest.fn()
}));

// Global test utilities
global.delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Clear mocks before each test
beforeEach(() => {
    localStorage.clear();
    jest.clearAllMocks();
});
