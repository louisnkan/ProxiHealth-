// ProxiHealth Security Layer - FINAL VERSION
// Right-click blocking, rate limiting, XSS protection

(function() {
    'use strict';
    
    // ============================================
    // 1. DISABLE RIGHT-CLICK AND DEV TOOLS
    // ============================================
    
    // Disable right-click
    document.addEventListener('contextmenu', function(e) {
        e.preventDefault();
        return false;
    });
    
    // Disable keyboard shortcuts
    document.addEventListener('keydown', function(e) {
        // F12
        if (e.keyCode === 123) {
            e.preventDefault();
            return false;
        }
        // Ctrl+Shift+I
        if (e.ctrlKey && e.shiftKey && e.keyCode === 73) {
            e.preventDefault();
            return false;
        }
        // Ctrl+Shift+J
        if (e.ctrlKey && e.shiftKey && e.keyCode === 74) {
            e.preventDefault();
            return false;
        }
        // Ctrl+U
        if (e.ctrlKey && e.keyCode === 85) {
            e.preventDefault();
            return false;
        }
        // Ctrl+S
        if (e.ctrlKey && e.keyCode === 83) {
            e.preventDefault();
            return false;
        }
    });
    
    // ============================================
    // 2. API RATE LIMITING
    // ============================================
    
    const RateLimiter = {
        limits: {
            protocol_load: { max: 10, window: 3600000 },
            assessment: { max: 20, window: 3600000 }
        },
        
        getKey: function(type) {
            return `proxihealth_ratelimit_${type}`;
        },
        
        check: function(type) {
            const key = this.getKey(type);
            const now = Date.now();
            
            let data = localStorage.getItem(key);
            if (data) {
                data = JSON.parse(data);
            } else {
                data = { count: 0, resetTime: now + this.limits[type].window };
            }
            
            if (now > data.resetTime) {
                data = { count: 0, resetTime: now + this.limits[type].window };
            }
            
            if (data.count >= this.limits[type].max) {
                const minutesLeft = Math.ceil((data.resetTime - now) / 60000);
                return {
                    allowed: false,
                    message: `Rate limit exceeded. Please try again in ${minutesLeft} minutes.`
                };
            }
            
            data.count++;
            localStorage.setItem(key, JSON.stringify(data));
            
            return { allowed: true };
        }
    };
    
    // Export to global scope
    window.ProxiHealthSecurity = {
        checkRateLimit: function(type) {
            return RateLimiter.check(type);
        }
    };
    
    // ============================================
    // 3. INPUT SANITIZATION
    // ============================================
    
    window.sanitizeInput = function(input) {
        if (typeof input !== 'string') return input;
        
        const div = document.createElement('div');
        div.textContent = input;
        let sanitized = div.innerHTML;
        
        sanitized = sanitized
            .replace(/[<>]/g, '')
            .replace(/javascript:/gi, '')
            .replace(/on\w+\s*=/gi, '');
        
        return sanitized;
    };
    
    // ============================================
    // 4. CONSOLE WARNING
    // ============================================
    
    console.log('%c⚠️ STOP!', 'color: red; font-size: 40px; font-weight: bold;');
    console.log('%cThis is a browser feature for developers.', 'font-size: 16px;');
    console.log('%cProxiHealth - Emergency Medical AI', 'color: #2D5F3F; font-size: 14px; font-weight: bold;');
    
})();

// Debug mode bypass (add ?debug=true to URL)
if (window.location.search.includes('debug=true')) {
    console.log('Debug mode enabled');
}
