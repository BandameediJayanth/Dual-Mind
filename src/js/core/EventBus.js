/**
 * EventBus - Central Event Management System
 * Implements publish/subscribe pattern for decoupled communication
 */

export class EventBus {
    constructor() {
        this.events = new Map();
        this.eventHistory = [];
        this.maxHistorySize = 100;
    }

    /**
     * Subscribe to an event
     * @param {string} event - Event name
     * @param {Function} callback - Event handler
     * @returns {Function} Unsubscribe function
     */
    on(event, callback) {
        if (!this.events.has(event)) {
            this.events.set(event, new Set());
        }
        
        this.events.get(event).add(callback);
        
        // Return unsubscribe function
        return () => this.off(event, callback);
    }

    /**
     * Subscribe to an event (one-time)
     * @param {string} event - Event name
     * @param {Function} callback - Event handler
     */
    once(event, callback) {
        const wrapper = (...args) => {
            callback(...args);
            this.off(event, wrapper);
        };
        
        this.on(event, wrapper);
    }

    /**
     * Unsubscribe from an event
     * @param {string} event - Event name
     * @param {Function} callback - Event handler to remove
     */
    off(event, callback) {
        if (this.events.has(event)) {
            this.events.get(event).delete(callback);
            
            // Clean up empty event sets
            if (this.events.get(event).size === 0) {
                this.events.delete(event);
            }
        }
    }

    /**
     * Emit an event
     * @param {string} event - Event name
     * @param {...any} args - Event arguments
     */
    emit(event, ...args) {
        // Log event to history
        this.logEvent(event, args);
        
        if (this.events.has(event)) {
            this.events.get(event).forEach(callback => {
                try {
                    callback(...args);
                } catch (error) {
                    console.error(`Error in event handler for "${event}":`, error);
                }
            });
        }
    }

    /**
     * Log event to history
     * @param {string} event - Event name
     * @param {Array} args - Event arguments
     */
    logEvent(event, args) {
        this.eventHistory.push({
            event,
            args,
            timestamp: Date.now()
        });
        
        // Trim history if too large
        if (this.eventHistory.length > this.maxHistorySize) {
            this.eventHistory.shift();
        }
    }

    /**
     * Get event history
     * @param {string} [eventFilter] - Optional event name filter
     * @returns {Array} Event history
     */
    getHistory(eventFilter = null) {
        if (eventFilter) {
            return this.eventHistory.filter(e => e.event === eventFilter);
        }
        return [...this.eventHistory];
    }

    /**
     * Clear event history
     */
    clearHistory() {
        this.eventHistory = [];
    }

    /**
     * Get all registered events
     * @returns {Array} List of event names
     */
    getRegisteredEvents() {
        return Array.from(this.events.keys());
    }

    /**
     * Check if event has listeners
     * @param {string} event - Event name
     * @returns {boolean}
     */
    hasListeners(event) {
        return this.events.has(event) && this.events.get(event).size > 0;
    }

    /**
     * Remove all listeners for an event
     * @param {string} event - Event name
     */
    removeAllListeners(event) {
        if (event) {
            this.events.delete(event);
        } else {
            this.events.clear();
        }
    }
}

// Event type constants
export const EventTypes = {
    // Application events
    APP_READY: 'app:ready',
    APP_ERROR: 'app:error',
    
    // Navigation events
    NAVIGATE: 'navigate',
    
    // Game events
    GAME_SELECT: 'game:select',
    GAME_START: 'game:start',
    GAME_MOVE: 'game:move',
    GAME_STATE_UPDATE: 'game:stateUpdate',
    GAME_TURN_CHANGE: 'game:turnChange',
    GAME_END: 'game:end',
    GAME_RESTART: 'game:restart',
    GAME_QUIT: 'game:quit',
    
    // Input events
    INPUT_CLICK: 'input:click',
    INPUT_KEY: 'input:key',
    INPUT_TOUCH: 'input:touch',
    
    // Analytics events
    ANALYTICS_UPDATE: 'analytics:update',
    ANALYTICS_FEATURE_EXTRACTED: 'analytics:featureExtracted',
    ANALYTICS_PREDICTION_READY: 'analytics:predictionReady',
    
    // Settings events
    SETTINGS_CHANGE: 'settings:change',
    SETTINGS_CLEAR_DATA: 'settings:clearData',
    SETTINGS_EXPORT_DATA: 'settings:exportData',
    
    // UI events
    UI_TOAST: 'ui:toast',
    UI_MODAL_OPEN: 'ui:modalOpen',
    UI_MODAL_CLOSE: 'ui:modalClose',
    UI_LOADING_START: 'ui:loadingStart',
    UI_LOADING_END: 'ui:loadingEnd'
};
