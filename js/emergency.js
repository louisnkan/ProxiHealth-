// ProxiHealth Emergency Page - FINAL VERSION
// WITH LOADING TIMEOUT FIX

document.addEventListener('DOMContentLoaded', function() {
    const step1 = document.getElementById('emergencyStep1');
    const step2 = document.getElementById('emergencyStep2');
    const step3 = document.getElementById('emergencyStep3');
    
    const helpComingBtn = document.getElementById('helpComingBtn');
    const cantReachHelpBtn = document.getElementById('cantReachHelpBtn');
    const emergencyTypeCards = document.querySelectorAll('.emergency-type-card');
    
    let emergencyData = { helpStatus: null, emergencyType: null };
    
    // SIMPLIFIED: Only "Can't reach help" button works (removed duplicate)
    if (cantReachHelpBtn) {
        cantReachHelpBtn.addEventListener('click', function() {
            emergencyData.helpStatus = 'cant-reach-help';
            showStep(step2);
        });
    }
    
    // Emergency type selection
    emergencyTypeCards.forEach(card => {
        card.addEventListener('click', function() {
            const emergencyType = this.getAttribute('data-emergency');
            emergencyData.emergencyType = emergencyType;
            sessionStorage.setItem('emergency_data', JSON.stringify(emergencyData));
            showStep(step3);
            loadProtocol(emergencyType);
        });
    });
});

function showStep(step) {
    document.querySelectorAll('.emergency-section').forEach(section => {
        section.classList.remove('active');
    });
    step.classList.add('active');
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function goBack() {
    const step1 = document.getElementById('emergencyStep1');
    showStep(step1);
}

// CRITICAL FIX: Loading timeout + fallback
async function loadProtocol(emergencyType) {
    const loadingState = document.getElementById('loadingState');
    const guidanceContent = document.getElementById('guidanceContent');
    const protocolTitle = document.getElementById('protocolTitle');
    const protocolBody = document.getElementById('protocolBody');
    
    // Check rate limit
    if (window.ProxiHealthSecurity) {
        const rateLimitCheck = window.ProxiHealthSecurity.checkRateLimit('protocol_load');
        if (!rateLimitCheck.allowed) {
            showError('Rate Limit Exceeded', rateLimitCheck.message);
            return;
        }
    }
    
    // TIMEOUT PROTECTION: If loading takes >3 seconds, show fallback
    const timeoutId = setTimeout(() => {
        console.warn('Protocol loading timed out, showing fallback');
        loadingState.style.display = 'none';
        guidanceContent.style.display = 'block';
        protocolTitle.textContent = 'Loading Timeout';
        protocolBody.innerHTML = renderFallbackGuidance(emergencyType);
    }, 3000);
    
    try {
        const response = await fetch('data/offline-tree.json');
        
        // Clear timeout if successful
        clearTimeout(timeoutId);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const medicalData = await response.json();
        const protocol = medicalData.protocols[emergencyType];
        
        // Brief loading animation
        setTimeout(() => {
            loadingState.style.display = 'none';
            guidanceContent.style.display = 'block';
            
            if (protocol) {
                protocolTitle.textContent = protocol.title;
                protocolBody.innerHTML = renderProtocol(protocol);
            } else {
                protocolTitle.textContent = 'Protocol Not Available';
                protocolBody.innerHTML = renderFallbackGuidance(emergencyType);
            }
        }, 800);
        
    } catch (error) {
        clearTimeout(timeoutId);
        console.error('Error loading protocol:', error);
        showError('Connection Error', 'Unable to load medical protocol. Please check your internet connection.');
    }
}

function showError(title, message) {
    const loadingState = document.getElementById('loadingState');
    const guidanceContent = document.getElementById('guidanceContent');
    const protocolTitle = document.getElementById('protocolTitle');
    const protocolBody = document.getElementById('protocolBody');
    
    loadingState.style.display = 'none';
    guidanceContent.style.display = 'block';
    protocolTitle.textContent = title;
    protocolBody.innerHTML = `
        <div style="background: #FFE5E5; padding: 24px; border-radius: 16px; border: 2px solid #D84315; text-align: center;">
            <p style="font-weight: 700; margin-bottom: 16px; font-size: 18px; color: #D84315;">${message}</p>
            <a href="tel:112" style="display: inline-block; padding: 16px 24px; background: #D84315; color: white; text-decoration: none; border-radius: 12px; font-weight: 700; font-size: 18px;">
                Call 112 Now
            </a>
        </div>
    `;
}

function renderProtocol(protocol) {
    let html = `
        <div style="background: linear-gradient(135deg, #3D7F5F, #2D5F3F); color: white; padding: 24px; border-radius: 16px; margin-bottom: 24px; text-align: center;">
            <div style="font-size: 32px; margin-bottom: 8px;">✓</div>
            <h3 style="margin-bottom: 12px; font-size: 20px; font-weight: 700;">Emergency Protocol Active</h3>
            <p style="font-size: 16px; opacity: 0.95;">AI-guided instructions based on WHO guidelines</p>
        </div>
    `;
    
    let contactAdded = false;
    
    protocol.steps.forEach((phase, phaseIndex) => {
        html += `
            <div style="background: white; border: 2px solid #E2E8F0; border-radius: 16px; padding: 24px; margin-bottom: 24px; box-shadow: 0 2px 8px rgba(0,0,0,0.05);">
                <div style="background: linear-gradient(135deg, #E8F4F0, #F8F6F3); padding: 16px; border-radius: 12px; margin-bottom: 24px;">
                    <h3 style="color: #2D5F3F; font-size: 18px; font-weight: 700; margin: 0; text-transform: uppercase; letter-spacing: 0.5px; word-wrap: break-word;">
                        ${phase.title}
                    </h3>
                </div>
                <div style="display: flex; flex-direction: column; gap: 24px;">
        `;
        
        phase.actions.forEach((action, actionIndex) => {
            html += `
                <div style="display: flex; gap: 16px; align-items: flex-start;">
                    <div style="flex-shrink: 0; width: 56px; height: 56px; background: linear-gradient(135deg, #3D7F5F, #2D5F3F); color: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 28px; box-shadow: 0 4px 12px rgba(45, 95, 63, 0.3);">
                        ${action.step || (actionIndex + 1)}
                    </div>
                    <div style="flex: 1;">
                        <h4 style="font-size: 20px; font-weight: 700; color: #2D3748; margin-bottom: 12px; line-height: 1.4; word-wrap: break-word; overflow-wrap: break-word;">
                            ${action.instruction}
                        </h4>
                        <p style="font-size: 17px; color: #4A5568; line-height: 1.7; margin: 0; word-wrap: break-word; overflow-wrap: break-word;">
                            ${action.detail}
                        </p>
            `;
            
            if (!contactAdded && phaseIndex === 0 && actionIndex === 0 && protocol.emergency_contact) {
                html += `
                    <div style="margin-top: 16px; display: flex; gap: 12px; flex-wrap: wrap;">
                        <a href="tel:${protocol.emergency_contact.primary}" style="display: inline-flex; align-items: center; gap: 8px; padding: 12px 16px; background: #3D7F5F; color: white; text-decoration: none; border-radius: 12px; font-weight: 700; font-size: 17px; box-shadow: 0 2px 8px rgba(0,0,0,0.15);">
                            📞 Call ${protocol.emergency_contact.primary}
                        </a>
                    </div>
                `;
                contactAdded = true;
            }
            
            html += `</div></div>`;
        });
        
        html += `</div>`;
        
        if (phase.warnings) {
            html += `
                <div style="background: #FEF3C7; border-left: 4px solid #F59E0B; padding: 16px; border-radius: 12px; margin-top: 24px;">
                    <p style="font-weight: 700; color: #d97706; margin-bottom: 12px; font-size: 17px;">⚠️ Important - Avoid These:</p>
                    <ul style="margin: 0; padding-left: 24px; color: #4A5568; font-size: 16px; line-height: 1.7;">
                        ${phase.warnings.map(w => `<li style="margin-bottom: 8px; word-wrap: break-word;">${w}</li>`).join('')}
                    </ul>
                </div>
            `;
        }
        
        html += `</div>`;
    });
    
    html += `
        <div style="background: #F3F4F6; padding: 16px; border-radius: 12px; text-align: center; margin-top: 32px;">
            <p style="color: #718096; font-size: 14px; line-height: 1.6; margin: 0;">
                ℹ️ <strong>AI Emergency Guidance</strong><br>
                Based on WHO protocols. Professional care should be sought when available.
            </p>
        </div>
    `;
    
    return html;
}

function renderFallbackGuidance(emergencyType) {
    const emergencyTitles = {
        'severe-bleeding': 'Severe Bleeding',
        'not-breathing': 'Not Breathing / CPR',
        'childbirth': 'Emergency Childbirth',
        'chest-pain': 'Chest Pain',
        'snake-bite': 'Snake Bite',
        'severe-burn': 'Severe Burns'
    };
    
    const title = emergencyTitles[emergencyType] || 'Emergency';
    
    return `
        <div style="background: #FEF3C7; padding: 24px; border-radius: 16px; border: 2px solid #F59E0B; text-align: center;">
            <p style="font-weight: 700; margin-bottom: 16px; font-size: 18px; color: #2D3748;">Protocol for ${title}</p>
            <p style="color: #4A5568; margin-bottom: 24px;">Unable to load detailed protocol. Call emergency services immediately.</p>
            <a href="tel:112" style="display: inline-block; padding: 16px 24px; background: #3D7F5F; color: white; text-decoration: none; border-radius: 12px; font-weight: 700; font-size: 18px;">
                Call 112 - Emergency Services
            </a>
        </div>
    `;
}
