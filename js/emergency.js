// ProxiHealth - Emergency Page Logic (Phase 3.5 Redesign)
// Security + Empowering UI + Mobile Optimized

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
            
            // Store in sessionStorage
            sessionStorage.setItem('emergency_data', JSON.stringify(emergencyData));
            
            // Show loading and load protocol
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

// Load protocol with rate limiting and security
async function loadProtocol(emergencyType) {
    const loadingState = document.getElementById('loadingState');
    const guidanceContent = document.getElementById('guidanceContent');
    const protocolTitle = document.getElementById('protocolTitle');
    const protocolBody = document.getElementById('protocolBody');
    
    // Check rate limit
    const rateLimitCheck = window.ProxiHealthSecurity.checkRateLimit('protocol_load');
    if (!rateLimitCheck.allowed) {
        loadingState.style.display = 'none';
        guidanceContent.style.display = 'block';
        protocolTitle.textContent = 'Rate Limit Exceeded';
        protocolBody.innerHTML = `
            <div style="background: var(--coral-light); padding: var(--space-4); border-radius: var(--radius-lg); border: 2px solid var(--coral-red); text-align: center;">
                <p style="font-weight: 600; color: var(--coral-red); font-size: 1.125rem; margin-bottom: var(--space-2);">
                    ${rateLimitCheck.message}
                </p>
                <p style="color: var(--gray-dark); margin-bottom: var(--space-3);">
                    For immediate emergencies, call 112 directly.
                </p>
                <a href="tel:112" style="display: inline-block; padding: var(--space-2) var(--space-4); background: var(--coral-red); color: white; text-decoration: none; border-radius: var(--radius-md); font-weight: 600;">
                    Call 112 Now
                </a>
            </div>
        `;
        return;
    }
    
    try {
        // FAILSAFE: Try multiple paths for offline protocols
        let response = await fetch('data/offline-tree.json');
        if (!response.ok) {
            response = await fetch('../data/offline-tree.json');
        }
        if (!response.ok) {
            response = await fetch('/data/offline-tree.json');
        }
        if (!response.ok) throw new Error('Protocols not found');
        
        const medicalData = await response.json();
        const protocol = medicalData.protocols[emergencyType];
        
        // Show protocol after brief loading
        setTimeout(() => {
            loadingState.style.display = 'none';
            guidanceContent.style.display = 'block';
            
            if (protocol) {
                protocolTitle.textContent = protocol.title;
                protocolBody.innerHTML = renderProtocol(protocol);
            } else {
                protocolTitle.textContent = 'Protocol Not Found';
                protocolBody.innerHTML = renderFallbackGuidance(emergencyType);
            }
        }, 800);
        
    } catch (error) {
        console.error('Error loading protocol:', error);
        setTimeout(() => {
            loadingState.style.display = 'none';
            guidanceContent.style.display = 'block';
            protocolTitle.textContent = 'Connection Error';
            protocolBody.innerHTML = renderErrorGuidance();
        }, 500);
    }
}

function renderProtocol(protocol) {
    let html = '';
    
    // Empowering header (NEW - not defensive)
    html += `
        <div style="background: linear-gradient(135deg, #3D7F5F, #2D5F3F); color: white; padding: var(--space-4); border-radius: var(--radius-lg); margin-bottom: var(--space-4); text-align: center;">
            <div style="font-size: 2rem; margin-bottom: var(--space-1);">✓</div>
            <h3 style="margin-bottom: var(--space-2); font-size: 1.375rem; font-weight: 700;">Emergency Protocol Active</h3>
            <p style="font-size: 1rem; opacity: 0.95;">AI-guided step-by-step instructions based on WHO guidelines</p>
        </div>
    `;
    
    // Emergency contact (inline with Step 1, not screaming banner)
    let contactAdded = false;
    
    // Render each phase with LARGE, CLEAR text
    protocol.steps.forEach((phase, phaseIndex) => {
        html += `
            <div style="background: white; border: 2px solid #E2E8F0; border-radius: var(--radius-lg); padding: var(--space-4); margin-bottom: var(--space-4); box-shadow: 0 2px 8px rgba(0,0,0,0.05);">
                <div style="background: linear-gradient(135deg, #E8F4F0, #F8F6F3); padding: var(--space-3); border-radius: var(--radius-md); margin-bottom: var(--space-4);">
                    <h3 style="color: #2D5F3F; font-size: 1.25rem; font-weight: 700; margin: 0; text-transform: uppercase; letter-spacing: 0.5px;">
                        ${phase.title}
                    </h3>
                </div>
                
                <div style="display: flex; flex-direction: column; gap: var(--space-4);">
        `;
        
        phase.actions.forEach((action, actionIndex) => {
            html += `
                <div style="display: flex; gap: var(--space-3); align-items: flex-start;">
                    <div style="flex-shrink: 0; width: 56px; height: 56px; background: linear-gradient(135deg, #3D7F5F, #2D5F3F); color: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 1.75rem; box-shadow: 0 4px 12px rgba(45, 95, 63, 0.3);">
                        ${action.step || (actionIndex + 1)}
                    </div>
                    <div style="flex: 1;">
                        <h4 style="font-size: 1.25rem; font-weight: 700; color: #2D3748; margin-bottom: var(--space-2); line-height: 1.4;">
                            ${action.instruction}
                        </h4>
                        <p style="font-size: 1.0625rem; color: #4A5568; line-height: 1.7; margin: 0;">
                            ${action.detail}
                        </p>
            `;
            
            // Add call button inline with first step (not separate banner)
            if (!contactAdded && phaseIndex === 0 && actionIndex === 0 && protocol.emergency_contact) {
                html += `
                    <div style="margin-top: var(--space-3); display: flex; gap: var(--space-2); flex-wrap: wrap;">
                        <a href="tel:${protocol.emergency_contact.primary}" style="display: inline-flex; align-items: center; gap: var(--space-2); padding: var(--space-2) var(--space-3); background: #3D7F5F; color: white; text-decoration: none; border-radius: var(--radius-md); font-weight: 700; font-size: 1.0625rem; box-shadow: 0 2px 8px rgba(0,0,0,0.15); transition: transform 0.2s;">
                            📞 Call ${protocol.emergency_contact.primary}
                        </a>
                        ${protocol.emergency_contact.alternatives ? protocol.emergency_contact.alternatives.map(num => 
                            `<a href="tel:${num}" style="display: inline-flex; align-items: center; padding: var(--space-2) var(--space-3); background: white; color: #3D7F5F; border: 2px solid #3D7F5F; text-decoration: none; border-radius: var(--radius-md); font-weight: 600;">${num}</a>`
                        ).join('') : ''}
                    </div>
                `;
                contactAdded = true;
            }
            
            html += `
                    </div>
                </div>
            `;
        });
        
        html += `</div>`;
        
        // Warnings (amber, not panic-red)
        if (phase.warnings) {
            html += `
                <div style="background: #FEF3C7; border-left: 4px solid #F59E0B; padding: var(--space-3); border-radius: var(--radius-md); margin-top: var(--space-4);">
                    <p style="font-weight: 700; color: #d97706; margin-bottom: var(--space-2); font-size: 1.0625rem;">⚠️ Important - Avoid These:</p>
                    <ul style="margin: 0; padding-left: var(--space-4); color: #4A5568; font-size: 1rem; line-height: 1.7;">
                        ${phase.warnings.map(w => `<li style="margin-bottom: var(--space-1);">${w}</li>`).join('')}
                    </ul>
                </div>
            `;
        }
        
        // Good/Bad signs
        if (phase.good_signs || phase.bad_signs) {
            html += `<div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: var(--space-3); margin-top: var(--space-4);">`;
            
            if (phase.good_signs) {
                html += `
                    <div style="background: #E8F4F0; padding: var(--space-3); border-radius: var(--radius-md);">
                        <p style="font-weight: 700; color: #2D5F3F; margin-bottom: var(--space-2); font-size: 1rem;">✓ Good Signs:</p>
                        <ul style="margin: 0; padding-left: var(--space-3); color: #4A5568; font-size: 0.9375rem; line-height: 1.6;">
                            ${phase.good_signs.map(s => `<li style="margin-bottom: 4px;">${s}</li>`).join('')}
                        </ul>
                    </div>
                `;
            }
            
            if (phase.bad_signs) {
                html += `
                    <div style="background: #FFE5E5; padding: var(--space-3); border-radius: var(--radius-md);">
                        <p style="font-weight: 700; color: #D84315; margin-bottom: var(--space-2); font-size: 1rem;">🚨 Danger Signs:</p>
                        <ul style="margin: 0; padding-left: var(--space-3); color: #4A5568; font-size: 0.9375rem; line-height: 1.6;">
                            ${phase.bad_signs.map(s => `<li style="margin-bottom: 4px;">${s}</li>`).join('')}
                        </ul>
                    </div>
                `;
            }
            
            html += `</div>`;
        }
        
        html += `</div>`;
    });
    
    // Protocol-level danger signs (red, because truly critical)
    if (protocol.danger_signs_mother) {
        html += `
            <div style="background: #FFE5E5; border: 2px solid #D84315; border-radius: var(--radius-lg); padding: var(--space-4); margin-bottom: var(--space-4);">
                <h3 style="color: #D84315; margin-bottom: var(--space-3); font-size: 1.25rem; font-weight: 700;">🚨 CRITICAL WARNING SIGNS</h3>
                ${protocol.danger_signs_mother.map(ds => `
                    <div style="background: white; padding: var(--space-3); border-radius: var(--radius-md); margin-bottom: var(--space-2);">
                        <p style="font-weight: 700; color: #2D3748; margin-bottom: var(--space-1); font-size: 1.0625rem;">${ds.sign}</p>
                        <p style="color: #4A5568; font-size: 1rem;"><strong>Action:</strong> ${ds.action}</p>
                    </div>
                `).join('')}
            </div>
        `;
    }
    
    // Transport guidance
    if (protocol.transport_guidance) {
        html += `
            <div style="background: #E8F4F0; padding: var(--space-4); border-radius: var(--radius-lg); border-left: 4px solid #3D7F5F; margin-bottom: var(--space-4);">
                <h4 style="color: #2D5F3F; margin-bottom: var(--space-2); font-size: 1.125rem; font-weight: 700;">🚑 Transport to Hospital</h4>
                <p style="color: #4A5568; line-height: 1.7; font-size: 1rem;">${protocol.transport_guidance}</p>
            </div>
        `;
    }
    
    // Footer disclaimer (small, present but not dominant)
    html += `
        <div style="background: #F3F4F6; padding: var(--space-3); border-radius: var(--radius-md); text-align: center; margin-top: var(--space-5);">
            <p style="color: #718096; font-size: 0.875rem; line-height: 1.6; margin: 0;">
                ℹ️ <strong>AI Emergency Guidance</strong><br>
                This protocol is based on WHO guidelines and is being evaluated for accuracy in real emergencies. Professional medical care should be sought when available.
            </p>
        </div>
    `;
    
    return html;
}

function renderFallbackGuidance(emergencyType) {
    return `
        <div style="background: #FEF3C7; padding: var(--space-4); border-radius: var(--radius-lg); border: 2px solid #F59E0B; text-align: center;">
            <p style="font-weight: 700; margin-bottom: var(--space-2); font-size: 1.125rem; color: #2D3748;">Protocol Currently Unavailable</p>
            <p style="color: #4A5568; margin-bottom: var(--space-3);">This emergency type is being added to our database.</p>
            <a href="tel:112" style="display: inline-block; padding: var(--space-3) var(--space-4); background: #3D7F5F; color: white; text-decoration: none; border-radius: var(--radius-md); font-weight: 700; font-size: 1.125rem;">
                Call 112 - Emergency Services
            </a>
        </div>
    `;
}

function renderErrorGuidance() {
    return `
        <div style="background: #FFE5E5; padding: var(--space-4); border-radius: var(--radius-lg); border: 2px solid #D84315; text-align: center;">
            <p style="font-weight: 700; margin-bottom: var(--space-2); font-size: 1.125rem; color: #D84315;">Unable to Load Protocol</p>
            <p style="color: #4A5568; margin-bottom: var(--space-3);">Connection error. Please check your internet and try again.</p>
            <a href="tel:112" style="display: inline-block; padding: var(--space-3) var(--space-4); background: #D84315; color: white; text-decoration: none; border-radius: var(--radius-md); font-weight: 700; font-size: 1.125rem;">
                Call 112 Now
            </a>
        </div>
    `;
                            }
