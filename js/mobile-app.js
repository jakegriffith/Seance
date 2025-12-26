/* ═══════════════════════════════════════════════════════════════
   DEAD INTERNET RITUAL - MOBILE APPLICATION
   Main app logic for phone interface with Firebase sync
   ═══════════════════════════════════════════════════════════════ */

// ━━━ APP STATE ━━━
const AppState = {
  GATHERING: 'gathering',
  SUMMONING: 'summoning',
  LISTENING: 'listening',      // Ghost listens for questions
  REVELATION: 'revelation',    // Scratch-off reveal
  WAITING: 'waiting',          // Wait during paywall timer
  MANIFESTED: 'manifested',
  SPEAKING: 'speaking',
  FAILED: 'failed',
  DISMISSED: 'dismissed'
};

class MobileApp {
  constructor() {
    this.currentState = AppState.GATHERING;
    
    // Firebase session
    this.session = null;
    
    // Visual effects
    this.canvas = document.getElementById('effects-canvas');
    this.matrixRain = new VisualEffects.MatrixRain(this.canvas);
    this.ritualAnimation = new VisualEffects.RitualAnimation(
      document.getElementById('summoning-visual')
    );
    
    // Audio setup
    this.audioContext = null;
    this.audioUnlocked = false;
    
    this.init();
  }
  
  async init() {
    console.log('🌑 Dead Internet Ritual - Mobile Interface');
    
    // Initialize Firebase session
    this.session = new RitualSession();
    await this.session.initSession();
    
    console.log('User ID:', this.session.userId);
    console.log('Session ID:', this.session.sessionId);
    
    // Setup event listeners
    this.setupEventListeners();
    
    // Setup Firebase listeners
    this.setupFirebaseListeners();
    
    // Start in gathering state
    this.setState(AppState.GATHERING);
    
    // Mark user as ready immediately (no orientation permission needed)
    await this.session.setReady();
  }
  
  setupFirebaseListeners() {
    // Listen to participant count changes
    this.session.onParticipantCountChange((count) => {
      this.updateParticipantCount(count);
    });
    
    // Listen to ritual state changes
    this.session.onStateChange((state) => {
      console.log('🔥 Firebase state update:', state);
      this.handleStateSync(state);
    });
    
    // Listen to questions and timer
    this.session.onQuestionsChange((questions) => {
      this.updateQuestionStatus(questions);
    });
  }
  
  handleStateSync(firebaseState) {
    // Map Firebase states to app states
    const stateMap = {
      'gathering': AppState.GATHERING,
      'summoning': AppState.SUMMONING,
      'monologue': AppState.SUMMONING,  // Keep showing ritual animation during monologue
      'listening': AppState.LISTENING,
      'revelation': AppState.REVELATION,  // Scratch-off reveal
      'manifested': AppState.MANIFESTED,
      'speaking': AppState.SPEAKING,
      'failed': AppState.FAILED,
      'dismissal': AppState.DISMISSED,
      'dismissed': AppState.DISMISSED
    };
    
    const newState = stateMap[firebaseState] || AppState.GATHERING;
    
    // Only update if different
    if (this.currentState !== newState) {
      this.setState(newState);
    }
  }
  
  setupEventListeners() {
    // Question form
    const questionForm = document.getElementById('question-form');
    if (questionForm) {
      questionForm.addEventListener('submit', (e) => {
        e.preventDefault();
        this.handleQuestionSubmit();
      });
    }
  }
  
  
  vibrate(duration) {
    if (navigator.vibrate) {
      navigator.vibrate(duration);
    }
  }
  
  unlockAudio() {
    if (this.audioUnlocked) return;
    
    try {
      // Create AudioContext (will be unlocked by user gesture)
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
      
      // Play silent sound to unlock
      const oscillator = this.audioContext.createOscillator();
      const gain = this.audioContext.createGain();
      gain.gain.value = 0; // Silent
      oscillator.connect(gain);
      gain.connect(this.audioContext.destination);
      oscillator.start();
      oscillator.stop(this.audioContext.currentTime + 0.001);
      
      this.audioUnlocked = true;
      console.log('✓ Audio unlocked');
    } catch (error) {
      console.warn('Audio unlock failed:', error);
    }
  }
  
  playRumbleNotification() {
    if (!this.audioContext) {
      console.warn('⚠️ Audio not unlocked yet');
      return;
    }
    
    try {
      // Resume context if suspended (mobile requirement)
      if (this.audioContext.state === 'suspended') {
        this.audioContext.resume();
      }
      
      const now = this.audioContext.currentTime;
      const duration = 2; // 2 seconds for more noticeable effect
      
      // Create THREE oscillators for a richer, louder rumble
      // Low bass (80Hz)
      const bass = this.audioContext.createOscillator();
      bass.frequency.value = 80;
      bass.type = 'sawtooth';
      
      // Mid rumble (120Hz) 
      const mid = this.audioContext.createOscillator();
      mid.frequency.value = 120;
      mid.type = 'square'; // Harsher tone
      
      // High warning tone (200Hz) - makes it more audible on small speakers
      const high = this.audioContext.createOscillator();
      high.frequency.value = 200;
      high.type = 'triangle';
      
      // Master gain - MUCH LOUDER
      const masterGain = this.audioContext.createGain();
      masterGain.gain.setValueAtTime(0, now);
      masterGain.gain.linearRampToValueAtTime(0.8, now + 0.05); // Very loud, fast attack
      masterGain.gain.linearRampToValueAtTime(0.6, now + duration - 0.2); // Sustain
      masterGain.gain.exponentialRampToValueAtTime(0.01, now + duration); // Fade out
      
      // Connect all oscillators to master gain
      bass.connect(masterGain);
      mid.connect(masterGain);
      high.connect(masterGain);
      masterGain.connect(this.audioContext.destination);
      
      // Start all and stop after duration
      bass.start(now);
      mid.start(now);
      high.start(now);
      bass.stop(now + duration);
      mid.stop(now + duration);
      high.stop(now + duration);
      
      console.log('🔊 Playing LOUD rumble notification (2s)');
    } catch (error) {
      console.warn('Rumble playback failed:', error);
    }
  }
  
  setState(newState) {
    console.log('State transition:', this.currentState, '→', newState);
    
    this.currentState = newState;
    
    // Hide all state containers
    document.getElementById('gathering-state').classList.add('hidden');
    document.getElementById('summoning-state').classList.add('hidden');
    document.getElementById('manifested-state').classList.add('hidden');
    document.getElementById('speaking-state').classList.add('hidden');
    document.getElementById('failed-state').classList.add('hidden');
    document.getElementById('revelation-state').classList.add('hidden');
    document.getElementById('dismissed-state').classList.add('hidden');
    
    // Show current state container
    switch (newState) {
      case AppState.GATHERING:
        document.getElementById('gathering-state').classList.remove('hidden');
        this.matrixRain.start();
        
        // Unlock audio on first touch
        document.addEventListener('touchstart', () => this.unlockAudio(), { once: true });
        document.addEventListener('click', () => this.unlockAudio(), { once: true });
        break;
        
      case AppState.SUMMONING:
        document.getElementById('summoning-state').classList.remove('hidden');
        this.matrixRain.stop();
        
        // Audio alert at start of summoning
        this.playRumbleNotification();
        
        this.startSummoningRitual();
        break;
        
      case AppState.LISTENING:
      case AppState.WAITING:
        // Use manifested state for these
        document.getElementById('manifested-state').classList.remove('hidden');
        this.updateWaitingMessage(newState);
        break;
        
      case AppState.MANIFESTED:
        document.getElementById('manifested-state').classList.remove('hidden');
        this.matrixRain.stop();
        break;
        
      case AppState.SPEAKING:
        document.getElementById('speaking-state').classList.remove('hidden');
        break;
        
      case AppState.FAILED:
        document.getElementById('failed-state').classList.remove('hidden');
        this.matrixRain.stop();
        this.handleFailedRitual();
        break;
        
      case AppState.REVELATION:
        document.getElementById('revelation-state').classList.remove('hidden');
        this.matrixRain.stop();
        
        // Vibration only for revelation
        this.vibrate([100, 50, 100]); // Android only
        
        this.initScratchOff();
        break;
        
      case AppState.DISMISSED:
        document.getElementById('dismissed-state').classList.remove('hidden');
        this.handleDismissed();
        break;
    }
  }
  
  initScratchOff() {
    // Initialize scratch-off canvas only once
    if (!this.scratchOff) {
      this.scratchOff = new ScratchOffCanvas('scratch-canvas');
    }
  }
  
  updateWaitingMessage(state) {
    const container = document.querySelector('#manifested-state .manifestation-message');
    if (!container) return;
    
    let message = '';
    if (state === AppState.LISTENING) {
      message = '<h2>Submit Your Question</h2><p>The ghost awaits your question...</p>';
    } else if (state === AppState.WAITING) {
      message = '<h2>The Ghost Considers...</h2><p>Watch the vessel...</p>';
    }
    
    container.innerHTML = message;
  }
  
  updateParticipantCount(count) {
    const countElement = document.querySelector('.participant-count');
    if (countElement) {
      countElement.textContent = count;
    }
  }
  
  
  startSummoningRitual() {
    console.log('🌀 Ritual animation starting');
    
    // VIOLENT VIBRATION for first 5 seconds
    this.startViolentVibration(5000);
    
    this.ritualAnimation.start();
    
    setTimeout(() => {
      this.ritualAnimation.stop();
    }, 10000);
  }
  
  startViolentVibration(duration) {
    if (!navigator.vibrate) {
      console.log('⚠️ Vibration API not supported');
      return;
    }
    
    console.log(`📳 Starting VIOLENT vibration for ${duration}ms`);
    
    // Create intense vibration pattern
    // 200ms vibrate, 50ms pause = 250ms per cycle
    // This creates a violent, continuous shaking effect
    const pattern = [];
    const cycleTime = 250; // Total cycle duration
    const vibrateTime = 200; // Maximum safe vibration duration
    const pauseTime = 50;    // Short pause for intensity
    const cycles = Math.floor(duration / cycleTime);
    
    for (let i = 0; i < cycles; i++) {
      pattern.push(vibrateTime); // Vibrate intensely
      pattern.push(pauseTime);   // Brief pause
    }
    
    // Add any remaining time as final vibration
    const remainder = duration % cycleTime;
    if (remainder > 0) {
      pattern.push(Math.min(remainder, vibrateTime));
    }
    
    // Trigger the violent pattern
    navigator.vibrate(pattern);
    
    console.log(`📳 Vibration pattern: ${cycles} cycles over ${duration}ms`);
  }
  
  handleFailedRitual() {
    console.log('💀 Ritual failed');
    
    VisualEffects.GlitchEffects.invertColors(200);
    setTimeout(() => {
      VisualEffects.GlitchEffects.staticBurst(this.canvas, 300);
    }, 500);
  }
  
  handleDismissed() {
    // Operator dashboard now controls state transitions
    // Mobile interface is purely reactive
  }
  
  async handleQuestionSubmit() {
    const input = document.getElementById('question-input');
    const question = input.value.trim();
    
    if (!question) return;
    
    console.log('❓ Question submitted:', question);
    
    // Submit to Firebase (starts timer automatically)
    await this.session.submitQuestion(question);
    
    // Disable form after submission
    input.value = '';
    input.disabled = true;
    const submitButton = document.getElementById('submit-question');
    if (submitButton) {
      submitButton.disabled = true;
      submitButton.textContent = 'Question Submitted ✓';
    }
    
    VisualEffects.GlitchEffects.flashScreen('#00ff88', 100);
  }
  
  async updateQuestionStatus(questions) {
    if (this.currentState !== AppState.MANIFESTED) return;
    
    const questionCount = Object.keys(questions).length;
    
    // Update message with count
    const container = document.querySelector('#manifested-state .manifestation-message');
    if (container) {
      container.innerHTML = `
        <h2 class="glitch" data-text="The Ghost Manifests">The Ghost Manifests</h2>
        <p>Questions submitted: ${questionCount}</p>
      `;
    }
    
    // Check timer from Firebase
    const snapshot = await this.session.sessionRef.child('questionTimer').once('value');
    const timerStart = snapshot.val();
    
    if (timerStart) {
      const elapsed = Date.now() - timerStart;
      const remaining = Math.max(0, 30000 - elapsed); // 30 seconds
      
      if (remaining > 0) {
        const seconds = Math.ceil(remaining / 1000);
        container.innerHTML = `
          <h2 class="glitch" data-text="The Ghost Manifests">The Ghost Manifests</h2>
          <p>Questions: ${questionCount}</p>
          <p class="text-dim">Selection in ${seconds}s...</p>
        `;
        
        // Schedule check or let it happen naturally
      } else if (questionCount > 0) {
        // Timer expired - select random question
        await this.session.selectRandomQuestion();
      }
    }
  }
  
  addQuestionToFeed(question) {
    const feed = document.getElementById('question-feed');
    if (!feed) return;
    
    const questionItem = document.createElement('div');
    questionItem.className = 'question-item fade-in';
    questionItem.innerHTML = `
      <div class="question-text">"${question}"</div>
      <div class="question-meta">Sent just now</div>
    `;
    
    feed.appendChild(questionItem);
    feed.scrollTop = feed.scrollHeight;
    
    while (feed.children.length > 10) {
      feed.removeChild(feed.firstChild);
    }
  }
  
}

// ━━━ SCRATCH-OFF CANVAS CLASS ━━━
class ScratchOffCanvas {
  constructor(canvasId, options = {}) {
    this.canvas = document.getElementById(canvasId);
    this.ctx = this.canvas.getContext('2d');
    
    // Options
    this.brushSize = options.brushSize || 50;
    this.revealThreshold = options.revealThreshold || 60;
    this.dirtOpacity = options.dirtOpacity || 0.95;
    
    // State
    this.isScratching = false;
    this.revealPercentage = 0;
    this.hasRevealed = false;
    
    this.init();
  }
  
  init() {
    // Set canvas size
    this.resizeCanvas();
    window.addEventListener('resize', () => this.resizeCanvas());
    
    // Draw initial dirt layer
    this.drawDirtLayer();
    
    // Setup event listeners
    this.setupEventListeners();
  }
  
  resizeCanvas() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
  }
  
  drawDirtLayer() {
    const ctx = this.ctx;
    const width = this.canvas.width;
    const height = this.canvas.height;
    
    // Create dirt texture with noise
    const imageData = ctx.createImageData(width, height);
    const data = imageData.data;
    
    for (let i = 0; i < data.length; i += 4) {
      // Dark brown/black with random noise
      const noise = Math.random() * 40;
      const baseColor = 20 + noise;
      
      data[i] = baseColor;     // Red
      data[i + 1] = baseColor * 0.7; // Green (brownish tint)
      data[i + 2] = baseColor * 0.5; // Blue
      data[i + 3] = 255 * this.dirtOpacity; // Alpha
    }
    
    ctx.putImageData(imageData, 0, 0);
    
    // Add some texture overlay
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    for (let i = 0; i < 200; i++) {
      const x = Math.random() * width;
      const y = Math.random() * height;
      const size = Math.random() * 3;
      ctx.fillRect(x, y, size, size);
    }
  }
  
  setupEventListeners() {
    // Mouse events
    this.canvas.addEventListener('mousedown', (e) => this.startScratching(e));
    this.canvas.addEventListener('mousemove', (e) => this.scratch(e));
    this.canvas.addEventListener('mouseup', () => this.stopScratching());
    this.canvas.addEventListener('mouseleave', () => this.stopScratching());
    
    // Touch events
    this.canvas.addEventListener('touchstart', (e) => {
      e.preventDefault();
      this.startScratching(e.touches[0]);
    });
    this.canvas.addEventListener('touchmove', (e) => {
      e.preventDefault();
      this.scratch(e.touches[0]);
    });
    this.canvas.addEventListener('touchend', () => this.stopScratching());
  }
  
  startScratching(e) {
    this.isScratching = true;
    this.scratch(e);
  }
  
  stopScratching() {
    this.isScratching = false;
  }
  
  scratch(e) {
    if (!this.isScratching) return;
    
    const rect = this.canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Erase circular area
    this.ctx.globalCompositeOperation = 'destination-out';
    this.ctx.beginPath();
    this.ctx.arc(x, y, this.brushSize / 2, 0, Math.PI * 2);
    this.ctx.fill();
    this.ctx.globalCompositeOperation = 'source-over';
    
    // Calculate reveal percentage
    this.calculateRevealPercentage();
  }
  
  calculateRevealPercentage() {
    // Check if threshold reached for auto-fade
    const imageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
    const data = imageData.data;
    let transparent = 0;
    
    // Sample every 10th pixel for performance
    for (let i = 3; i < data.length; i += 40) {
      if (data[i] < 128) { // Alpha channel
        transparent++;
      }
    }
    
    const sampledTotal = data.length / 40;
    this.revealPercentage = Math.round((transparent / sampledTotal) * 100);
    
    // Auto-fade canvas when threshold reached
    if (this.revealPercentage >= this.revealThreshold && !this.hasRevealed) {
      this.hasRevealed = true;
      this.canvas.classList.add('fading');
      const instruction = document.getElementById('scratch-instruction');
      if (instruction) instruction.style.display = 'none';
    }
  }
}

// ━━━ INITIALIZE APP ━━━
window.addEventListener('DOMContentLoaded', () => {
  window.app = new MobileApp();
});
