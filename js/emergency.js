// ProxiHealth - Emergency Page Logic
// Phase 2: UI Navigation (AI integration in Phase 3)

document.addEventListener('DOMContentLoaded', function() {
    // Get all sections
    const step1 = document.getElementById('emergencyStep1');
    const step2 = document.getElementById('emergencyStep2');
    const step3 = document.getElementById('emergencyStep3');
    
    // Buttons
    const helpComingBtn = document.getElementById('helpComingBtn');
    const cantReachHelpBtn = document.getElementById('cantReachHelpBtn');
    
    // Emergency type cards
    const emergencyTypeCards = document.querySelectorAll('.emergency-type-card');
    
    // Store selected emergency data
    let emergencyData = {
        helpStatus: null,
        emergencyType: null
    };
    
    // Step 1: User chooses if help is coming or not
    helpComingBtn.addEventListener('click', function() {
        emergencyData.helpStatus = 'help-coming';
        showStep(step2);
    });
    
    cantReachHelpBtn.addEventListener('click', function() {
        emergencyData.helpStatus = 'cant-reach-help';
        showStep(step2);
    });
    
    // Step 2: User selects emergency type
    emergencyTypeCards.forEach(card => {
        card.addEventListener('click', function() {
            const emergencyType = this.getAttribute('data-emergency');
            emergencyData.emergencyType = emergencyType;
            
            // Store in sessionStorage for Phase 3
            sessionStorage.setItem('emergency_data', JSON.stringify(emergencyData));
            
            // Show loading and prepare for AI (Phase 3)
            showStep(step3);
            simulateAssessment(emergencyType);
        });
    });
});

function showStep(step) {
    // Hide all sections
    document.querySelectorAll('.emergency-section').forEach(section => {
        section.classList.remove('active');
    });
    
    // Show selected section
    step.classList.add('active');
    
    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function goBack() {
    const step1 = document.getElementById('emergencyStep1');
    showStep(step1);
}

// Phase 2: Simulate assessment (will be replaced by real AI in Phase 3)
function simulateAssessment(emergencyType) {
    const loadingState = document.getElementById('loadingState');
    const guidanceContent = document.getElementById('guidanceContent');
    const protocolTitle = document.getElementById('protocolTitle');
    const protocolBody = document.getElementById('protocolBody');
    
    // Show loading for 2 seconds
    setTimeout(() => {
        loadingState.style.display = 'none';
        guidanceContent.style.display = 'block';
        
        // Set title based on emergency
        const emergencyTitles = {
            'severe-bleeding': 'Severe Bleeding Protocol',
            'not-breathing': 'Respiratory Emergency Protocol',
            'childbirth': 'Emergency Childbirth Guidance',
            'chest-pain': 'Cardiac Emergency Protocol',
            'snake-bite': 'Snake Bite Treatment Protocol',
            'severe-burn': 'Burn Treatment Protocol',
            'seizure': 'Seizure Management Protocol',
            'head-injury': 'Head Injury Protocol',
            'poisoning': 'Poisoning Emergency Protocol',
            'other': 'Emergency Guidance'
        };
        
        protocolTitle.textContent = emergencyTitles[emergencyType] || 'Emergency Guidance';
        
        // Placeholder content (will be replaced by AI/offline tree in Phase 3)
        protocolBody.innerHTML = `
            <div style="background: var(--amber-light); padding: var(--space-4); border-radius: var(--radius-md); margin-bottom: var(--space-4); border-left: 4px solid var(--amber-orange);">
                <p style="font-weight: 600; margin-bottom: var(--space-2);">⚠️ AI Integration Coming in Phase 3</p>
                <p style="color: var(--gray-dark);">This is where detailed, step-by-step emergency guidance will appear. The AI will provide:</p>
                <ul style="margin-top: var(--space-2); margin-left: var(--space-3); color: var(--gray-dark);">
                    <li>Immediate actions (next 60 seconds)</li>
                    <li>Stabilization steps (next 5-10 minutes)</li>
                    <li>Warning signs to watch for</li>
                    <li>When to escalate care</li>
                    <li>Transport guidance</li>
                </ul>
            </div>
            
            <div style="background: var(--mint-green); padding: var(--space-4); border-radius: var(--radius-md);">
                <p style="font-weight: 600; margin-bottom: var(--space-2); color: var(--forest-green);">✓ Phase 2 Complete</p>
                <p style="color: var(--gray-dark);">The UI flow is working perfectly. Next phase will integrate:</p>
                <ul style="margin-top: var(--space-2); margin-left: var(--space-3); color: var(--gray-dark);">
                    <li>Google Gemini API for complex cases</li>
                    <li>Offline decision tree for common emergencies</li>
                    <li>Real medical protocols from WHO guidelines</li>
                </ul>
            </div>
        `;
    }, 2000);
}
