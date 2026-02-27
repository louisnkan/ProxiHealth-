/**
 * ProxiHealth Triage.js v3
 * - Full care recommendations in results (not just "Monitor Closely")
 * - Specific actions + when to seek help
 */

const ProxiTriage = (() => {
  'use strict';

  let tree = null;
  let history = [];

  const loadingEl  = document.getElementById('triage-loading');
  const fallbackEl = document.getElementById('triage-fallback');
  const container  = document.getElementById('triage-container');

  // ── Extended triage tree with FULL care recommendations ──
  const INLINE_TREE = {
    start: {
      type: 'question',
      text: 'What is most urgently concerning right now?',
      options: [
        { label: 'Someone is unconscious or not breathing normally', next: 'unconscious' },
        { label: 'Severe pain, injury, or active bleeding', next: 'severe_pain' },
        { label: 'High fever or signs of serious illness', next: 'fever_illness' },
        { label: 'Mild to moderate symptoms I want to understand', next: 'mild_symptoms' }
      ]
    },
    unconscious: {
      type: 'result', urgency: 'critical',
      title: 'Possible cardiac or respiratory emergency',
      summary: 'Check for breathing immediately. If not breathing normally, begin CPR and send someone to call emergency services right now.',
      care: [
        'Begin CPR: push hard and fast in the centre of the chest at 100 compressions per minute.',
        'After every 30 compressions, give 2 rescue breaths (tilt head back, pinch nose).',
        'Do not stop until the person breathes or trained help arrives.'
      ],
      seek: ['The person is not breathing', 'You are alone — shout for any bystanders to call 112'],
      protocol: 'cpr_adult',
      diseases: ['Cardiac arrest', 'Drowning', 'Severe asthma', 'Poisoning']
    },
    severe_pain: {
      type: 'question',
      text: 'Where is the pain or injury located?',
      options: [
        { label: 'Chest pain or difficulty breathing', next: 'chest_pain' },
        { label: 'Severe bleeding from a wound', next: 'bleeding_result' },
        { label: 'Head injury or loss of consciousness', next: 'head_injury' },
        { label: 'Abdominal pain', next: 'abdominal_pain' }
      ]
    },
    chest_pain: {
      type: 'result', urgency: 'critical',
      title: 'Possible cardiac emergency',
      summary: 'Chest pain with difficulty breathing can be a heart attack or other serious emergency. Act immediately.',
      care: [
        'Have the person sit or lie in a comfortable position — do not let them walk around.',
        'If they have prescribed aspirin and are not allergic, have them chew one (300mg) slowly.',
        'Loosen any tight clothing around the chest and neck.',
        'Keep them calm and still while help is arranged.'
      ],
      seek: ['Any chest pain lasting more than a few minutes', 'Pain spreading to arm, jaw, or back', 'Sweating, nausea, or light-headedness with chest pain'],
      protocol: 'cpr_adult',
      diseases: ['Heart attack', 'Angina', 'Pulmonary embolism', 'Severe asthma']
    },
    bleeding_result: {
      type: 'result', urgency: 'critical',
      title: 'Severe bleeding',
      summary: 'Apply immediate pressure and do not release it. Blood loss can be life-threatening within minutes.',
      care: [
        'Press a clean cloth hard directly onto the wound and hold without lifting.',
        'If blood soaks through, add more cloth on top without removing the first layer.',
        'Raise the injured limb above heart level if possible.',
        'If bleeding is from a limb and won\'t stop, tie a tight tourniquet 5 to 7 cm above the wound.'
      ],
      seek: ['Blood is soaking through after 15 minutes of pressure', 'The wound is deep or gaping', 'Person becomes confused or very pale'],
      protocol: 'bleeding',
      diseases: ['Laceration', 'Arterial bleeding', 'Internal bleeding']
    },
    head_injury: {
      type: 'result', urgency: 'high',
      title: 'Head injury — monitor carefully',
      summary: 'Head injuries can worsen over hours. Watch closely for danger signs even if the person seems okay initially.',
      care: [
        'Keep the person still and calm. Do not give food or water in case surgery is needed.',
        'If unconscious but breathing, place on their side (recovery position) to prevent choking.',
        'Apply a cold compress gently to any swelling on the outside of the head.',
        'Record the time of injury and any loss of consciousness to tell doctors.'
      ],
      seek: ['Loss of consciousness, even briefly', 'Vomiting more than once', 'Severe headache getting worse', 'One pupil larger than the other', 'Weakness in arms or legs', 'Confusion or unusual behaviour'],
      diseases: ['Concussion', 'Skull fracture', 'Intracranial bleed']
    },
    abdominal_pain: {
      type: 'question',
      text: 'How would you describe the abdominal pain?',
      options: [
        { label: 'Sudden, severe pain — worst I have felt', next: 'acute_abdomen' },
        { label: 'Pain with vomiting and diarrhoea for several days', next: 'gastroenteritis' },
        { label: 'Mild cramping or bloating', next: 'mild_abdomen' }
      ]
    },
    acute_abdomen: {
      type: 'result', urgency: 'critical',
      title: 'Possible surgical emergency',
      summary: 'Sudden severe abdominal pain can indicate appendicitis, a perforated organ, or other surgical emergencies. Go to hospital immediately.',
      care: [
        'Do not give food, water, or painkillers — surgery may be needed urgently.',
        'Keep the person lying still in a comfortable position.',
        'Note exactly where the pain is worst and when it started.'
      ],
      seek: ['Pain is constant and worsening', 'Abdomen is rigid or tender to touch', 'Fever with severe abdominal pain'],
      diseases: ['Appendicitis', 'Perforated ulcer', 'Ectopic pregnancy', 'Bowel obstruction']
    },
    gastroenteritis: {
      type: 'result', urgency: 'high',
      title: 'Gastroenteritis — prevent dehydration',
      summary: 'Vomiting and diarrhoea cause dangerous fluid loss. Oral rehydration is the most important treatment.',
      care: [
        'Start oral rehydration immediately: 1 litre clean water + 6 teaspoons sugar + half teaspoon salt.',
        'Take small sips every few minutes even if vomiting — some fluid is absorbed.',
        'Avoid solid food until vomiting stops, then start with plain rice, bread, or banana.',
        'Rest and keep warm.'
      ],
      seek: ['No urination for more than 6 hours', 'Sunken eyes or extremely dry mouth', 'Cannot keep any fluid down for more than 4 hours', 'Blood in stool', 'High fever above 38.5°C'],
      protocol: 'cholera',
      diseases: ['Cholera', 'Food poisoning', 'Typhoid', 'Viral gastroenteritis']
    },
    mild_abdomen: {
      type: 'result', urgency: 'low',
      title: 'Mild abdominal discomfort',
      summary: 'Mild cramping and bloating is usually not serious and often resolves with rest and hydration.',
      care: [
        'Drink plenty of clean water or herbal tea.',
        'Avoid spicy, fatty, or very rich foods temporarily.',
        'A hot water bottle or warm compress on the abdomen can ease cramping.',
        'Paracetamol 500 to 1000mg can help with pain if no other condition is present.'
      ],
      seek: ['Pain worsens significantly over the next few hours', 'Fever develops', 'Vomiting begins', 'Pain becomes constant rather than cramping']
    },
    fever_illness: {
      type: 'question',
      text: 'How long has the fever been present and how did it start?',
      options: [
        { label: 'Started suddenly in the last 24 hours with shivering or chills', next: 'fever_sudden' },
        { label: 'Building gradually over 2 to 5 days', next: 'fever_gradual' },
        { label: 'High fever with a severe headache and stiff neck', next: 'meningitis_path' },
        { label: 'Fever alongside vomiting and very watery diarrhoea', next: 'cholera_path' }
      ]
    },
    fever_sudden: {
      type: 'question',
      text: 'With the sudden fever, which other symptoms are present?',
      options: [
        { label: 'Shivering, sweating in cycles, body aches — typical of a cycle pattern', next: 'malaria_path' },
        { label: 'Joint pain, rash, or pain behind the eyes', next: 'dengue_path' },
        { label: 'Sore throat, runny nose, and mild cough', next: 'mild_cold' },
        { label: 'Chest pain, difficulty breathing, or productive cough', next: 'pneumonia_path' }
      ]
    },
    fever_gradual: {
      type: 'question',
      text: 'With the gradually building fever, what other symptoms stand out?',
      options: [
        { label: 'Stomach pain, constipation or diarrhoea, and general weakness', next: 'typhoid_path' },
        { label: 'Cough, night sweats, and weight loss over weeks', next: 'tb_path' },
        { label: 'Urinary pain, frequent urination, or back pain near kidneys', next: 'uti_path' },
        { label: 'No clear other symptoms — just a persistent fever', next: 'persistent_fever' }
      ]
    },
    dengue_path: {
      type: 'result', urgency: 'high',
      title: 'Possible Dengue or Chikungunya',
      summary: 'Sudden fever with joint pain, rash, or pain behind the eyes suggests a mosquito-borne viral fever. These are distinct from malaria and require different management.',
      care: [
        'Take paracetamol only for fever and pain — do NOT use ibuprofen or aspirin with dengue as it increases bleeding risk.',
        'Rest completely and drink plenty of fluids — at least 2 litres of water or oral rehydration solution per day.',
        'Use mosquito nets and repellent to prevent spreading the virus to others via mosquitoes.',
        'A blood test at a clinic can confirm dengue and check your platelet count.',
        'Monitor for warning signs closely over the first 5 days.'
      ],
      seek: ['Severe abdominal pain', 'Vomiting that won't stop', 'Bleeding from gums, nose, or in urine', 'Rapid breathing or chest tightness', 'Extreme fatigue or restlessness', 'Fever disappears but you feel much worse — this can be the dangerous phase'],
      diseases: ['Dengue fever', 'Chikungunya', 'Zika virus', 'Malaria']
    },
    pneumonia_path: {
      type: 'result', urgency: 'high',
      title: 'Possible pneumonia or lower respiratory infection',
      summary: 'Fever with chest pain and difficulty breathing suggests an infection in the lungs. Pneumonia can become life-threatening quickly, especially in children and elderly people.',
      care: [
        'Rest in an upright position — sitting up makes breathing easier than lying flat.',
        'Take paracetamol for fever and pain.',
        'Drink warm fluids frequently — water, broth, or warm tea with honey.',
        'Steam inhalation can help loosen chest congestion.',
        'Get to a clinic for a chest examination and prescribed antibiotics as soon as possible.'
      ],
      seek: ['Breathing rate above 30 breaths per minute in adults', 'Blue tinge to lips or fingernails', 'Confusion or extreme drowsiness', 'Fever above 40°C', 'Coughing up blood or rust-coloured sputum', 'In children: ribs visible with each breath or nostrils flaring'],
      diseases: ['Bacterial pneumonia', 'Viral pneumonia', 'Bronchitis', 'Tuberculosis', 'COVID-19']
    },
    tb_path: {
      type: 'result', urgency: 'high',
      title: 'Possible Tuberculosis (TB)',
      summary: 'A persistent cough lasting more than 2 weeks with fever, night sweats, and weight loss are the classic signs of TB. TB is curable but must be diagnosed and treated by a clinic.',
      care: [
        'Do not delay — go to a clinic or TB testing centre as soon as possible for a sputum test or chest X-ray.',
        'Cover your mouth and nose when coughing to protect those around you.',
        'Ensure good ventilation in your living space — open windows when possible.',
        'Eat nutritious food to support your immune system while awaiting diagnosis.',
        'Do not start or stop any TB treatment without medical supervision.'
      ],
      seek: ['Coughing blood', 'Extreme weight loss', 'Severe breathlessness', 'Anyone in your household showing similar symptoms'],
      diseases: ['Tuberculosis (TB)', 'HIV-related pneumonia', 'Lung cancer', 'Chronic bronchitis']
    },
    uti_path: {
      type: 'result', urgency: 'medium',
      title: 'Possible urinary tract or kidney infection',
      summary: 'Fever with urinary pain or frequent urination suggests a bladder or kidney infection. Kidney infections can become serious if untreated.',
      care: [
        'Drink at least 2 litres of water per day to help flush the urinary tract.',
        'Take paracetamol for pain and fever.',
        'Get to a clinic for a urine test and prescribed antibiotics — UTIs do not clear on their own reliably.',
        'Avoid holding urine for long periods. Empty your bladder fully each time.',
        'Women should wipe front to back after using the toilet.'
      ],
      seek: ['Fever above 38.5°C with back or side pain near the kidneys', 'Shaking chills — suggests kidney infection', 'Nausea and vomiting alongside urinary symptoms', 'Blood in urine', 'Symptoms not improving after 48 hours of antibiotics'],
      diseases: ['Urinary tract infection', 'Kidney infection (pyelonephritis)', 'Bladder infection', 'Sexually transmitted infection']
    },
    persistent_fever: {
      type: 'result', urgency: 'high',
      title: 'Persistent unexplained fever — seek testing',
      summary: 'A fever that persists for more than 3 days without a clear cause should always be investigated at a clinic. In Africa, the most important causes to rule out are malaria, typhoid, and HIV-related illness.',
      care: [
        'Take paracetamol to manage fever while arranging to go to a clinic.',
        'Keep drinking fluids — fever causes significant fluid loss.',
        'Note the fever pattern: does it come and go at certain times of day? This helps doctors diagnose the cause.',
        'Go to a clinic for blood tests — at minimum a malaria RDT and full blood count.',
        'Do not take leftover antibiotics without a diagnosis — this risks antibiotic resistance and can mask symptoms.'
      ],
      seek: ['Fever above 39.5°C', 'Confusion, difficulty waking, or seizures', 'Severe weakness or inability to stand', 'Any rash developing alongside the fever', 'Fever persisting beyond 5 days despite paracetamol'],
      diseases: ['Malaria', 'Typhoid', 'HIV-related illness', 'Brucellosis', 'Visceral leishmaniasis']
    },
    malaria_path: {
      type: 'result', urgency: 'high',
      title: 'Possible malaria',
      summary: 'Sudden high fever with shivering in an African setting is malaria until proven otherwise. A rapid test is needed today.',
      care: [
        'Give paracetamol (1000mg for adults, dose by weight for children) to reduce fever now.',
        'Keep the person well hydrated with clean water or oral rehydration salts.',
        'Use a cool damp cloth on the forehead and armpits to help bring down fever.',
        'Get to the nearest clinic for a malaria rapid diagnostic test (RDT) today — same day.'
      ],
      seek: ['Convulsions or seizures', 'Unconsciousness or confusion', 'Inability to drink or keep fluids down', 'Very fast breathing or severe weakness', 'Child under 5 — do not wait, go immediately'],
      protocol: 'malaria',
      diseases: ['Malaria (P. falciparum)', 'Typhoid', 'Dengue', 'Severe bacterial infection']
    },
    typhoid_path: {
      type: 'result', urgency: 'high',
      title: 'Possible typhoid fever',
      summary: 'Typhoid builds slowly over days with rising fever and abdominal symptoms. Antibiotics from a clinic are essential.',
      care: [
        'Give paracetamol for fever. Do not use ibuprofen or aspirin — they risk causing bleeding.',
        'Ensure strict handwashing and use only boiled or treated water.',
        'Eat soft, easy-to-digest foods: rice, bread, bananas, boiled vegetables.',
        'Get to a clinic for a Widal test or blood culture to confirm diagnosis.'
      ],
      seek: ['Black or bloody stool (possible intestinal bleeding)', 'Sudden severe abdominal pain', 'Confusion or extreme drowsiness', 'Fever above 40°C'],
      protocol: 'typhoid',
      diseases: ['Typhoid', 'Malaria', 'Appendicitis', 'Brucellosis']
    },
    meningitis_path: {
      type: 'result', urgency: 'critical',
      title: 'Possible meningitis — go immediately',
      summary: 'Fever with stiff neck and severe headache is a medical emergency. Meningitis can kill in 24 hours. Do not wait.',
      care: [
        'Go to the nearest hospital immediately — do not wait to see if symptoms improve.',
        'Keep the person in a dark, quiet room — light and noise worsen symptoms significantly.',
        'Do not give food or drink as they may need urgent IV treatment.',
        'If a rash of small red or purple spots appears that does not fade when pressed with a glass, this is a critical emergency — run.'
      ],
      seek: ['Any combination of fever + stiff neck + severe headache = go now', 'Rash that does not fade under pressure', 'In infants: bulging soft spot, high-pitched cry, refusing to feed'],
      protocol: 'meningitis',
      diseases: ['Bacterial meningitis', 'Viral meningitis', 'Severe malaria', 'Encephalitis']
    },
    cholera_path: {
      type: 'result', urgency: 'high',
      title: 'Possible cholera or severe gastroenteritis',
      summary: 'Sudden severe watery diarrhoea can cause life-threatening dehydration within hours. Start rehydration immediately.',
      care: [
        'Start oral rehydration immediately: 1 litre clean water + 6 teaspoons sugar + half teaspoon salt.',
        'The person should drink a cup of ORS after every episode of diarrhoea.',
        'For children: give ORS by syringe or spoon, 5 mL every 2 to 3 minutes if vomiting.',
        'Continue breastfeeding infants throughout. Do not stop.',
        'Wash hands thoroughly after every toilet visit to prevent spread.'
      ],
      seek: ['No urination for 6+ hours', 'Sunken eyes, dry mouth, extreme weakness', 'Cannot keep any fluid down at all', 'Confusion or loss of consciousness'],
      protocol: 'cholera',
      diseases: ['Cholera', 'Food poisoning', 'Typhoid', 'Rotavirus']
    },
    mild_symptoms: {
      type: 'question',
      text: 'What are your main symptoms?',
      options: [
        { label: 'Insect bite with pain, itching, or swelling', next: 'insect_bite' },
        { label: 'Back pain or muscle pain', next: 'back_pain' },
        { label: 'Mild fever, cold, or sore throat', next: 'mild_cold' },
        { label: 'Rash or skin irritation', next: 'rash' },
        { label: 'Eye, ear, tooth, worm, or digestive issue', next: 'non_urgent_list' }
      ]
    },
    insect_bite: {
      type: 'result', urgency: 'low',
      title: 'Insect bite',
      summary: 'Most insect bites are minor and resolve within a few days with simple home treatment.',
      care: [
        'Clean the bite area gently with soap and clean water.',
        'Apply an ice pack wrapped in cloth for 10 to 15 minutes to reduce swelling and pain.',
        'Take an antihistamine such as chlorphenamine (Piriton) or loratadine if itching is significant.',
        'Take ibuprofen 400mg or paracetamol 500 to 1000mg for pain as needed.',
        'Avoid scratching — it increases infection risk and can worsen swelling.',
        'Keep the area clean and dry. Apply antiseptic if available.'
      ],
      seek: ['Swelling spreading rapidly beyond the bite area', 'Difficulty breathing or swallowing', 'Fever developing within 24 hours', 'Dizziness, confusion, or rapid heartbeat', 'Bite area becomes hot, red, and increasingly painful after 2 to 3 days'],
      diseases: ['Insect bite reaction', 'Allergic reaction', 'Secondary infection', 'Cellulitis']
    },
    back_pain: {
      type: 'result', urgency: 'low',
      title: 'Back pain',
      summary: 'Most back pain is muscular and improves with rest, heat, and gentle movement.',
      care: [
        'Rest for 1 to 2 days but avoid complete bed rest — gentle movement helps recovery.',
        'Apply a hot water bottle or warm cloth to the painful area for 15 to 20 minutes several times a day.',
        'Take ibuprofen 400mg with food, or paracetamol 500 to 1000mg for pain relief.',
        'Gentle stretching and walking short distances can reduce stiffness.',
        'Sleep on your side with a pillow between your knees if this helps.'
      ],
      seek: ['Pain shoots down one or both legs', 'Numbness or tingling in legs or feet', 'You lose control of bladder or bowel', 'Fever combined with back pain', 'Pain follows an injury or fall', 'Pain is constant and worsening at night'],
      diseases: ['Muscle strain', 'Disc prolapse', 'Kidney infection', 'Sciatica']
    },
    mild_cold: {
      type: 'result', urgency: 'low',
      title: 'Mild upper respiratory illness',
      summary: 'Common colds and mild fevers usually resolve in 5 to 7 days with rest and hydration.',
      care: [
        'Rest as much as possible and drink plenty of fluids — water, broth, or juice.',
        'Take paracetamol 500 to 1000mg to reduce fever and relieve aches.',
        'Gargle warm salt water for sore throat: half teaspoon salt in a cup of warm water.',
        'Steam inhalation can help with congestion: lean over a bowl of hot water with a towel over your head.',
        'Honey and warm water or tea can soothe a sore throat.'
      ],
      seek: ['Fever above 39°C lasting more than 3 days', 'Difficulty breathing or wheezing', 'Severe headache or stiff neck', 'Symptoms worsening after 3 days rather than improving'],
      diseases: ['Common cold', 'Influenza', 'Mild malaria', 'Tonsillitis']
    },
    rash: {
      type: 'result', urgency: 'medium',
      title: 'Skin rash — assess carefully',
      summary: 'Rashes have many causes from simple allergies to serious infections. The appearance and location matter.',
      care: [
        'Note when the rash started and if anything new was eaten, touched, or worn before it appeared.',
        'Avoid scratching. Keep the area clean and cool.',
        'For a simple itchy rash with no fever, an antihistamine like loratadine or chlorphenamine can help.',
        'A 1% hydrocortisone cream can reduce inflammation for simple contact rashes.',
        'Do not apply traditional remedies, strong soaps, or unknown creams to the rash.'
      ],
      seek: ['Rash appears as small red or purple spots that do not fade when you press a glass against them — go immediately (meningitis)', 'Rash spreads rapidly across the body', 'Fever above 38.5°C with the rash', 'Difficulty breathing or facial swelling', 'Rash is very painful rather than just itchy'],
      diseases: ['Contact dermatitis', 'Allergic reaction', 'Measles', 'Chickenpox', 'Meningococcal rash']
    },

    // ── NON-URGENT OFFLINE ILLNESS LIST ──────────────────────
    // These are accessible from the non-urgent entry point on the homepage

    non_urgent_list: {
      type: 'question',
      text: 'Which of these best describes what you or the patient is experiencing?',
      options: [
        { label: 'Eye pain, redness, or discharge', next: 'conjunctivitis' },
        { label: 'Toothache or jaw swelling', next: 'toothache' },
        { label: 'Ear pain or blocked ear', next: 'ear_infection' },
        { label: 'Painful urination or discharge', next: 'uti_path' },
        { label: 'Worm symptoms — itchy bottom, worms in stool', next: 'worms' },
        { label: 'Muscle pain or body aches without fever', next: 'muscle_pain' },
        { label: 'Heartburn, acid reflux, or indigestion', next: 'heartburn' },
        { label: 'Constipation — no stool for 3 or more days', next: 'constipation' }
      ]
    },

    conjunctivitis: {
      type: 'result', urgency: 'low',
      title: 'Possible conjunctivitis (pink eye)',
      summary: 'Redness, discharge, or crusting in the eye is usually bacterial or viral conjunctivitis. Highly contagious but usually not dangerous unless it involves pain or vision change.',
      care: [
        'Bathe the eye with clean cooled boiled water using a clean cloth. Always wipe from the inner corner outward.',
        'Do not share towels, pillowcases, or face cloths with others.',
        'Chloramphenicol 0.5% eye drops (available without prescription at most pharmacies) applied 4 times daily for 5 days treats bacterial conjunctivitis.',
        'Wash hands thoroughly before and after touching the eye area.',
        'Viral conjunctivitis usually clears on its own in 1 to 2 weeks with clean hygiene alone.'
      ],
      seek: ['Severe eye pain — not just irritation', 'Vision becomes blurred or reduced', 'The eye becomes very swollen', 'No improvement after 5 days of treatment', 'Newborn with eye discharge — see a doctor same day'],
      diseases: ['Bacterial conjunctivitis', 'Viral conjunctivitis', 'Allergic conjunctivitis', 'Trachoma']
    },

    toothache: {
      type: 'result', urgency: 'low',
      title: 'Toothache or dental abscess',
      summary: 'Dental pain is usually from tooth decay, a cracked tooth, or a dental abscess. An untreated abscess can spread infection and become dangerous.',
      care: [
        'Take ibuprofen 400mg with food every 6 to 8 hours for pain — it works better than paracetamol for dental pain.',
        'Rinse with warm salt water (half teaspoon salt in a glass of warm water) 2 to 3 times per day.',
        'Avoid very hot, very cold, or very sweet food and drinks which worsen pain.',
        'Clove oil applied carefully to the affected tooth or gum with a cotton swab can provide temporary relief.',
        'See a dentist as soon as possible — dental pain does not resolve without treatment.'
      ],
      seek: ['Swelling spreading to the jaw, neck, or under the eye', 'Difficulty opening your mouth wide', 'Fever developing alongside the toothache', 'Difficulty swallowing or breathing'],
      diseases: ['Dental caries', 'Dental abscess', 'Pericoronitis', 'Gum disease']
    },

    ear_infection: {
      type: 'result', urgency: 'low',
      title: 'Possible ear infection or otitis',
      summary: 'Ear pain is most commonly caused by infection (otitis media — middle ear, or otitis externa — outer canal). Common in children but affects all ages.',
      care: [
        'Take paracetamol or ibuprofen for pain relief at the doses on the packet.',
        'Apply a warm cloth or warm water bottle wrapped in a cloth gently against the ear for pain relief.',
        'Do not insert anything into the ear — cotton buds, fingers, or traditional remedies can worsen injury.',
        'Keep the ear dry. When bathing, place cotton wool coated with petroleum jelly in the outer ear.',
        'Most mild ear infections in adults resolve in 3 to 5 days. Seek antibiotics if not improving.'
      ],
      seek: ['Discharge of pus or fluid from the ear', 'Fever above 38.5°C', 'Hearing loss developing', 'Swelling or redness behind the ear', 'Symptoms not improving after 3 days', 'Child under 2 years with ear pain — see a doctor'],
      diseases: ['Otitis media', 'Otitis externa', 'Ruptured eardrum', 'Mastoiditis']
    },

    worms: {
      type: 'result', urgency: 'low',
      title: 'Intestinal worms',
      summary: 'Intestinal worms (roundworm, hookworm, threadworm) are extremely common in Africa. Itching around the anus, especially at night, visible worms in stool, and poor growth in children are key signs.',
      care: [
        'Mebendazole 500mg as a single dose OR 100mg twice daily for 3 days treats most intestinal worms. Available over the counter at pharmacies.',
        'Albendazole 400mg as a single dose is an alternative and treats a wider range of worm species.',
        'Treat all household members and children at the same time to prevent re-infection.',
        'Wash hands thoroughly with soap before eating and after using the toilet.',
        'Wash all fruits and vegetables. Cook meat thoroughly.',
        'Wear footwear outdoors — hookworm enters through bare feet.'
      ],
      seek: ['Severe abdominal pain', 'Worms visible coming from the nose or mouth', 'Child with a swollen belly and not growing', 'Coughing up worms', 'Anaemia signs: very pale gums or inner eyelids, extreme tiredness'],
      diseases: ['Roundworm (Ascaris)', 'Hookworm', 'Threadworm (Pinworm)', 'Tapeworm', 'Whipworm']
    },

    muscle_pain: {
      type: 'result', urgency: 'low',
      title: 'Muscle pain or body aches',
      summary: 'Muscle pain without fever is usually from overuse, strain, or tension. With fever it suggests infection — use the Fever triage path if fever is present.',
      care: [
        'Rest the affected area for 24 to 48 hours. Avoid the activity that caused the pain.',
        'Apply ice wrapped in cloth for 10 to 15 minutes during the first 24 to 48 hours for injury-related pain.',
        'After 48 hours, switch to gentle heat — warm cloth or warm water bottle — to relax tight muscles.',
        'Ibuprofen 400mg every 6 to 8 hours with food reduces both pain and inflammation.',
        'Gentle stretching and movement (not rest) helps faster recovery for most muscle strains.',
        'Oral rehydration salts help if pain follows heavy physical work in heat — dehydration causes severe muscle cramps.'
      ],
      seek: ['Extreme weakness or inability to use a limb', 'Muscle pain that is getting steadily worse over days', 'Dark brown or cola-coloured urine after intense exercise — go immediately (rhabdomyolysis)', 'Neck stiffness combined with headache and fever'],
      diseases: ['Muscle strain', 'Exercise-induced soreness', 'Dehydration', 'Sickle cell crisis', 'Early malaria']
    },

    heartburn: {
      type: 'result', urgency: 'low',
      title: 'Heartburn or acid indigestion',
      summary: 'A burning feeling in the chest or throat after eating is usually acid reflux. Common and manageable at home, but persistent cases need medical attention.',
      care: [
        'Antacids such as aluminium hydroxide/magnesium hydroxide (Maalox) or calcium carbonate chewable tablets provide fast relief.',
        'Omeprazole 20mg once daily before breakfast for 7 to 14 days treats persistent acid reflux. Available at most pharmacies.',
        'Avoid lying down for at least 2 hours after eating.',
        'Avoid spicy food, citrus, fatty food, alcohol, and large late-night meals.',
        'Sleep with your head and chest slightly elevated.',
        'Drink small amounts of water frequently rather than large quantities at once.'
      ],
      seek: ['Difficulty swallowing — food gets stuck', 'Vomiting blood or black material', 'Unexplained weight loss alongside the heartburn', 'Chest pain that spreads to the arm, jaw, or back — this could be cardiac, not acid'],
      diseases: ['Gastroesophageal reflux disease (GERD)', 'Peptic ulcer', 'Gastritis', 'Hiatal hernia']
    },

    constipation: {
      type: 'result', urgency: 'low',
      title: 'Constipation',
      summary: 'No stool for 3 or more days, or hard/painful stool, is constipation. Usually due to low fibre, low water intake, or inactivity.',
      care: [
        'Drink at least 2 litres of water per day — dehydration is the most common cause.',
        'Eat high-fibre foods: fruits (mango, pawpaw, guava), vegetables, beans, and whole grains.',
        'Bisacodyl 5mg tablets taken at night is a gentle effective laxative available at most pharmacies.',
        'Glycerine suppositories provide faster relief if oral laxatives are unavailable.',
        'Walk or move around regularly — physical activity helps bowel movement.',
        'Never strain forcefully on the toilet — this causes haemorrhoids.'
      ],
      seek: ['No stool for more than 7 days despite treatment', 'Severe abdominal pain or bloating', 'Blood in stool', 'Alternating constipation and diarrhoea over weeks', 'Unexplained weight loss alongside constipation'],
      diseases: ['Functional constipation', 'Irritable bowel syndrome', 'Hypothyroidism', 'Bowel obstruction']
    }
  };

  // ── Render a node ─────────────────────────────────────────
  function renderNode(nodeId) {
    const node = INLINE_TREE[nodeId];
    if (!node) return;
    history.push(nodeId);
    updateProgress();
    node.type === 'question' ? renderQuestion(node) : renderResult(node);
  }

  // ── Render question ───────────────────────────────────────
  function renderQuestion(node) {
    container.innerHTML = `
      <div class="question-card" role="main" aria-live="polite">
        <div class="question-card__step">Step ${history.length}</div>
        <div class="question-card__text">${node.text}</div>
        <div class="answer-list" role="listbox">
          ${node.options.map(opt => `
            <button class="answer-btn" data-next="${opt.next}">${opt.label}</button>
          `).join('')}
        </div>
      </div>
      ${history.length > 1 ? backBtnHTML() : ''}
    `;
    container.querySelectorAll('.answer-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        btn.classList.add('answer-btn--selected');
        setTimeout(() => renderNode(btn.dataset.next), 220);
      });
    });
    bindBackBtn();
  }

  // ── Render result with FULL care recommendations ──────────
  function renderResult(node) {
    const urgencyClass = node.urgency === 'critical' ? 'high' : node.urgency === 'high' ? 'medium' : 'low';
    const urgencyLabel = node.urgency === 'critical' ? '🔴 Emergency — Act Immediately' :
                         node.urgency === 'high'     ? '🟡 Seek Care Today' : '🟢 Monitor at Home';

    const careItems = (node.care || []).map(c => `<li>${c}</li>`).join('');
    const seekItems = (node.seek || []).map(s => `<li>${s}</li>`).join('');

    // Disease chip → deep-link to specific protocol (hash = auto-opens that protocol)
    const DISEASE_PROTOCOL_MAP = {
      // Emergency protocols
      'Malaria (P. falciparum)': 'emergency.html#malaria',
      'Malaria': 'emergency.html#malaria',
      'Cholera': 'emergency.html#cholera',
      'Typhoid': 'emergency.html#typhoid',
      'Meningitis': 'emergency.html#meningitis',
      'Bacterial meningitis': 'emergency.html#meningitis',
      'Viral meningitis': 'emergency.html#meningitis',
      'Cardiac arrest': 'emergency.html#cpr_adult',
      'Laceration': 'emergency.html#bleeding',
      'Arterial bleeding': 'emergency.html#bleeding',
      'Internal bleeding': 'emergency.html#bleeding',
      'Heart attack': 'emergency.html#cpr_adult',
      'Snake bite': 'emergency.html#snake_bite',
      'Burns': 'emergency.html#burns',
      'Choking': 'emergency.html#choking',
    };
    const diseaseTags = (node.diseases || []).map(d => {
      const link = DISEASE_PROTOCOL_MAP[d];
      if (link) {
        return `<a href="${link}" class="disease-tag disease-tag--match disease-tag--link" title="View ${d} protocol">
          ${d} <span style="opacity:0.7;font-size:0.7em;">→</span>
        </a>`;
      }
      return `<span class="disease-tag disease-tag--match">${d}</span>`;
    }).join('');

    const protocolLink = node.protocol
      ? `<a href="emergency.html#${node.protocol}" class="btn btn--primary mt-md btn--inline">View Full Protocol →</a>` : '';

    container.innerHTML = `
      <div class="result-card result-card--${urgencyClass}" role="main" aria-live="polite">
        <div class="result-card__level">${urgencyLabel}</div>
        <h2 class="result-card__title">${node.title}</h2>
        <p class="result-card__summary">${node.summary}</p>

        ${careItems ? `
        <div class="care-box">
          <div class="care-box__title">💊 Care Recommendations</div>
          <ul class="care-list">${careItems}</ul>
        </div>` : ''}

        ${seekItems ? `
        <div class="seek-box">
          <div class="seek-box__title">🚨 Seek Help If</div>
          <ul class="seek-list">${seekItems}</ul>
        </div>` : ''}

        ${diseaseTags ? `<div class="disease-tags">${diseaseTags}</div>` : ''}
        ${protocolLink}
      </div>

      <div class="card card--green mt-md" style="font-size:0.85rem; color: var(--text-mid); padding: 14px 16px;">
        ✓ Assessment based on WHO guidelines and African disease patterns.
        Always seek professional medical care when available.
      </div>

      <div style="display:flex; gap:12px; flex-wrap:wrap; margin-top: 16px;">
        <button class="btn btn--secondary btn--inline" id="btn-restart">↩ New Assessment</button>
      </div>
      ${history.length > 1 ? backBtnHTML() : ''}
    `;

    document.getElementById('btn-restart')?.addEventListener('click', restart);
    bindBackBtn();
  }

  // ── Back button ───────────────────────────────────────────
  function backBtnHTML() {
    return `<div class="triage-nav mt-md">
      <button class="triage-nav__back" id="btn-back-triage">← Back</button>
    </div>`;
  }
  function bindBackBtn() {
    document.getElementById('btn-back-triage')?.addEventListener('click', goBack);
  }
  function goBack() {
    if (history.length <= 1) return;
    history.pop();
    const prev = history.pop();
    renderNode(prev);
  }

  // ── Progress bar ──────────────────────────────────────────
  function updateProgress() {
    const fill  = document.getElementById('triage-progress-fill');
    const label = document.getElementById('triage-progress-label');
    const pct   = Math.min((history.length / 5) * 100, 100);
    if (fill)  fill.style.width = `${pct}%`;
    if (label) label.textContent = `Step ${history.length}`;
  }

  // ── Restart ───────────────────────────────────────────────
  function restart() {
    history = [];
    updateProgress();
    renderNode('start');
  }

  // ── Init ─────────────────────────────────────────────────
  function init() {
    if (!container) return;
    // Triage uses inline tree — no JSON needed
    // (but hide any loading indicator)
    ProxiApp.hideLoading(loadingEl);
    renderNode('start');
  }

  document.addEventListener('DOMContentLoaded', init);
  return { restart };
})();

window.ProxiTriage = ProxiTriage;
