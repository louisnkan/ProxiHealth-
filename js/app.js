// ProxiHealth - Phase 1: Frontend Navigation Logic
// No backend integration yet - just UI interactions

// ============================================
// Disclaimer Modal
// ============================================
document.addEventListener('DOMContentLoaded', function() {
    const modal = document.getElementById('disclaimerModal');
    const acceptBtn = document.getElementById('disclaimerAccept');
    
    // Check if user has already accepted disclaimer
    const hasAccepted = localStorage.getItem('proxihealth_disclaimer_accepted');
    
    if (!hasAccepted) {
        // Show modal on first visit
        modal.classList.remove('hidden');
    } else {
        // Hide modal if already accepted
        modal.classList.add('hidden');
    }
    
    // Handle acceptance
    acceptBtn.addEventListener('click', function() {
        localStorage.setItem('proxihealth_disclaimer_accepted', 'true');
        modal.classList.add('hidden');
    });
});

// ============================================
// Emergency Buttons
// ============================================
const criticalBtn = document.getElementById('criticalBtn');
const nonUrgentBtn = document.getElementById('nonUrgentBtn');

// Critical Emergency Button
criticalBtn.addEventListener('click', function() {
    // Store emergency type in sessionStorage
    sessionStorage.setItem('emergency_type', 'critical');
    
    // Navigate to emergency page (we'll create this in Phase 2)
    window.location.href = 'emergency.html';
});

// Non-Urgent Button
nonUrgentBtn.addEventListener('click', function() {
    // Store emergency type in sessionStorage
    sessionStorage.setItem('emergency_type', 'non-urgent');
    
    // Navigate to triage page (we'll create this in Phase 2)
    window.location.href = 'triage.html';
});

// ============================================
// Search Functionality
// ============================================
const searchInput = document.getElementById('symptomSearch');
const searchBtn = document.getElementById('searchBtn');

// Search on button click
searchBtn.addEventListener('click', function() {
    handleSearch();
});

// Search on Enter key
searchInput.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        handleSearch();
    }
});

function handleSearch() {
    const query = searchInput.value.trim();
    
    if (query.length === 0) {
        // Show error feedback
        searchInput.style.borderColor = 'var(--red-600)';
        searchInput.placeholder = 'Please enter symptoms';
        
        setTimeout(() => {
            searchInput.style.borderColor = '';
            searchInput.placeholder = 'Search symptoms (e.g., snake bite, severe bleeding, fever)';
        }, 2000);
        
        return;
    }
    
    // Store search query
    sessionStorage.setItem('symptom_search', query);
    sessionStorage.setItem('emergency_type', 'search');
    
    // Navigate to triage (we'll handle search routing in Phase 3)
    window.location.href = 'triage.html';
}

// ============================================
// Smooth Scroll for Navigation Links
// ============================================
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});
