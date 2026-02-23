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
    
    // Phase 3.5: Real symptom assessment with security and African disease focus
    async function simulateAssessment() {
        // Check rate limit
        const rateLimitCheck = window.ProxiHealthSecurity.checkRateLimit('assessment');
        if (!rateLimitCheck.allowed) {
            showRateLimitError(rateLimitCheck.message);
            return;
        }
        const loadingState = document.getElementById('assessmentLoading');
        const resultDiv = document.getElementById('assessmentResult');
        const resultBody = document.getElementById('resultBody');
        
        try {
            // Load offline medical data
            const response = await fetch('data/offline-tree.json');
            const medicalData = await response.json();
            
            // Analyze symptoms
            const assessment = analyzeSymptoms(selectedSymptoms, assessmentData, medicalData);
            
            setTimeout(() => {
                loadingState.style.display = 'none';
                resultDiv.style.display = 'block';
                resultBody.innerHTML = renderAssessment(assessment);
            }, 1500);
            
        } catch (error) {
            console.error('Error loading assessment:', error);
            setTimeout(() => {
                loadingState.style.display = 'none';
                resultDiv.style.display = 'block';
                resultBody.innerHTML = renderErrorAssessment();
            }, 1500);
        }
    }
    
    function showRateLimitError(message) {
        const loadingState = document.getElementById('assessmentLoading');
        const resultDiv = document.getElementById('assessmentResult');
        const resultBody = document.getElementById('resultBody');
        
        loadingState.style.display = 'none';
        resultDiv.style.display = 'block';
        
        resultBody.innerHTML = `
            <div style="background: #FEF3C7; padding: var(--space-4); border-radius: var(--radius-lg); border: 2px solid #F59E0B; text-align: center;">
                <h3 style="color: #d97706; margin-bottom: var(--space-2); font-size: 1.25rem;">Rate Limit Reached</h3>
                <p style="color: #4A5568; margin-bottom: var(--space-3); font-size: 1rem;">
                    ${message}
                </p>
                <p style="color: #4A5568; font-size: 0.875rem;">
                    For urgent symptoms, please visit your nearest clinic or call emergency services.
                </p>
            </div>
        `;
    }
    
    function analyzeSymptoms(symptoms, data, medicalData) {
        const assessment = {
            symptoms: symptoms,
            duration: data.duration,
            severity: data.severity,
            possibleConditions: [],
            urgencyLevel: 'moderate',
            recommendations: [],
            warnings: []
        };
        
        // Enhanced African disease detection
        const africanDiseaseCombos = [
            {
                combo: ['fever', 'headache', 'body-ache'],
                patterns: {
                    cyclical_fever: { condition: 'Possible MALARIA - cyclical fever pattern', urgent: true, priority: 'high' },
                    persistent: { condition: 'Possible TYPHOID FEVER - prolonged symptoms', urgent: true, priority: 'high' },
                    general: { condition: 'Viral infection or malaria', urgent: true, priority: 'medium' }
                }
            },
            {
                combo: ['fever', 'headache', 'nausea'],
                condition: 'Possible MALARIA or MENINGITIS - monitor closely',
                urgent: true,
                redFlags: ['neck stiffness', 'confusion', 'sensitivity to light']
            },
            {
                combo: ['diarrhea', 'vomiting', 'stomach-pain'],
                severity_check: {
                    severe: { condition: 'Possible CHOLERA - severe dehydration risk', urgent: true },
                    moderate: { condition: 'Gastroenteritis - monitor hydration', urgent: false }
                }
            },
            {
                combo: ['fever', 'cough', 'fatigue'],
                duration_check: {
                    'week+': { condition: 'Possible TUBERCULOSIS - persistent cough', urgent: true },
                    short: { condition: 'Respiratory infection', urgent: false }
                }
            },
            {
                combo: ['stomach-pain', 'fever'],
                condition: 'Possible TYPHOID or APPENDICITIS',
                urgent: true
            },
            {
                combo: ['severe-pain', 'joint-pain'],
                condition: 'Possible SICKLE CELL CRISIS (if known sickle cell)',
                urgent: true
            }
        ];
        
        // Determine urgency
        if (data.severity >= 8) {
            assessment.urgencyLevel = 'high';
            assessment.warnings.push('Severe symptoms detected. Seek medical attention today.');
        } else if (data.severity >= 5) {
            assessment.urgencyLevel = 'moderate';
        } else {
            assessment.urgencyLevel = 'low';
        }
        
        // Enhanced pattern matching
        africanDiseaseCombos.forEach(item => {
            const hasAllSymptoms = item.combo.every(s => symptoms.includes(s));
            
            if (hasAllSymptoms) {
                if (item.patterns) {
                    // Malaria detection
                    if (data.duration === '3-7days' || data.duration === 'week+') {
                        assessment.possibleConditions.push({
                            name: item.patterns.persistent.condition,
                            urgent: true,
                            type: 'african_disease'
                        });
                    } else {
                        assessment.possibleConditions.push({
                            name: item.patterns.general.condition,
                            urgent: true,
                            type: 'african_disease'
                        });
                    }
                    assessment.urgencyLevel = 'high';
                    
                } else if (item.severity_check) {
                    const condition = data.severity >= 7 ? item.severity_check.severe : item.severity_check.moderate;
                    assessment.possibleConditions.push({
                        name: condition.condition,
                        urgent: condition.urgent,
                        type: 'african_disease'
                    });
                    if (condition.urgent) assessment.urgencyLevel = 'high';
                    
                } else if (item.duration_check) {
                    const condition = data.duration === 'week+' ? item.duration_check['week+'] : item.duration_check.short;
                    assessment.possibleConditions.push({
                        name: condition.condition,
                        urgent: condition.urgent,
                        type: condition.urgent ? 'african_disease' : 'general'
                    });
                    if (condition.urgent) assessment.urgencyLevel = 'high';
                    
                } else {
                    assessment.possibleConditions.push({
                        name: item.condition,
                        urgent: item.urgent,
                        type: 'african_disease'
                    });
                    if (item.urgent) assessment.urgencyLevel = 'high';
                }
                
                if (item.redFlags) {
                    assessment.warnings.push(`⚠️ Red flags: ${item.redFlags.join(', ')}. If present, seek emergency care.`);
                }
            }
        });
        
        // Single symptom checks
        if (symptoms.includes('fever') && assessment.possibleConditions.length === 0) {
            if (data.severity >= 7 || data.duration === 'week+') {
                assessment.possibleConditions.push({ 
                    name: 'Malaria or serious infection - requires medical evaluation', 
                    urgent: true,
                    type: 'african_disease'
                });
                assessment.urgencyLevel = 'high';
            } else {
                assessment.possibleConditions.push({ name: 'Fever - likely viral infection', urgent: false });
            }
        }
        
        // Generate recommendations
        assessment.recommendations = generateRecommendations(symptoms, data.severity, data.duration);
        
        return assessment;
    }
    
    function generateRecommendations(symptoms, severity, duration) {
        const recs = [];
        
        // Fever recommendations
        if (symptoms.includes('fever')) {
            recs.push({
                title: 'Manage Fever',
                actions: [
                    'Take paracetamol (500mg-1000mg) every 6-8 hours',
                    'Drink plenty of water (at least 2 liters per day)',
                    'Use cool compress on forehead',
                    'Rest in cool, well-ventilated room'
                ]
            });
            recs.push({
                title: 'When to Seek Help',
                actions: [
                    'Fever above 39°C (102°F) for more than 3 days',
                    'Fever with severe headache and neck stiffness',
                    'Fever with difficulty breathing',
                    'Fever with confusion or seizures'
                ]
            });
        }
        
        // Stomach issues
        if (symptoms.includes('stomach-pain') || symptoms.includes('diarrhea') || symptoms.includes('nausea')) {
            recs.push({
                title: 'Manage Digestive Symptoms',
                actions: [
                    'Drink oral rehydration solution (ORS) or clean water',
                    'Eat bland foods: rice, banana, toast',
                    'Avoid dairy, spicy, or fatty foods',
                    'Rest and avoid strenuous activity'
                ]
            });
            recs.push({
                title: 'Danger Signs - Seek Help If:',
                actions: [
                    'Blood in stool or vomit',
                    'Severe dehydration (dry mouth, no urine for 8+ hours)',
                    'Severe abdominal pain that worsens',
                    'Symptoms lasting more than 3 days'
                ]
            });
        }
        
        // General hydration
        if (symptoms.includes('fever') || symptoms.includes('diarrhea') || symptoms.includes('vomiting')) {
            recs.push({
                title: 'Stay Hydrated',
                actions: [
                    'Drink small amounts frequently (every 15-30 minutes)',
                    'ORS is best, or water with pinch of salt and sugar',
                    'Avoid alcohol and caffeine',
                    'Monitor urine color (should be light yellow)'
                ]
            });
        }
        
        // If high severity or long duration
        if (severity >= 7 || duration === 'week+') {
            recs.push({
                title: '🚨 Medical Attention Recommended',
                actions: [
                    'Your symptoms are severe or prolonged',
                    'Visit a clinic or hospital for proper diagnosis',
                    'Bring list of symptoms and medications taken',
                    'Call 112 if symptoms worsen suddenly'
                ]
            });
        }
        
        return recs;
    }
    
    function renderAssessment(assessment) {
        let html = `
            <div style="background: var(--soft-cream); padding: var(--space-4); border-radius: var(--radius-lg); margin-bottom: var(--space-4);">
                <h3 style="margin-bottom: var(--space-3); color: var(--charcoal);">📋 Assessment Summary</h3>
                <div style="background: white; padding: var(--space-3); border-radius: var(--radius-md); margin-bottom: var(--space-2);">
                    <p style="color: var(--gray-dark); margin-bottom: var(--space-1);">
                        <strong>Symptoms:</strong> ${assessment.symptoms.map(formatSymptomName).join(', ')}
                    </p>
                    <p style="color: var(--gray-dark); margin-bottom: var(--space-1);">
                        <strong>Duration:</strong> ${formatDuration(assessment.duration)}
                    </p>
                    <p style="color: var(--gray-dark);">
                        <strong>Severity:</strong> ${assessment.severity}/10
                    </p>
                </div>
        `;
        
        // Urgency indicator
        const urgencyColors = {
            high: { bg: 'var(--coral-light)', border: 'var(--coral-red)', text: 'var(--coral-red)' },
            moderate: { bg: 'var(--amber-light)', border: 'var(--amber-orange)', text: '#d97706' },
            low: { bg: 'var(--mint-green)', border: 'var(--sage-green)', text: 'var(--forest-green)' }
        };
        
        const urgencyLabels = {
            high: '🚨 High Urgency - Seek Medical Attention',
            moderate: '⚠️ Moderate - Monitor Closely',
            low: '✓ Low Urgency - Home Care Recommended'
        };
        
        const colors = urgencyColors[assessment.urgencyLevel];
        
        html += `
                <div style="background: ${colors.bg}; padding: var(--space-3); border-radius: var(--radius-md); border-left: 4px solid ${colors.border};">
                    <p style="font-weight: 700; color: ${colors.text}; font-size: 1.125rem;">
                        ${urgencyLabels[assessment.urgencyLevel]}
                    </p>
                </div>
            </div>
        `;
        
        // Possible conditions
        if (assessment.possibleConditions.length > 0) {
            html += `
                <div style="background: white; border: 2px solid var(--gray-light); border-radius: var(--radius-lg); padding: var(--space-4); margin-bottom: var(--space-4);">
                    <h3 style="margin-bottom: var(--space-3); color: var(--charcoal);">🔍 Possible Conditions</h3>
                    ${assessment.possibleConditions.map(condition => `
                        <div style="background: var(--soft-cream); padding: var(--space-3); border-radius: var(--radius-md); margin-bottom: var(--space-2);">
                            <p style="font-weight: 600; color: var(--charcoal);">
                                ${condition.urgent ? '⚠️ ' : ''}${condition.name}
                            </p>
                        </div>
                    `).join('')}
                    <p style="margin-top: var(--space-3); color: var(--gray-dark); font-size: 0.875rem; font-style: italic;">
                        Note: This is an educational assessment. Professional diagnosis is recommended.
                    </p>
                </div>
            `;
        }
        
        // Recommendations
        if (assessment.recommendations.length > 0) {
            html += `
                <div style="background: white; border: 2px solid var(--sage-green); border-radius: var(--radius-lg); padding: var(--space-4); margin-bottom: var(--space-4);">
                    <h3 style="margin-bottom: var(--space-3); color: var(--forest-green);">💊 Care Recommendations</h3>
            `;
            
            assessment.recommendations.forEach(rec => {
                const isDanger = rec.title.includes('Danger') || rec.title.includes('🚨');
                const bgColor = isDanger ? 'var(--coral-light)' : 'var(--mint-green)';
                const borderColor = isDanger ? 'var(--coral-red)' : 'var(--sage-green)';
                
                html += `
                    <div style="background: ${bgColor}; padding: var(--space-3); border-radius: var(--radius-md); margin-bottom: var(--space-3); border-left: 4px solid ${borderColor};">
                        <h4 style="margin-bottom: var(--space-2); color: var(--charcoal); font-size: 1.0625rem;">${rec.title}</h4>
                        <ul style="margin: 0; padding-left: var(--space-4); color: var(--gray-dark);">
                            ${rec.actions.map(action => `<li style="margin-bottom: var(--space-1); line-height: 1.6;">${action}</li>`).join('')}
                        </ul>
                    </div>
                `;
            });
            
            html += `</div>`;
        }
        
        // Offline notice
        html += `
            <div style="background: var(--soft-cream); padding: var(--space-3); border-radius: var(--radius-md); text-align: center;">
                <p style="color: var(--gray-dark); font-size: 0.875rem;">
                    ✓ This assessment was generated using offline medical protocols
                </p>
            </div>
        `;
        
        return html;
    }
    
    function renderErrorAssessment() {
        return `
            <div style="background: var(--coral-light); padding: var(--space-4); border-radius: var(--radius-lg); margin-bottom: var(--space-4); border: 2px solid var(--coral-red);">
                <h3 style="color: var(--coral-red); margin-bottom: var(--space-2);">⚠️ Unable to Complete Assessment</h3>
                <p style="color: var(--gray-dark); margin-bottom: var(--space-3);">
                    We couldn't load the medical database. This may be due to a connection issue.
                </p>
                <p style="color: var(--gray-dark); margin-bottom: var(--space-3);">
                    <strong>Your symptoms:</strong> ${selectedSymptoms.map(formatSymptomName).join(', ')}
                </p>
                <div style="background: white; padding: var(--space-3); border-radius: var(--radius-md);">
                    <p style="font-weight: 600; margin-bottom: var(--space-2); color: var(--charcoal);">General Guidance:</p>
                    <ul style="margin: 0; padding-left: var(--space-4); color: var(--gray-dark);">
                        <li>If symptoms are severe, call 112 or visit nearest clinic</li>
                        <li>Stay hydrated and rest</li>
                        <li>Monitor symptoms - if they worsen, seek help immediately</li>
                        <li>Try reloading this page when connection improves</li>
                    </ul>
                </div>
            </div>
        `;
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
