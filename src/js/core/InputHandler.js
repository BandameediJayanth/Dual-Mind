/**
 * InputHandler - Unified Input Management
 * Handles mouse, touch, and keyboard input across all games
 */

export class InputHandler {
    constructor(eventBus) {
        this.eventBus = eventBus;
        this.isEnabled = true;
        this.activeElement = null;
        this.touchStartPos = null;
        this.swipeThreshold = 50;
        
        // Keyboard mappings
        this.keyMappings = {
            'ArrowUp': 'up',
            'ArrowDown': 'down',
            'ArrowLeft': 'left',
            'ArrowRight': 'right',
            'Enter': 'confirm',
            'Space': 'confirm',
            'Escape': 'cancel',
            'KeyW': 'up',
            'KeyS': 'down',
            'KeyA': 'left',
            'KeyD': 'right'
        };
        
        this.boundHandlers = {};
    }

    init(targetElement) {
        this.targetElement = targetElement;
        this.setupEventListeners();
        
        this.eventBus.emit('input:initialized');
    }

    setupEventListeners() {
        // Mouse events
        this.boundHandlers.mousedown = this.handleMouseDown.bind(this);
        this.boundHandlers.mouseup = this.handleMouseUp.bind(this);
        this.boundHandlers.mousemove = this.handleMouseMove.bind(this);
        this.boundHandlers.click = this.handleClick.bind(this);
        
        // Touch events
        this.boundHandlers.touchstart = this.handleTouchStart.bind(this);
        this.boundHandlers.touchend = this.handleTouchEnd.bind(this);
        this.boundHandlers.touchmove = this.handleTouchMove.bind(this);
        
        // Keyboard events
        this.boundHandlers.keydown = this.handleKeyDown.bind(this);
        this.boundHandlers.keyup = this.handleKeyUp.bind(this);
        
        // Context menu (prevent on game area)
        this.boundHandlers.contextmenu = this.handleContextMenu.bind(this);
        
        // Attach to target element
        if (this.targetElement) {
            this.targetElement.addEventListener('mousedown', this.boundHandlers.mousedown);
            this.targetElement.addEventListener('mouseup', this.boundHandlers.mouseup);
            this.targetElement.addEventListener('mousemove', this.boundHandlers.mousemove);
            this.targetElement.addEventListener('click', this.boundHandlers.click);
            this.targetElement.addEventListener('touchstart', this.boundHandlers.touchstart, { passive: false });
            this.targetElement.addEventListener('touchend', this.boundHandlers.touchend);
            this.targetElement.addEventListener('touchmove', this.boundHandlers.touchmove, { passive: false });
            this.targetElement.addEventListener('contextmenu', this.boundHandlers.contextmenu);
        }
        
        // Keyboard events on document
        document.addEventListener('keydown', this.boundHandlers.keydown);
        document.addEventListener('keyup', this.boundHandlers.keyup);
    }

    destroy() {
        if (this.targetElement) {
            this.targetElement.removeEventListener('mousedown', this.boundHandlers.mousedown);
            this.targetElement.removeEventListener('mouseup', this.boundHandlers.mouseup);
            this.targetElement.removeEventListener('mousemove', this.boundHandlers.mousemove);
            this.targetElement.removeEventListener('click', this.boundHandlers.click);
            this.targetElement.removeEventListener('touchstart', this.boundHandlers.touchstart);
            this.targetElement.removeEventListener('touchend', this.boundHandlers.touchend);
            this.targetElement.removeEventListener('touchmove', this.boundHandlers.touchmove);
            this.targetElement.removeEventListener('contextmenu', this.boundHandlers.contextmenu);
        }
        
        document.removeEventListener('keydown', this.boundHandlers.keydown);
        document.removeEventListener('keyup', this.boundHandlers.keyup);
    }

    enable() {
        this.isEnabled = true;
    }

    disable() {
        this.isEnabled = false;
    }

    // Mouse handlers
    handleMouseDown(e) {
        if (!this.isEnabled) return;
        
        const pos = this.getPositionFromEvent(e);
        this.eventBus.emit('input:mouseDown', {
            ...pos,
            button: e.button,
            target: e.target
        });
    }

    handleMouseUp(e) {
        if (!this.isEnabled) return;
        
        const pos = this.getPositionFromEvent(e);
        this.eventBus.emit('input:mouseUp', {
            ...pos,
            button: e.button,
            target: e.target
        });
    }

    handleMouseMove(e) {
        if (!this.isEnabled) return;
        
        const pos = this.getPositionFromEvent(e);
        this.eventBus.emit('input:mouseMove', {
            ...pos,
            target: e.target
        });
    }

    handleClick(e) {
        if (!this.isEnabled) return;
        
        const pos = this.getPositionFromEvent(e);
        this.eventBus.emit('input:click', {
            ...pos,
            target: e.target,
            element: e.target.closest('[data-clickable]') || e.target
        });
    }

    // Touch handlers
    handleTouchStart(e) {
        if (!this.isEnabled) return;
        
        if (e.touches.length === 1) {
            const touch = e.touches[0];
            this.touchStartPos = this.getPositionFromEvent(touch);
            this.touchStartTime = Date.now();
            
            this.eventBus.emit('input:touchStart', {
                ...this.touchStartPos,
                target: e.target
            });
        }
    }

    handleTouchEnd(e) {
        if (!this.isEnabled) return;
        
        if (this.touchStartPos && e.changedTouches.length === 1) {
            const touch = e.changedTouches[0];
            const endPos = this.getPositionFromEvent(touch);
            const touchDuration = Date.now() - this.touchStartTime;
            
            const dx = endPos.x - this.touchStartPos.x;
            const dy = endPos.y - this.touchStartPos.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            // Check for swipe
            if (distance > this.swipeThreshold) {
                const direction = this.getSwipeDirection(dx, dy);
                this.eventBus.emit('input:swipe', {
                    direction,
                    startPos: this.touchStartPos,
                    endPos,
                    distance,
                    duration: touchDuration
                });
            } else {
                // Treat as tap
                this.eventBus.emit('input:tap', {
                    ...endPos,
                    target: e.target,
                    duration: touchDuration
                });
            }
            
            this.eventBus.emit('input:touchEnd', {
                ...endPos,
                target: e.target
            });
        }
        
        this.touchStartPos = null;
    }

    handleTouchMove(e) {
        if (!this.isEnabled) return;
        
        // Prevent scrolling while interacting with game
        if (this.touchStartPos) {
            e.preventDefault();
        }
        
        if (e.touches.length === 1) {
            const touch = e.touches[0];
            const pos = this.getPositionFromEvent(touch);
            
            this.eventBus.emit('input:touchMove', {
                ...pos,
                startPos: this.touchStartPos,
                target: e.target
            });
        }
    }

    // Keyboard handlers
    handleKeyDown(e) {
        if (!this.isEnabled) return;
        
        // Don't capture input when typing in text fields
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
            return;
        }
        
        const action = this.keyMappings[e.code];
        
        this.eventBus.emit('input:keyDown', {
            key: e.key,
            code: e.code,
            action,
            ctrlKey: e.ctrlKey,
            shiftKey: e.shiftKey,
            altKey: e.altKey
        });
        
        if (action) {
            this.eventBus.emit('input:action', {
                action,
                source: 'keyboard'
            });
            
            // Prevent default for game controls
            if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) {
                e.preventDefault();
            }
        }
    }

    handleKeyUp(e) {
        if (!this.isEnabled) return;
        
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
            return;
        }
        
        const action = this.keyMappings[e.code];
        
        this.eventBus.emit('input:keyUp', {
            key: e.key,
            code: e.code,
            action
        });
    }

    handleContextMenu(e) {
        // Prevent context menu on game area
        e.preventDefault();
    }

    // Utility methods
    getPositionFromEvent(e) {
        if (!this.targetElement) {
            return { x: e.clientX, y: e.clientY };
        }
        
        const rect = this.targetElement.getBoundingClientRect();
        return {
            x: e.clientX - rect.left,
            y: e.clientY - rect.top,
            clientX: e.clientX,
            clientY: e.clientY,
            relativeX: (e.clientX - rect.left) / rect.width,
            relativeY: (e.clientY - rect.top) / rect.height
        };
    }

    getSwipeDirection(dx, dy) {
        const absDx = Math.abs(dx);
        const absDy = Math.abs(dy);
        
        if (absDx > absDy) {
            return dx > 0 ? 'right' : 'left';
        } else {
            return dy > 0 ? 'down' : 'up';
        }
    }

    // Grid position helper for board games
    getCellFromPosition(x, y, cellSize, offset = { x: 0, y: 0 }) {
        const col = Math.floor((x - offset.x) / cellSize);
        const row = Math.floor((y - offset.y) / cellSize);
        return { row, col };
    }

    // Drag and drop support
    startDrag(element, data) {
        this.dragElement = element;
        this.dragData = data;
        element.classList.add('dragging');
        
        this.eventBus.emit('input:dragStart', {
            element,
            data
        });
    }

    endDrag(target) {
        if (this.dragElement) {
            this.dragElement.classList.remove('dragging');
            
            this.eventBus.emit('input:dragEnd', {
                element: this.dragElement,
                data: this.dragData,
                target
            });
            
            this.dragElement = null;
            this.dragData = null;
        }
    }

    // Accessibility support
    setFocusableElements(elements) {
        this.focusableElements = Array.from(elements);
        this.currentFocusIndex = -1;
    }

    focusNext() {
        if (!this.focusableElements?.length) return;
        
        this.currentFocusIndex = (this.currentFocusIndex + 1) % this.focusableElements.length;
        this.focusableElements[this.currentFocusIndex].focus();
    }

    focusPrevious() {
        if (!this.focusableElements?.length) return;
        
        this.currentFocusIndex = this.currentFocusIndex <= 0 
            ? this.focusableElements.length - 1 
            : this.currentFocusIndex - 1;
        this.focusableElements[this.currentFocusIndex].focus();
    }
}
