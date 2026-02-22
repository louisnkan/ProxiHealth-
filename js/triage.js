// ProxiHealth - Triage Page Logic
// Phase 2: Symptom Collection UI (AI integration in Phase 3)

document.addEventListener('DOMContentLoaded', function() {
    // Sections
    const step1 = document.getElementById('triageStep1');
    const step2 = document.getElementById('triageStep2');
    const step3 = document.getElementById('triageStep3');
    
    // Step 1 elements
    const symptomCards = document.querySelectorAll('.symptom-card');
    const selectedSymptomsDiv = document.getElementById('selectedSymptoms');
    const symptomTagsDiv = document.getElementById('symptomTags');
    const continueBtn = document.getElementById('continueBtn');
    const searchInput = document.getElementById('symptomSearchInput');
    
    // Step 2 elements
    const durationButtons = document.querySelectorAll('[data-duration]');
    const severityButtons = document.querySelectorAll('[data-severity]');
    const getAssessmentBtn = document.getElementById('getAssessmentBtn');
    const additionalDetailsTextarea = document.getElementById('additionalDetails');
    
    // Data collection
    let selectedSymptoms = [];
    let assessmentData = {
        symptoms: [],
        duration: null,
        severity: null,
        additionalDetails: ''
    };
    
    // ============================================
    // STEP 1: Symptom Selection
    // ============================================
    
    // Handle symptom card clicks
    symptomCards.forEach(card => {
        card.addEventListener('click', function() {
            const symptom = this.getAttribute('data-symptom');
            toggleSymptom(symptom, this);
        });
    });
    
    // Search functionality
    searchInput.addEventListener('input', function() {
        const query = this.value.toLowerCase();
        symptomCards.forEach(card => {
            const symptomText = card.textContent.toLowerCase();
            if (symptomText.includes(query)) {
                card.style.display = 'flex';
            } else {
                card.style.display = 'none';
            }
        });
    });
    
    function toggleSymptom(symptom, cardElement) {
        const index = selectedSymptoms.indexOf(symptom);
        
        if (index > -1) {
            // Remove symptom
            selectedSymptoms.splice(index, 1);
            cardElement.classList.remove('selected');
        } else {
            // Add symptom
            selectedSymptoms.push(symptom);
            cardElement.classList.add('selected');
        }
        
        updateSelectedSymptoms();
    }
    
    function updateSelectedSymptoms() {
        if (selectedSymptoms.length === 0) {
            selectedSymptomsDiv.style.display = 'none';
            continueBtn.disabled = true;
            return;
        }
        
        selectedSymptomsDiv.style.display = 'block';
        continueBtn.disabled = false;
        
        // Update tags
        symptomTagsDiv.innerHTML = '';
        selectedSymptoms.forEach(symptom => {
            const tag = document.createElement('div');
            tag.className = 'symptom-tag';
            tag.innerHTML = `
                <span>${formatSymptomName(symptom)}</span>
                <button onclick="removeSymptom('${symptom}')">×</button>
            `;
            symptomTagsDiv.appendChild(tag);
        });
    }
    
    window.removeSymptom = function(symptom) {
        const card = document.querySelector(`[data-symptom="${symptom}"]`);
        if (card) {
            toggleSymptom(symptom, card);
        }
    };
    
    function formatSymptomName(symptom) {
        return symptom
            .split('-')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
    }
    
    // Continue to step 2
    continueBtn.addEventListener('click', function() {
        assessmentData.symptoms = selectedSymptoms;
        showStep(step2);
    });
    
    // ============================================
    // STEP 2: Symptom Details
    // ============================================
    
    // Duration selection
    durationButtons.forEach(button => {
        button.addEventListener('click', function() {
            durationButtons.forEach(btn => btn.classList.remove('selected'));
            this.classList.add('selected');
            assessmentData.duration = this.getAttribute('data-duration');
            checkStep2Complete();
        });
    });
    
    // Severity selection
    severityButtons.forEach(button => {
        button.addEventListener('click', function() {
            severityButtons.forEach(btn => btn.classList.remove('selected'));
            this.classList.add('selected');
            assessmentData.severity = this.getAttribute('data-severity');
            checkStep2Complete();
        });
    });
    
    function checkStep2Complete() {
        if (assessmentData.duration && assessmentData.severity) {
            getAssessmentBtn.disabled = false;
        }
    }
    
    // Get AI assessment
    getAssessmentBtn.addEventListener('click', function() {
        assessmentData.additionalDetails = additionalDetailsTextarea.value;
        
        // Store in sessionStorage for Phase 3
        sessionStorage.setItem('assessment_data', JSON.stringify(assessmentData));
        
        // Show loading and simulate assessment
        showStep(step3);
        simulateAssessment();
    });
    
    // ============================================
    // Navigation
    // ============================================
    
    function showStep(step) {
        document.querySelectorAll('.triage-section').forEach(section => {
            section.classList.remove('active');
        });
        step.classList.add('active');
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
    
    window.goBackToStep = function(stepNumber) {
        if (stepNumber === 1) {
            showStep(step1);
        }
    };
    
    // ============================================
    // STEP 3: AI Assessment (Placeholder for Phase 3)
    // ============================================
    
    function simulateAssessment() {
        const loadingState = document.getElementById('assessmentLoading');
        const resultDiv = document.getElementById('assessmentResult');
        const resultBody = document.getElementById('resultBody');
        
        // Show loading for 2 seconds
        setTimeout(() => {
            loadingState.style.display = 'none';
            resultDiv.style.display = 'block';
            
            // Placeholder content (will be replaced by AI in Phase 3)
            resultBody.innerHTML = `
                <div style="background: var(--soft-cream); padding: var(--space-4); border-radius: var(--radius-md); margin-bottom: var(--space-3);">
                    <h3 style="margin-bottom: var(--space-2); color: var(--charcoal);">Assessment Summary</h3>
                    <p style="color: var(--gray-dark); margin-bottom: var(--space-2);">
                        <strong>Symptoms:</strong> ${selectedSymptoms.map(formatSymptomName).join(', ')}
                    </p>
                    <p style="color: var(--gray-dark); margin-bottom: var(--space-2);">
                        <strong>Duration:</strong> ${formatDuration(assessmentData.duration)}
                    </p>
                    <p style="color: var(--gray-dark);">
                        <strong>Severity:</strong> ${assessmentData.severity}/10
                    </p>
                </div>
                
                <div style="background: var(--amber-light); padding: var(--space-4); border-radius: var(--radius-md); margin-bottom: var(--space-3); border-left: 4px solid var(--amber-orange);">
                    <p style="font-weight: 600; margin-bottom: var(--space-2);">⚠️ AI Integration Coming in Phase 3</p>
                    <p style="color: var(--gray-dark);">This is where AI-powered medical assessment will appear with:</p>
                    <ul style="margin-top: var(--space-2); margin-left: var(--space-3); color: var(--gray-dark);">
                        <li>Likely conditions based on symptoms</li>
                        <li>Recommended care actions</li>
                        <li>Warning signs to watch for</li>
                        <li>When to seek professional help</li>
                        <li>Home care instructions</li>
                    </ul>
                </div>
                
                <div style="background: var(--mint-green); padding: var(--space-4); border-radius: var(--radius-md);">
                    <p style="font-weight: 600; margin-bottom: var(--space-2); color: var(--forest-green);">✓ Phase 2 Complete</p>
                    <p style="color: var(--gray-dark);">Symptom collection is working perfectly. Phase 3 will add:</p>
                    <ul style="margin-top: var(--space-2); margin-left: var(--space-3); color: var(--gray-dark);">
                        <li>Google Gemini API analysis</li>
                        <li>Offline symptom-to-diagnosis tree</li>
                        <li>Evidence-based care recommendations</li>
                    </ul>
                </div>
            `;
        }, 2000);
    }
    
    function formatDuration(duration) {
        const durations = {
            'hours': 'A few hours',
            '1-2days': '1-2 days',
            '3-7days': '3-7 days',
            'week+': 'More than a week'
        };
        return durations[duration] || duration;
    }
});
