/**
 * EventBus Core Module Tests
 */

import { jest, describe, test, expect, beforeEach } from '@jest/globals';

// Simplified EventBus for testing
class EventBus {
    constructor() {
        this.listeners = new Map();
        this.history = [];
        this.maxHistorySize = 100;
    }
    
    on(event, callback, options = {}) {
        if (!this.listeners.has(event)) {
            this.listeners.set(event, []);
        }
        
        const listener = {
            callback,
            once: options.once || false,
            priority: options.priority || 0
        };
        
        const listeners = this.listeners.get(event);
        listeners.push(listener);
        listeners.sort((a, b) => b.priority - a.priority);
        
        return () => this.off(event, callback);
    }
    
    once(event, callback, options = {}) {
        return this.on(event, callback, { ...options, once: true });
    }
    
    off(event, callback) {
        if (!this.listeners.has(event)) return false;
        
        const listeners = this.listeners.get(event);
        const index = listeners.findIndex(l => l.callback === callback);
        
        if (index !== -1) {
            listeners.splice(index, 1);
            return true;
        }
        return false;
    }
    
    emit(event, data = null) {
        this.history.push({ event, data, timestamp: Date.now() });
        if (this.history.length > this.maxHistorySize) {
            this.history.shift();
        }
        
        if (!this.listeners.has(event)) return 0;
        
        const listeners = this.listeners.get(event);
        const toRemove = [];
        
        for (const listener of listeners) {
            listener.callback(data);
            if (listener.once) {
                toRemove.push(listener);
            }
        }
        
        for (const listener of toRemove) {
            const index = listeners.indexOf(listener);
            if (index !== -1) listeners.splice(index, 1);
        }
        
        return listeners.length + toRemove.length;
    }
    
    clear(event = null) {
        if (event) {
            this.listeners.delete(event);
        } else {
            this.listeners.clear();
        }
    }
    
    getListenerCount(event) {
        return this.listeners.has(event) ? this.listeners.get(event).length : 0;
    }
    
    getHistory(event = null, limit = 10) {
        let history = this.history;
        if (event) {
            history = history.filter(h => h.event === event);
        }
        return history.slice(-limit);
    }
}

describe('EventBus', () => {
    let eventBus;
    
    beforeEach(() => {
        eventBus = new EventBus();
    });
    
    describe('Basic Subscription', () => {
        test('should subscribe to events', () => {
            const callback = jest.fn();
            eventBus.on('test', callback);
            
            expect(eventBus.getListenerCount('test')).toBe(1);
        });
        
        test('should receive events when emitted', () => {
            const callback = jest.fn();
            eventBus.on('test', callback);
            
            eventBus.emit('test', { value: 42 });
            
            expect(callback).toHaveBeenCalledWith({ value: 42 });
        });
        
        test('should support multiple listeners for same event', () => {
            const callback1 = jest.fn();
            const callback2 = jest.fn();
            
            eventBus.on('test', callback1);
            eventBus.on('test', callback2);
            
            eventBus.emit('test', 'data');
            
            expect(callback1).toHaveBeenCalledWith('data');
            expect(callback2).toHaveBeenCalledWith('data');
        });
        
        test('should not call listeners for other events', () => {
            const callback = jest.fn();
            eventBus.on('event1', callback);
            
            eventBus.emit('event2', 'data');
            
            expect(callback).not.toHaveBeenCalled();
        });
    });
    
    describe('Unsubscription', () => {
        test('should unsubscribe using returned function', () => {
            const callback = jest.fn();
            const unsubscribe = eventBus.on('test', callback);
            
            unsubscribe();
            eventBus.emit('test', 'data');
            
            expect(callback).not.toHaveBeenCalled();
        });
        
        test('should unsubscribe using off method', () => {
            const callback = jest.fn();
            eventBus.on('test', callback);
            
            eventBus.off('test', callback);
            eventBus.emit('test', 'data');
            
            expect(callback).not.toHaveBeenCalled();
        });
        
        test('should return true when successfully unsubscribed', () => {
            const callback = jest.fn();
            eventBus.on('test', callback);
            
            expect(eventBus.off('test', callback)).toBe(true);
        });
        
        test('should return false when listener not found', () => {
            const callback = jest.fn();
            
            expect(eventBus.off('test', callback)).toBe(false);
        });
    });
    
    describe('Once Subscription', () => {
        test('should only fire once', () => {
            const callback = jest.fn();
            eventBus.once('test', callback);
            
            eventBus.emit('test', 'first');
            eventBus.emit('test', 'second');
            
            expect(callback).toHaveBeenCalledTimes(1);
            expect(callback).toHaveBeenCalledWith('first');
        });
        
        test('should remove listener after firing', () => {
            const callback = jest.fn();
            eventBus.once('test', callback);
            
            eventBus.emit('test', 'data');
            
            expect(eventBus.getListenerCount('test')).toBe(0);
        });
    });
    
    describe('Priority', () => {
        test('should call higher priority listeners first', () => {
            const order = [];
            
            eventBus.on('test', () => order.push('low'), { priority: 1 });
            eventBus.on('test', () => order.push('high'), { priority: 10 });
            eventBus.on('test', () => order.push('medium'), { priority: 5 });
            
            eventBus.emit('test');
            
            expect(order).toEqual(['high', 'medium', 'low']);
        });
    });
    
    describe('Clear', () => {
        test('should clear all listeners for specific event', () => {
            eventBus.on('event1', jest.fn());
            eventBus.on('event1', jest.fn());
            eventBus.on('event2', jest.fn());
            
            eventBus.clear('event1');
            
            expect(eventBus.getListenerCount('event1')).toBe(0);
            expect(eventBus.getListenerCount('event2')).toBe(1);
        });
        
        test('should clear all listeners when no event specified', () => {
            eventBus.on('event1', jest.fn());
            eventBus.on('event2', jest.fn());
            
            eventBus.clear();
            
            expect(eventBus.getListenerCount('event1')).toBe(0);
            expect(eventBus.getListenerCount('event2')).toBe(0);
        });
    });
    
    describe('History', () => {
        test('should track event history', () => {
            eventBus.emit('event1', 'data1');
            eventBus.emit('event2', 'data2');
            
            const history = eventBus.getHistory();
            
            expect(history.length).toBe(2);
            expect(history[0].event).toBe('event1');
            expect(history[1].event).toBe('event2');
        });
        
        test('should filter history by event', () => {
            eventBus.emit('event1', 'data1');
            eventBus.emit('event2', 'data2');
            eventBus.emit('event1', 'data3');
            
            const history = eventBus.getHistory('event1');
            
            expect(history.length).toBe(2);
            expect(history.every(h => h.event === 'event1')).toBe(true);
        });
        
        test('should limit history size', () => {
            for (let i = 0; i < 150; i++) {
                eventBus.emit('test', i);
            }
            
            expect(eventBus.history.length).toBe(100);
        });
        
        test('should limit returned history', () => {
            for (let i = 0; i < 20; i++) {
                eventBus.emit('test', i);
            }
            
            const history = eventBus.getHistory(null, 5);
            
            expect(history.length).toBe(5);
        });
    });
    
    describe('Edge Cases', () => {
        test('should handle emit with no listeners', () => {
            const count = eventBus.emit('nonexistent', 'data');
            expect(count).toBe(0);
        });
        
        test('should handle null data', () => {
            const callback = jest.fn();
            eventBus.on('test', callback);
            
            eventBus.emit('test');
            
            expect(callback).toHaveBeenCalledWith(null);
        });
        
        test('should handle complex data objects', () => {
            const callback = jest.fn();
            eventBus.on('test', callback);
            
            const data = { nested: { array: [1, 2, 3] }, fn: () => {} };
            eventBus.emit('test', data);
            
            expect(callback).toHaveBeenCalledWith(data);
        });
    });
});
