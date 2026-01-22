/**
 * ConsentManager.js
 * Handles user consent for data collection and analytics
 */

export class ConsentManager {
    constructor(storageManager) {
        this.storageManager = storageManager;
        this.consentKey = 'user_consent';
        this.consent = this._loadConsent();
    }
    
    /**
     * Load saved consent preferences
     */
    _loadConsent() {
        const saved = this.storageManager?.get?.(this.consentKey);
        return saved || {
            analytics: false,
            performance: false,
            mlProcessing: false,
            dataStorage: false,
            timestamp: null,
            version: '1.0'
        };
    }
    
    /**
     * Save consent preferences
     */
    _saveConsent() {
        this.consent.timestamp = Date.now();
        if (this.storageManager?.set) {
            this.storageManager.set(this.consentKey, this.consent);
        }
    }
    
    /**
     * Check if user has given any consent
     */
    hasConsented() {
        return this.consent.timestamp !== null;
    }
    
    /**
     * Get all consent preferences
     */
    getConsent() {
        return { ...this.consent };
    }
    
    /**
     * Set consent for a specific type
     */
    setConsent(type, value) {
        if (type in this.consent && type !== 'timestamp' && type !== 'version') {
            this.consent[type] = Boolean(value);
            this._saveConsent();
        }
    }
    
    /**
     * Accept all consent options
     */
    acceptAll() {
        this.consent.analytics = true;
        this.consent.performance = true;
        this.consent.mlProcessing = true;
        this.consent.dataStorage = true;
        this._saveConsent();
    }
    
    /**
     * Reject all consent options (only essential)
     */
    rejectAll() {
        this.consent.analytics = false;
        this.consent.performance = false;
        this.consent.mlProcessing = false;
        this.consent.dataStorage = false;
        this._saveConsent();
    }
    
    /**
     * Check if analytics is allowed
     */
    canCollectAnalytics() {
        return this.consent.analytics;
    }
    
    /**
     * Check if ML processing is allowed
     */
    canProcessML() {
        return this.consent.mlProcessing;
    }
    
    /**
     * Check if data storage is allowed
     */
    canStoreData() {
        return this.consent.dataStorage;
    }
    
    /**
     * Show consent modal (returns a promise)
     */
    showConsentModal() {
        return new Promise((resolve) => {
            // Check if modal already exists
            let modal = document.getElementById('consent-modal');
            if (modal) {
                modal.remove();
            }
            
            // Create modal HTML
            modal = document.createElement('div');
            modal.id = 'consent-modal';
            modal.className = 'modal-overlay';
            modal.innerHTML = `
                <div class="consent-modal-content">
                    <h2>🔒 Privacy & Data Consent</h2>
                    <p>This application uses your gameplay data to provide performance insights. 
                       Please review and choose your preferences below:</p>
                    
                    <div class="consent-options">
                        <label class="consent-option">
                            <input type="checkbox" id="consent-analytics" ${this.consent.analytics ? 'checked' : ''}>
                            <span class="consent-label">
                                <strong>Usage Analytics</strong>
                                <small>Track game completion, session duration, and engagement patterns</small>
                            </span>
                        </label>
                        
                        <label class="consent-option">
                            <input type="checkbox" id="consent-performance" ${this.consent.performance ? 'checked' : ''}>
                            <span class="consent-label">
                                <strong>Performance Metrics</strong>
                                <small>Measure move times, accuracy, and cognitive performance indicators</small>
                            </span>
                        </label>
                        
                        <label class="consent-option">
                            <input type="checkbox" id="consent-ml" ${this.consent.mlProcessing ? 'checked' : ''}>
                            <span class="consent-label">
                                <strong>ML-Based Insights</strong>
                                <small>Use machine learning to generate Performance Index (non-clinical)</small>
                            </span>
                        </label>
                        
                        <label class="consent-option">
                            <input type="checkbox" id="consent-storage" ${this.consent.dataStorage ? 'checked' : ''}>
                            <span class="consent-label">
                                <strong>Local Data Storage</strong>
                                <small>Store gameplay history locally for progress tracking</small>
                            </span>
                        </label>
                    </div>
                    
                    <div class="consent-notice">
                        <p>⚠️ <strong>Important:</strong> This is a performance assessment tool, 
                        not a clinical IQ test. Results are for entertainment and personal insight only.</p>
                    </div>
                    
                    <div class="consent-actions">
                        <button id="consent-reject" class="btn btn-secondary">Essential Only</button>
                        <button id="consent-custom" class="btn btn-primary">Save Preferences</button>
                        <button id="consent-accept" class="btn btn-success">Accept All</button>
                    </div>
                </div>
            `;
            
            document.body.appendChild(modal);
            
            // Add event listeners
            document.getElementById('consent-reject').onclick = () => {
                this.rejectAll();
                modal.remove();
                resolve(this.consent);
            };
            
            document.getElementById('consent-custom').onclick = () => {
                this.consent.analytics = document.getElementById('consent-analytics').checked;
                this.consent.performance = document.getElementById('consent-performance').checked;
                this.consent.mlProcessing = document.getElementById('consent-ml').checked;
                this.consent.dataStorage = document.getElementById('consent-storage').checked;
                this._saveConsent();
                modal.remove();
                resolve(this.consent);
            };
            
            document.getElementById('consent-accept').onclick = () => {
                this.acceptAll();
                modal.remove();
                resolve(this.consent);
            };
        });
    }
    
    /**
     * Show consent modal if not already consented
     */
    async ensureConsent() {
        if (!this.hasConsented()) {
            return this.showConsentModal();
        }
        return this.consent;
    }
    
    /**
     * Revoke all consent and clear data
     */
    revokeConsent() {
        this.rejectAll();
        // Optionally clear stored data here
        if (this.storageManager?.clearAll) {
            this.storageManager.clearAll();
        }
    }
}

export default ConsentManager;
