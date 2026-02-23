// ProxiHealth Security Layer
// Protects against code theft, API abuse, and XSS attacks

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
    
    // Disable keyboard shortcuts for dev tools
    document.addEventListener('keydown', function(e) {
        // F12 (Dev Tools)
        if (e.keyCode === 123) {
            e.preventDefault();
            return false;
        }
        
        // Ctrl+Shift+I (Inspect Element)
        if (e.ctrlKey && e.shiftKey && e.keyCode === 73) {
            e.preventDefault();
            return false;
        }
        
        // Ctrl+Shift+J (Console)
        if (e.ctrlKey && e.shiftKey && e.keyCode === 74) {
            e.preventDefault();
            return false;
        }
        
        // Ctrl+U (View Source)
        if (e.ctrlKey && e.keyCode === 85) {
            e.preventDefault();
            return false;
        }
        
        // Ctrl+S (Save Page)
        if (e.ctrlKey && e.keyCode === 83) {
            e.preventDefault();
            return false;
        }
    });
    
    // Disable text selection on sensitive elements
    document.body.style.userSelect = 'none';
    document.body.style.webkitUserSelect = 'none';
    document.body.style.msUserSelect = 'none';
    
    // Re-enable text selection for medical content (users need to read it)
    const contentElements = document.querySelectorAll('.protocol-body, .result-body, .triage-card, .emergency-card');
    contentElements.forEach(el => {
        if (el) {
            el.style.userSelect = 'text';
            el.style.webkitUserSelect = 'text';
        }
    });
    
    // ============================================
    // 2. API RATE LIMITING (Client-Side)
    // ============================================
    
    const RateLimiter = {
        limits: {
            protocol_load: { max: 10, window: 3600000 }, // 10 requests per hour
            assessment: { max: 20, window: 3600000 }      // 20 assessments per hour
        },
        
        getKey: function(type) {
            return `proxihealth_ratelimit_${type}`;
        },
        
        check: function(type) {
            const key = this.getKey(type);
            const now = Date.now();
            
            // Get existing data
            let data = localStorage.getItem(key);
            if (data) {
                data = JSON.parse(data);
            } else {
                data = { count: 0, resetTime: now + this.limits[type].window };
            }
            
            // Check if window expired
            if (now > data.resetTime) {
                data = { count: 0, resetTime: now + this.limits[type].window };
            }
            
            // Check limit
            if (data.count >= this.limits[type].max) {
                const minutesLeft = Math.ceil((data.resetTime - now) / 60000);
                return {
                    allowed: false,
                    message: `Rate limit exceeded. Please try again in ${minutesLeft} minutes.`
                };
            }
            
            // Increment and save
            data.count++;
            localStorage.setItem(key, JSON.stringify(data));
            
            return { allowed: true };
        }
    };
    
    // Export to global scope (for use in other scripts)
    window.ProxiHealthSecurity = {
        checkRateLimit: function(type) {
            return RateLimiter.check(type);
        }
    };
    
    // ============================================
    // 3. INPUT SANITIZATION (XSS Prevention)
    // ============================================
    
    window.sanitizeInput = function(input) {
        if (typeof input !== 'string') return input;
        
        // Remove HTML tags
        const div = document.createElement('div');
        div.textContent = input;
        let sanitized = div.innerHTML;
        
        // Remove potentially dangerous characters
        sanitized = sanitized
            .replace(/[<>]/g, '')
            .replace(/javascript:/gi, '')
            .replace(/on\w+\s*=/gi, '');
        
        return sanitized;
    };
    
    // ============================================
    // 4. CONSOLE WARNING
    // ============================================
    
    console.log('%c⚠️ STOP!', 'color: red; font-size: 50px; font-weight: bold;');
    console.log('%cThis is a browser feature for developers. If someone told you to copy-paste code here, it\'s a scam.', 'font-size: 16px;');
    console.log('%cProxiHealth - Emergency Medical AI Platform', 'color: #2D5F3F; font-size: 14px; font-weight: bold;');
    
    // ============================================
    // 5. DETECT DEVTOOLS (Advanced)
    // ============================================
    
    let devtoolsOpen = false;
    const threshold = 160;
    
    setInterval(function() {
        if (window.outerWidth - window.innerWidth > threshold || 
            window.outerHeight - window.innerHeight > threshold) {
            if (!devtoolsOpen) {
                devtoolsOpen = true;
                console.clear();
                console.log('%c⚠️ Developer tools detected', 'color: red; font-size: 20px;');
            }
        } else {
            devtoolsOpen = false;
        }
    }, 1000);
    
})();

// ============================================
// EMERGENCY BYPASS (For legitimate debugging)
// ============================================
// If you need to debug, add ?debug=true to URL
if (window.location.search.includes('debug=true')) {
    console.log('Debug mode enabled');
}
