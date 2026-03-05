/* ═══════════════════════════════════════════════════════════════
   DEAD INTERNET RITUAL - MOBILE APPLICATION
   Main app logic for phone interface with Firebase sync
   ═══════════════════════════════════════════════════════════════ */

// ━━━ APP STATE ━━━
const AppState = {
  GATHERING: 'gathering',
  SACRIFICE: 'sacrifice',
  SUMMONING: 'summoning',
  LISTENING: 'listening',   // Ghost listens for questions
  REVELATION: 'revelation', // Scratch-off reveal
  WAITING: 'waiting',       // Wait during question phase
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

    // Initialize auto-advance manager
    this.autoAdvance = new AutoAdvanceManager(this.session);
    this.autoAdvance.setApp(this);

    // Setup event listeners
    this.setupEventListeners();

    // Setup Firebase listeners
    this.setupFirebaseListeners();

    // Setup audio ended hooks for auto-advance
    this.setupAudioListeners();
    
    // Hide all states first, show entry overlay
    document.getElementById('gathering-state').classList.add('hidden');
    document.getElementById('sacrifice-state').classList.add('hidden');
    document.getElementById('summoning-state').classList.add('hidden');
    document.getElementById('manifested-state').classList.add('hidden');
    document.getElementById('revelation-state').classList.add('hidden');
    document.getElementById('dismissed-state').classList.add('hidden');
    
    // Start background digital rain immediately so it's visible behind overlay
    // Force a resize calculation before starting to avoid mobile layout glitches
    setTimeout(() => {
      if (this.matrixRain && typeof this.matrixRain.resize === 'function') {
        this.matrixRain.resize();
      }
      this.matrixRain.start();
    }, 100);
    
    // Wait for user to explicitly join
    const joinBtn = document.getElementById('btn-begin-connection');
    if (joinBtn) {
      joinBtn.addEventListener('click', () => {
        document.getElementById('entry-overlay').classList.add('hidden');

        // 1. Unlock Web Audio API (for rumbling/beeps)
        this.unlockAudio();

        // 2. Activate auto-advance NOW — inside user gesture, before any async work
        this.autoAdvance.activate();

        // 3. Silent-unlock all HTML5 <audio> tags during this click event.
        //    Collect promises so we can wait for ALL .then(pause/reset) callbacks
        //    to complete before calling handleStateSync — prevents race where
        //    a pause callback kills audio that playAudioForPart() just started.
        const allAudios = document.querySelectorAll('audio');
        const playPromises = [];
        allAudios.forEach(audio => {
          audio.volume = 0;
          const p = audio.play();
          if (p !== undefined) {
            playPromises.push(p.catch(() => {}));
          }
        });

        Promise.allSettled(playPromises).then(() => {
          // All silent unlock .then()s have now fired — safe to play real audio
          allAudios.forEach(audio => { audio.pause(); audio.currentTime = 0; });
          this.session.sessionRef.child('state').once('value').then(snapshot => {
            const state = snapshot.val();
            if (state) {
              this.handleStateSync(state);
            } else {
              this.setState(AppState.GATHERING);
            }
          });
        });
      });
    }
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
  }
  
  handleStateSync(firebaseState) {
    // Feed into auto-advance manager first
    this.autoAdvance.onStateChange(firebaseState);

    // Map Firebase states to app states
    const stateMap = {
      'idle': AppState.GATHERING,
      'part1': AppState.GATHERING,
      'part2': AppState.SACRIFICE,
      'part3': AppState.SUMMONING,
      'part4': AppState.LISTENING,
      'part5': AppState.REVELATION,
      'gathering': AppState.GATHERING,
      'sacrifice': AppState.SACRIFICE,
      'summoning': AppState.SUMMONING,
      'monologue': AppState.SUMMONING,
      'listening': AppState.LISTENING,
      'revelation': AppState.REVELATION,
      'dismissal': AppState.DISMISSED,
      'dismissed': AppState.DISMISSED
    };
    
    const newState = stateMap[firebaseState] || AppState.GATHERING;
    
    // Sync audio based on Firebase state
    if (firebaseState.startsWith('part')) {
      this.playAudioForPart(firebaseState);
    }
    
    // Only update if different
    if (this.currentState !== newState) {
      this.setState(newState);
    }
  }
  
  playAudioForPart(partStr) {
    // Determine target audio element based on "partX" string
    const targetAudioId = `audio-${partStr}`;
    const targetAudio = document.getElementById(targetAudioId);
    
    // Brutally stop ALL audio elements on the page first
    const allAudios = document.querySelectorAll('audio');
    allAudios.forEach(audio => {
      if (audio.fadeInterval) clearInterval(audio.fadeInterval);
      audio.pause();
      audio.currentTime = 0;
      audio.volume = 0;
      // Remove any leftover src so browsers don't try to buffer/play them invisibly
      audio.removeAttribute('autoplay');
    });
    
    // If the target audio exists, set it up and play it exclusively
    if (targetAudio) {
      console.log(`🔊 Playing audio for: ${partStr}`);
      targetAudio.volume = 1.0;
      targetAudio.currentTime = 0;
      
      // Play immediately, synchronous with the state update
      const playPromise = targetAudio.play();
      if (playPromise !== undefined) {
        playPromise.catch(error => {
          console.warn(`Audio play prevented for ${partStr}:`, error);
        });
      }
    } else {
      console.warn(`⚠️ Target audio element not found: ${targetAudioId}`);
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

    // Sacrifice submit — attached once here, delegates to current canvas instance
    const submitBtn = document.getElementById('submit-sacrifice');
    if (submitBtn) {
      submitBtn.addEventListener('click', async () => {
        if (!this.drawingCanvas || submitBtn.disabled) return;
        submitBtn.disabled = true;
        submitBtn.textContent = 'Throwing...';

        const canvas = document.getElementById('drawing-canvas');
        if (canvas) {
          const imageData = canvas.toDataURL('image/png');
          await this.session.submitSacrificeImage(imageData);
        }

        this.drawingCanvas.startFireAnimation();
        await this.session.setReady();
        submitBtn.textContent = 'Awaiting others...';
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
  
  setState(newState) {
    console.log('State transition:', this.currentState, '→', newState);
    
    this.currentState = newState;
    
    // Hide all state containers
    document.getElementById('gathering-state').classList.add('hidden');
    document.getElementById('sacrifice-state').classList.add('hidden');
    document.getElementById('summoning-state').classList.add('hidden');
    document.getElementById('manifested-state').classList.add('hidden');
    document.getElementById('revelation-state').classList.add('hidden');
    document.getElementById('dismissed-state').classList.add('hidden');

    // Show current state container
    switch (newState) {
      case AppState.GATHERING:
        document.getElementById('gathering-state').classList.remove('hidden');
        if (!this.matrixRain.isActive) this.matrixRain.start();
        break;

      case AppState.SACRIFICE:
        document.getElementById('sacrifice-state').classList.remove('hidden');
        if (!this.matrixRain.isActive) this.matrixRain.start();
        this.initDrawingCanvas();
        break;

      case AppState.SUMMONING:
        document.getElementById('summoning-state').classList.remove('hidden');
        this.matrixRain.stop();
        this.startSummoningRitual();
        break;

      case AppState.LISTENING:
      case AppState.WAITING:
        document.getElementById('manifested-state').classList.remove('hidden');
        this.updateWaitingMessage(newState);
        break;

      case AppState.REVELATION:
        // Reset scratch-off so it redraws cleanly on each loop
        this.scratchOff = null;
        document.getElementById('revelation-state').classList.remove('hidden');
        this.matrixRain.stop();
        this.vibrate([100, 50, 100]);
        this.initScratchOff();
        break;

      case AppState.DISMISSED:
        document.getElementById('dismissed-state').classList.remove('hidden');
        break;
    }
  }
  
  initDrawingCanvas() {
    // drawingCanvas is reset to null before this call on each loop (see setState SACRIFICE case)
    this.drawingCanvas = new DrawingCanvas('drawing-canvas');

    // Reset button state for this loop
    const submitBtn = document.getElementById('submit-sacrifice');
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Throw it into the fire';
    }
  }
  
  initScratchOff() {
    if (!this.scratchOff) {
      this.scratchOff = new ScratchOffCanvas('scratch-canvas');
    }
  }

  // Called by AutoAdvanceManager when Part 1 audio ends — shows drawing canvas locally
  // without changing global Firebase state (everyone stays on part1 globally)
  showDrawingCanvas() {
    if (this.currentState === AppState.SACRIFICE) return; // Already showing
    this.setState(AppState.SACRIFICE);
  }

  // Hook audio.ended events for all parts so AutoAdvanceManager can drive progression
  setupAudioListeners() {
    const parts = ['part1', 'part2', 'part3', 'part4', 'part5'];
    parts.forEach(part => {
      const audio = document.getElementById(`audio-${part}`);
      if (audio) {
        audio.addEventListener('ended', () => {
          if (part === 'part1') {
            this.autoAdvance.onPart1AudioEnded();
          } else {
            this.autoAdvance.onAudioEnded(part);
          }
        });
      }
    });
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
    
    this.addQuestionToFeed(question);
    VisualEffects.GlitchEffects.flashScreen('#00ff88', 100);
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

// ━━━ DRAWING CANVAS CLASS ━━━
class DrawingCanvas {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    this.ctx = this.canvas.getContext('2d');
    
    this.isDrawing = false;
    this.isBurning = false;
    this.lastX = 0;
    this.lastY = 0;
    
    this.particles = [];
    this.fireHeight = 0; // The height level of the fire rising from the bottom
    this.maxFireHeight = 0;
    
    this.init();
  }
  
  init() {
    this.resizeCanvas();
    window.addEventListener('resize', () => this.resizeCanvas());
    
    this.applyCanvasStyles();
    this.setupEventListeners();
  }
  
  applyCanvasStyles() {
    this.ctx.strokeStyle = '#00ff88'; // Matrix neon green
    this.ctx.lineWidth = 4;
    this.ctx.lineCap = 'round';
    this.ctx.lineJoin = 'round';
    this.ctx.shadowBlur = 10;
    this.ctx.shadowColor = '#00ff88';
  }
  
  resizeCanvas() {
    const rect = this.canvas.parentElement.getBoundingClientRect();
    this.canvas.width = rect.width;
    this.canvas.height = rect.height;
    this.maxFireHeight = rect.height;
    
    this.applyCanvasStyles();
  }
  
  setupEventListeners() {
    // Mouse events
    this.canvas.addEventListener('mousedown', (e) => this.startDrawing(e));
    this.canvas.addEventListener('mousemove', (e) => this.draw(e));
    this.canvas.addEventListener('mouseup', () => this.stopDrawing());
    this.canvas.addEventListener('mouseout', () => this.stopDrawing());
    
    // Touch events
    this.canvas.addEventListener('touchstart', (e) => {
      e.preventDefault(); // Prevent scrolling
      const touch = e.touches[0];
      const mouseEvent = new MouseEvent('mousedown', {
        clientX: touch.clientX,
        clientY: touch.clientY
      });
      this.startDrawing(mouseEvent);
    });
    
    this.canvas.addEventListener('touchmove', (e) => {
      e.preventDefault(); // Prevent scrolling
      const touch = e.touches[0];
      const mouseEvent = new MouseEvent('mousemove', {
        clientX: touch.clientX,
        clientY: touch.clientY
      });
      this.draw(mouseEvent);
    });
    
    this.canvas.addEventListener('touchend', (e) => {
      e.preventDefault();
      this.stopDrawing();
    });
  }
  
  startDrawing(e) {
    if (this.isBurning) return; // Prevent drawing if fire started
    this.isDrawing = true;
    const rect = this.canvas.getBoundingClientRect();
    this.lastX = e.clientX - rect.left;
    this.lastY = e.clientY - rect.top;
  }
  
  draw(e) {
    if (!this.isDrawing || this.isBurning) return;
    
    const rect = this.canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    this.ctx.beginPath();
    this.ctx.moveTo(this.lastX, this.lastY);
    this.ctx.lineTo(x, y);
    this.ctx.stroke();
    
    this.lastX = x;
    this.lastY = y;
  }
  
  stopDrawing() {
    this.isDrawing = false;
  }
  
  startFireAnimation() {
    this.isBurning = true;
    
    // Setup Reverse Digital Rain
    this.charset = 'abcdefghijklmnopqrstuvwxyz0123456789$+-*/=%""\'#&_(),.;:?!\\|{}<>[]^~ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
    this.fontSize = 16;
    this.columns = this.canvas.width / this.fontSize;
    this.drops = [];
    this.glowIntensity = [];
    
    // Initialize drops at the very bottom, slightly staggered
    for (let x = 0; x < this.columns; x++) {
      this.drops[x] = this.canvas.height + Math.random() * 100;
      this.glowIntensity[x] = Math.random();
    }
    
    this.animateReverseRain();
  }
  
  animateReverseRain() {
    if (!this.isBurning) return;
    
    // Draw translucent dark background to gradually hide the drawing and create trails
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    this.ctx.font = this.fontSize + 'px monospace';
    
    // Draw the characters
    for (let i = 0; i < this.drops.length; i++) {
      // Select a random character
      const text = this.charset[Math.floor(Math.random() * this.charset.length)];
      
      // Flicker the glow intensity
      this.glowIntensity[i] += (Math.random() - 0.5) * 0.2;
      if (this.glowIntensity[i] < 0.2) this.glowIntensity[i] = 0.2;
      if (this.glowIntensity[i] > 1) this.glowIntensity[i] = 1;
      
      // Green matrix-fire color
      this.ctx.fillStyle = `rgba(0, 255, 136, ${this.glowIntensity[i]})`;
      
      // Optional: Add some white/brighter green at the "head" of the drop
      if (Math.random() > 0.9) {
        this.ctx.fillStyle = '#ffffff';
      }
      
      // Remove heavy shadowBlur during rendering text to keep it performant
      this.ctx.shadowBlur = 0; 
      
      // Draw the character
      // x coordinate is column * font size
      // y coordinate is the current drop height
      this.ctx.fillText(text, i * this.fontSize, this.drops[i]);
      
      // Move drop UPwards
      // Randomize speed slightly for "flame" effect
      this.drops[i] -= this.fontSize * (0.5 + Math.random() * 0.5);
      
      // If drop reaches top, occasionally reset it to the bottom to keep the fire going
      if (this.drops[i] < 0 && Math.random() > 0.95) {
        this.drops[i] = this.canvas.height;
      }
    }
    
    requestAnimationFrame(() => this.animateReverseRain());
  }
}

// ━━━ INITIALIZE APP ━━━
window.addEventListener('DOMContentLoaded', () => {
  window.app = new MobileApp();
});
