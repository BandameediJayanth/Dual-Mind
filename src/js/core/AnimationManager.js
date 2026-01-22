/**
 * AnimationManager.js
 * Handles game animations including move transitions, highlights, and effects
 */

export class AnimationManager {
    constructor() {
        this.animations = new Map();
        this.nextId = 1;
        this.running = false;
        this.lastTimestamp = 0;
        
        // Default timing functions
        this.easings = {
            linear: t => t,
            easeIn: t => t * t,
            easeOut: t => t * (2 - t),
            easeInOut: t => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t,
            bounce: t => {
                const n1 = 7.5625;
                const d1 = 2.75;
                if (t < 1 / d1) return n1 * t * t;
                if (t < 2 / d1) return n1 * (t -= 1.5 / d1) * t + 0.75;
                if (t < 2.5 / d1) return n1 * (t -= 2.25 / d1) * t + 0.9375;
                return n1 * (t -= 2.625 / d1) * t + 0.984375;
            },
            elastic: t => {
                return t === 0 ? 0 : t === 1 ? 1 :
                    -Math.pow(2, 10 * t - 10) * Math.sin((t * 10 - 10.75) * ((2 * Math.PI) / 3));
            }
        };
    }
    
    /**
     * Start the animation loop
     */
    start() {
        if (this.running) return;
        this.running = true;
        this.lastTimestamp = performance.now();
        this._loop();
    }
    
    /**
     * Stop the animation loop
     */
    stop() {
        this.running = false;
    }
    
    /**
     * Main animation loop
     */
    _loop() {
        if (!this.running) return;
        
        const now = performance.now();
        const deltaTime = now - this.lastTimestamp;
        this.lastTimestamp = now;
        
        // Update all active animations
        for (const [id, animation] of this.animations) {
            this._updateAnimation(animation, now);
            
            if (animation.completed) {
                this.animations.delete(id);
                if (animation.onComplete) {
                    animation.onComplete();
                }
            }
        }
        
        requestAnimationFrame(() => this._loop());
    }
    
    /**
     * Update a single animation
     */
    _updateAnimation(animation, now) {
        const elapsed = now - animation.startTime;
        let progress = Math.min(elapsed / animation.duration, 1);
        
        // Apply easing
        const easedProgress = this.easings[animation.easing](progress);
        
        // Update values
        animation.onUpdate(easedProgress, animation);
        
        if (progress >= 1) {
            animation.completed = true;
        }
    }
    
    /**
     * Create a move animation (piece from one position to another)
     */
    animateMove(options) {
        const {
            fromX, fromY,
            toX, toY,
            duration = 300,
            easing = 'easeOut',
            onUpdate,
            onComplete
        } = options;
        
        const id = this.nextId++;
        
        const animation = {
            id,
            type: 'move',
            startTime: performance.now(),
            duration,
            easing,
            completed: false,
            fromX, fromY, toX, toY,
            currentX: fromX,
            currentY: fromY,
            onUpdate: (progress) => {
                animation.currentX = fromX + (toX - fromX) * progress;
                animation.currentY = fromY + (toY - fromY) * progress;
                if (onUpdate) onUpdate(animation.currentX, animation.currentY, progress);
            },
            onComplete
        };
        
        this.animations.set(id, animation);
        if (!this.running) this.start();
        
        return id;
    }
    
    /**
     * Create a fade animation
     */
    animateFade(options) {
        const {
            fromAlpha = 1,
            toAlpha = 0,
            duration = 200,
            easing = 'easeOut',
            onUpdate,
            onComplete
        } = options;
        
        const id = this.nextId++;
        
        const animation = {
            id,
            type: 'fade',
            startTime: performance.now(),
            duration,
            easing,
            completed: false,
            currentAlpha: fromAlpha,
            onUpdate: (progress) => {
                animation.currentAlpha = fromAlpha + (toAlpha - fromAlpha) * progress;
                if (onUpdate) onUpdate(animation.currentAlpha, progress);
            },
            onComplete
        };
        
        this.animations.set(id, animation);
        if (!this.running) this.start();
        
        return id;
    }
    
    /**
     * Create a scale animation
     */
    animateScale(options) {
        const {
            fromScale = 1,
            toScale = 1.2,
            duration = 200,
            easing = 'easeOut',
            onUpdate,
            onComplete
        } = options;
        
        const id = this.nextId++;
        
        const animation = {
            id,
            type: 'scale',
            startTime: performance.now(),
            duration,
            easing,
            completed: false,
            currentScale: fromScale,
            onUpdate: (progress) => {
                animation.currentScale = fromScale + (toScale - fromScale) * progress;
                if (onUpdate) onUpdate(animation.currentScale, progress);
            },
            onComplete
        };
        
        this.animations.set(id, animation);
        if (!this.running) this.start();
        
        return id;
    }
    
    /**
     * Create a pulse animation (scale up then back down)
     */
    animatePulse(options) {
        const {
            scale = 1.2,
            duration = 400,
            onUpdate,
            onComplete
        } = options;
        
        const id = this.nextId++;
        
        const animation = {
            id,
            type: 'pulse',
            startTime: performance.now(),
            duration,
            easing: 'linear',
            completed: false,
            currentScale: 1,
            onUpdate: (progress) => {
                // Pulse: scale up in first half, down in second half
                if (progress < 0.5) {
                    animation.currentScale = 1 + (scale - 1) * (progress * 2);
                } else {
                    animation.currentScale = scale - (scale - 1) * ((progress - 0.5) * 2);
                }
                if (onUpdate) onUpdate(animation.currentScale, progress);
            },
            onComplete
        };
        
        this.animations.set(id, animation);
        if (!this.running) this.start();
        
        return id;
    }
    
    /**
     * Create a shake animation
     */
    animateShake(options) {
        const {
            intensity = 5,
            duration = 300,
            onUpdate,
            onComplete
        } = options;
        
        const id = this.nextId++;
        
        const animation = {
            id,
            type: 'shake',
            startTime: performance.now(),
            duration,
            easing: 'linear',
            completed: false,
            offsetX: 0,
            offsetY: 0,
            onUpdate: (progress) => {
                // Shake decreases over time
                const remaining = 1 - progress;
                animation.offsetX = (Math.random() - 0.5) * intensity * 2 * remaining;
                animation.offsetY = (Math.random() - 0.5) * intensity * 2 * remaining;
                if (onUpdate) onUpdate(animation.offsetX, animation.offsetY, progress);
            },
            onComplete
        };
        
        this.animations.set(id, animation);
        if (!this.running) this.start();
        
        return id;
    }
    
    /**
     * Create a highlight animation (glow effect)
     */
    animateHighlight(options) {
        const {
            color = '#ffff00',
            duration = 600,
            pulseCount = 2,
            onUpdate,
            onComplete
        } = options;
        
        const id = this.nextId++;
        
        const animation = {
            id,
            type: 'highlight',
            startTime: performance.now(),
            duration,
            easing: 'linear',
            completed: false,
            currentIntensity: 0,
            color,
            onUpdate: (progress) => {
                // Pulse multiple times
                animation.currentIntensity = Math.sin(progress * Math.PI * pulseCount * 2) * 0.5 + 0.5;
                if (onUpdate) onUpdate(animation.currentIntensity, color, progress);
            },
            onComplete
        };
        
        this.animations.set(id, animation);
        if (!this.running) this.start();
        
        return id;
    }
    
    /**
     * Create a celebration/confetti animation
     */
    animateCelebration(options) {
        const {
            particleCount = 50,
            duration = 2000,
            canvas,
            onComplete
        } = options;
        
        if (!canvas) return null;
        
        const ctx = canvas.getContext('2d');
        const particles = [];
        
        // Create particles
        for (let i = 0; i < particleCount; i++) {
            particles.push({
                x: canvas.width / 2,
                y: canvas.height / 2,
                vx: (Math.random() - 0.5) * 10,
                vy: (Math.random() - 1) * 10,
                color: `hsl(${Math.random() * 360}, 70%, 50%)`,
                size: Math.random() * 8 + 4,
                rotation: Math.random() * Math.PI * 2,
                rotationSpeed: (Math.random() - 0.5) * 0.2
            });
        }
        
        const id = this.nextId++;
        
        const animation = {
            id,
            type: 'celebration',
            startTime: performance.now(),
            duration,
            easing: 'linear',
            completed: false,
            particles,
            onUpdate: (progress) => {
                // Update particle physics
                const gravity = 0.2;
                const alpha = 1 - progress;
                
                ctx.save();
                ctx.globalAlpha = alpha;
                
                for (const p of particles) {
                    p.vy += gravity;
                    p.x += p.vx;
                    p.y += p.vy;
                    p.rotation += p.rotationSpeed;
                    
                    ctx.save();
                    ctx.translate(p.x, p.y);
                    ctx.rotate(p.rotation);
                    ctx.fillStyle = p.color;
                    ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
                    ctx.restore();
                }
                
                ctx.restore();
            },
            onComplete
        };
        
        this.animations.set(id, animation);
        if (!this.running) this.start();
        
        return id;
    }
    
    /**
     * Create a sequence of animations
     */
    animateSequence(animations, onComplete) {
        let index = 0;
        
        const runNext = () => {
            if (index >= animations.length) {
                if (onComplete) onComplete();
                return;
            }
            
            const animConfig = animations[index];
            const originalOnComplete = animConfig.onComplete;
            
            animConfig.onComplete = () => {
                if (originalOnComplete) originalOnComplete();
                index++;
                runNext();
            };
            
            // Determine animation type and call appropriate method
            switch (animConfig.type) {
                case 'move':
                    this.animateMove(animConfig);
                    break;
                case 'fade':
                    this.animateFade(animConfig);
                    break;
                case 'scale':
                    this.animateScale(animConfig);
                    break;
                case 'pulse':
                    this.animatePulse(animConfig);
                    break;
                case 'shake':
                    this.animateShake(animConfig);
                    break;
                case 'highlight':
                    this.animateHighlight(animConfig);
                    break;
                default:
                    index++;
                    runNext();
            }
        };
        
        runNext();
    }
    
    /**
     * Cancel an animation
     */
    cancel(id) {
        this.animations.delete(id);
    }
    
    /**
     * Cancel all animations
     */
    cancelAll() {
        this.animations.clear();
    }
    
    /**
     * Check if any animations are running
     */
    isAnimating() {
        return this.animations.size > 0;
    }
    
    /**
     * Wait for all current animations to complete
     */
    waitForAll() {
        return new Promise(resolve => {
            const check = () => {
                if (this.animations.size === 0) {
                    resolve();
                } else {
                    requestAnimationFrame(check);
                }
            };
            check();
        });
    }
}

// Singleton export
export const animationManager = new AnimationManager();
export default animationManager;
