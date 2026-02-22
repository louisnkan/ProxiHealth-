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

// Phase 3: Load real medical protocols from offline tree
async function simulateAssessment(emergencyType) {
    const loadingState = document.getElementById('loadingState');
    const guidanceContent = document.getElementById('guidanceContent');
    const protocolTitle = document.getElementById('protocolTitle');
    const protocolBody = document.getElementById('protocolBody');
    
    try {
        // Load offline medical protocols
        const response = await fetch('data/offline-tree.json');
        const medicalData = await response.json();
        
        // Get protocol for this emergency
        const protocol = medicalData.protocols[emergencyType];
        
        // Show loading briefly
        setTimeout(() => {
            loadingState.style.display = 'none';
            guidanceContent.style.display = 'block';
            
            if (protocol) {
                protocolTitle.textContent = protocol.title;
                protocolBody.innerHTML = renderProtocol(protocol);
            } else {
                // Fallback for unmapped emergencies
                protocolTitle.textContent = 'Emergency Guidance';
                protocolBody.innerHTML = `
                    <div style="background: var(--amber-light); padding: var(--space-4); border-radius: var(--radius-md);">
                        <p style="font-weight: 600; margin-bottom: var(--space-2);">Protocol being developed</p>
                        <p style="color: var(--gray-dark);">This emergency type is being added to our medical database. For immediate help, call 112.</p>
                    </div>
                `;
            }
        }, 1000);
        
    } catch (error) {
        console.error('Error loading protocol:', error);
        loadingState.style.display = 'none';
        guidanceContent.style.display = 'block';
        protocolTitle.textContent = 'Error Loading Protocol';
        protocolBody.innerHTML = `
            <div style="background: var(--coral-light); padding: var(--space-4); border-radius: var(--radius-md);">
                <p style="font-weight: 600; margin-bottom: var(--space-2);">⚠️ Unable to load medical protocol</p>
                <p style="color: var(--gray-dark);">Please call emergency services (112) immediately while we resolve this issue.</p>
            </div>
        `;
    }
}

function renderProtocol(protocol) {
    let html = '';
    
    // Emergency contact banner
    if (protocol.emergency_contact) {
        html += `
            <div style="background: linear-gradient(135deg, var(--coral-red), #ff8787); color: white; padding: var(--space-4); border-radius: var(--radius-lg); margin-bottom: var(--space-4); text-align: center;">
                <h3 style="margin-bottom: var(--space-2); font-size: 1.5rem;">🚨 CALL FOR HELP NOW</h3>
                <div style="display: flex; gap: var(--space-2); justify-content: center; flex-wrap: wrap;">
                    <a href="tel:${protocol.emergency_contact.primary}" style="background: white; color: var(--coral-red); padding: var(--space-2) var(--space-4); border-radius: var(--radius-md); text-decoration: none; font-weight: 700; font-size: 1.25rem; display: inline-block;">
                        📞 ${protocol.emergency_contact.primary}
                    </a>
                    ${protocol.emergency_contact.alternatives ? protocol.emergency_contact.alternatives.map(num => 
                        `<a href="tel:${num}" style="background: rgba(255,255,255,0.3); color: white; padding: var(--space-2) var(--space-3); border-radius: var(--radius-md); text-decoration: none; font-weight: 600;">${num}</a>`
                    ).join('') : ''}
                </div>
                <p style="margin-top: var(--space-2); font-size: 0.9375rem; opacity: 0.95;">${protocol.emergency_contact.message}</p>
            </div>
        `;
    }
    
    // Disclaimer
    if (protocol.disclaimer) {
        html += `
            <div style="background: var(--amber-light); padding: var(--space-3); border-radius: var(--radius-md); margin-bottom: var(--space-4); border-left: 4px solid var(--amber-orange);">
                <p style="color: var(--gray-dark); font-size: 0.9375rem;"><strong>⚠️ Important:</strong> ${protocol.disclaimer}</p>
            </div>
        `;
    }
    
    // Render each phase
    protocol.steps.forEach((phase, index) => {
        html += `
            <div style="background: white; border: 2px solid var(--gray-light); border-radius: var(--radius-lg); padding: var(--space-4); margin-bottom: var(--space-4);">
                <div style="display: flex; align-items: center; gap: var(--space-2); margin-bottom: var(--space-3);">
                    <div style="width: 40px; height: 40px; background: linear-gradient(135deg, var(--forest-green), var(--sage-green)); color: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 1.25rem;">
                        ${index + 1}
                    </div>
                    <h3 style="color: var(--charcoal); font-size: 1.25rem; margin: 0;">${phase.title}</h3>
                </div>
                
                <div style="margin-left: 56px;">
                    ${phase.actions.map(action => `
                        <div style="background: var(--soft-cream); padding: var(--space-3); border-radius: var(--radius-md); margin-bottom: var(--space-2);">
                            <p style="font-weight: 600; color: var(--charcoal); margin-bottom: 4px;">
                                ${action.step ? `${action.step}. ` : ''}${action.instruction}
                            </p>
                            <p style="color: var(--gray-dark); font-size: 0.9375rem; line-height: 1.6;">
                                ${action.detail}
                            </p>
                        </div>
                    `).join('')}
                    
                    ${phase.warnings ? `
                        <div style="background: var(--coral-light); padding: var(--space-3); border-radius: var(--radius-md); margin-top: var(--space-3); border-left: 4px solid var(--coral-red);">
                            <p style="font-weight: 600; color: var(--coral-red); margin-bottom: var(--space-1);">⚠️ DO NOT:</p>
                            <ul style="margin: 0; padding-left: var(--space-3); color: var(--gray-dark);">
                                ${phase.warnings.map(w => `<li style="margin-bottom: 4px;">${w}</li>`).join('')}
                            </ul>
                        </div>
                    ` : ''}
                    
                    ${phase.good_signs ? `
                        <div style="background: var(--mint-green); padding: var(--space-3); border-radius: var(--radius-md); margin-top: var(--space-3);">
                            <p style="font-weight: 600; color: var(--forest-green); margin-bottom: var(--space-1);">✓ Good Signs:</p>
                            <ul style="margin: 0; padding-left: var(--space-3); color: var(--gray-dark);">
                                ${phase.good_signs.map(s => `<li style="margin-bottom: 4px;">${s}</li>`).join('')}
                            </ul>
                        </div>
                    ` : ''}
                    
                    ${phase.bad_signs ? `
                        <div style="background: var(--coral-light); padding: var(--space-3); border-radius: var(--radius-md); margin-top: var(--space-3);">
                            <p style="font-weight: 600; color: var(--coral-red); margin-bottom: var(--space-1);">🚨 Danger Signs - Get Help IMMEDIATELY:</p>
                            <ul style="margin: 0; padding-left: var(--space-3); color: var(--gray-dark);">
                                ${phase.bad_signs.map(s => `<li style="margin-bottom: 4px;">${s}</li>`).join('')}
                            </ul>
                        </div>
                    ` : ''}
                </div>
            </div>
        `;
    });
    
    // Danger signs (if at protocol level)
    if (protocol.danger_signs_mother) {
        html += `
            <div style="background: var(--coral-light); padding: var(--space-4); border-radius: var(--radius-lg); margin-bottom: var(--space-4); border: 2px solid var(--coral-red);">
                <h3 style="color: var(--coral-red); margin-bottom: var(--space-3);">🚨 CRITICAL WARNING SIGNS</h3>
                ${protocol.danger_signs_mother.map(ds => `
                    <div style="background: white; padding: var(--space-3); border-radius: var(--radius-md); margin-bottom: var(--space-2);">
                        <p style="font-weight: 600; color: var(--charcoal); margin-bottom: 4px;">${ds.sign}</p>
                        <p style="color: var(--gray-dark); font-size: 0.9375rem;"><strong>Action:</strong> ${ds.action}</p>
                    </div>
                `).join('')}
            </div>
        `;
    }
    
    // Transport guidance
    if (protocol.transport_guidance) {
        html += `
            <div style="background: var(--mint-green); padding: var(--space-4); border-radius: var(--radius-lg); border-left: 4px solid var(--forest-green);">
                <h4 style="color: var(--forest-green); margin-bottom: var(--space-2);">🚑 Transport to Hospital</h4>
                <p style="color: var(--gray-dark); line-height: 1.7;">${protocol.transport_guidance}</p>
            </div>
        `;
    }
    
    return html;
}
