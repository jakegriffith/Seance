/* ═══════════════════════════════════════════════════════════════
   DEAD INTERNET RITUAL - LAPTOP APPLICATION
   Ghost vessel logic with Firebase sync
   Fire and Smoke animations
   ═══════════════════════════════════════════════════════════════ */

// ━━━ FIRE ANIMATION CLASS ━━━
class FireAnimation {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.particles = [];
    this.embers = [];
    this.time = 0;
    this.animationId = null;
    this.isRunning = false;
    
    this.resize();
    window.addEventListener('resize', () => this.resize());
  }
  
  resize() {
    this.width = this.canvas.width = window.innerWidth;
    this.height = this.canvas.height = window.innerHeight;
  }
  
  start() {
    if (this.isRunning) return;
    this.isRunning = true;
    this.canvas.style.display = 'block';
    this.animate();
  }
  
  stop() {
    this.isRunning = false;
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
    this.particles = [];
    this.embers = [];
  }
  
  createFireParticles() {
    const particlesPerFrame = 15;
    
    for (let i = 0; i < particlesPerFrame; i++) {
      const x = Math.random() * this.width;
      const y = this.height - Math.random() * 50;
      this.particles.push(new FireParticle(x, y));
    }
    
    if (Math.random() < 0.3) {
      const x = Math.random() * this.width;
      const y = this.height - Math.random() * 100;
      this.embers.push(new Ember(x, y));
    }
  }
  
  animate() {
    if (!this.isRunning) return;
    
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
    this.ctx.fillRect(0, 0, this.width, this.height);
    
    this.time++;
    this.createFireParticles();
    
    // Update and draw fire particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      this.particles[i].update();
      this.particles[i].draw(this.ctx, this.time);
      
      if (this.particles[i].isDead()) {
        this.particles.splice(i, 1);
      }
    }
    
    // Update and draw embers
    for (let i = this.embers.length - 1; i >= 0; i--) {
      this.embers[i].update();
      this.embers[i].draw(this.ctx);
      
      if (this.embers[i].isDead()) {
        this.embers.splice(i, 1);
      }
    }
    
    // Base glow
    const glowGradient = this.ctx.createLinearGradient(0, this.height, 0, this.height - 200);
    glowGradient.addColorStop(0, 'rgba(255, 100, 0, 0.3)');
    glowGradient.addColorStop(0.5, 'rgba(255, 50, 0, 0.1)');
    glowGradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
    
    this.ctx.fillStyle = glowGradient;
    this.ctx.fillRect(0, this.height - 200, this.width, 200);
    
    this.animationId = requestAnimationFrame(() => this.animate());
  }
}

class FireParticle {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.vx = (Math.random() - 0.5) * 3;
    this.vy = -(Math.random() * 5 + 3);
    this.life = 1.0;
    this.decay = Math.random() * 0.015 + 0.005;
    this.size = Math.random() * 40 + 20;
    this.flickerSpeed = Math.random() * 0.05 + 0.02;
    this.flickerOffset = Math.random() * Math.PI * 2;
  }
  
  update() {
    this.x += this.vx;
    this.y += this.vy;
    this.vy -= 0.1;
    this.vx *= 0.99;
    this.life -= this.decay;
    this.size *= 0.98;
  }
  
  draw(ctx, time) {
    if (this.life <= 0) return;
    
    ctx.save();
    ctx.globalAlpha = this.life;
    
    const flicker = Math.sin(time * this.flickerSpeed + this.flickerOffset) * 0.2 + 0.8;
    const currentSize = this.size * flicker;
    
    let color1, color2, color3;
    
    if (this.life > 0.7) {
      color1 = `rgba(255, 255, 200, ${this.life})`;
      color2 = `rgba(255, 200, 50, ${this.life * 0.8})`;
      color3 = `rgba(255, 100, 0, 0)`;
    } else if (this.life > 0.4) {
      color1 = `rgba(255, 200, 50, ${this.life})`;
      color2 = `rgba(255, 100, 0, ${this.life * 0.8})`;
      color3 = `rgba(200, 50, 0, 0)`;
    } else {
      color1 = `rgba(255, 80, 0, ${this.life})`;
      color2 = `rgba(200, 30, 0, ${this.life * 0.8})`;
      color3 = `rgba(100, 0, 0, 0)`;
    }
    
    const gradient = ctx.createRadialGradient(
      this.x, this.y, 0,
      this.x, this.y, currentSize
    );
    gradient.addColorStop(0, color1);
    gradient.addColorStop(0.5, color2);
    gradient.addColorStop(1, color3);
    
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(this.x, this.y, currentSize, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.restore();
  }
  
  isDead() {
    return this.life <= 0;
  }
}

class Ember {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.vx = (Math.random() - 0.5) * 2;
    this.vy = -(Math.random() * 8 + 4);
    this.life = 1.0;
    this.decay = Math.random() * 0.01 + 0.005;
    this.size = Math.random() * 4 + 2;
    this.spin = Math.random() * 0.1;
    this.angle = Math.random() * Math.PI * 2;
  }
  
  update() {
    this.x += this.vx;
    this.y += this.vy;
    this.vy += 0.1;
    this.vx *= 0.99;
    this.life -= this.decay;
    this.angle += this.spin;
  }
  
  draw(ctx) {
    if (this.life <= 0) return;
    
    ctx.save();
    ctx.globalAlpha = this.life * 0.8;
    ctx.translate(this.x, this.y);
    ctx.rotate(this.angle);
    
    const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, this.size);
    gradient.addColorStop(0, `rgba(255, 200, 100, ${this.life})`);
    gradient.addColorStop(0.5, `rgba(255, 100, 0, ${this.life * 0.6})`);
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
    
    ctx.fillStyle = gradient;
    ctx.fillRect(-this.size, -this.size, this.size * 2, this.size * 2);
    
    ctx.restore();
  }
  
  isDead() {
    return this.life <= 0;
  }
}

// ━━━ SMOKE ANIMATION CLASS ━━━
class SmokeAnimation {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.particles = [];
    this.time = 0;
    this.animationId = null;
    this.isRunning = false;
    
    this.resize();
    window.addEventListener('resize', () => this.resize());
  }
  
  resize() {
    this.width = this.canvas.width = window.innerWidth;
    this.height = this.canvas.height = window.innerHeight;
  }
  
  start() {
    if (this.isRunning) return;
    this.isRunning = true;
    this.canvas.style.display = 'block';
    this.animate();
  }
  
  stop() {
    this.isRunning = false;
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
    this.particles = [];
  }
  
  createSmoke() {
    const particlesPerFrame = 10;
    
    for (let i = 0; i < particlesPerFrame; i++) {
      const x = Math.random() * this.width;
      const y = this.height + 50;
      this.particles.push(new SmokeParticle(x, y));
    }
  }
  
  animate() {
    if (!this.isRunning) return;
    
    this.ctx.fillStyle = 'rgba(10, 10, 10, 0.04)';
    this.ctx.fillRect(0, 0, this.width, this.height);
    
    this.time++;
    this.createSmoke();
    
    for (let i = this.particles.length - 1; i >= 0; i--) {
      this.particles[i].update(this.time);
      this.particles[i].draw(this.ctx);
      
      if (this.particles[i].isDead()) {
        this.particles.splice(i, 1);
      }
    }
    
    this.animationId = requestAnimationFrame(() => this.animate());
  }
}

class SmokeParticle {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.vx = (Math.random() - 0.5) * 0.8;
    this.vy = -(Math.random() * 1.2 + 0.6);
    this.life = 1.0;
    this.decay = Math.random() * 0.0015 + 0.001;
    this.size = Math.random() * 80 + 60;
    this.maxSize = this.size * 3;
    this.growthRate = Math.random() * 0.4 + 0.2;
    this.opacity = Math.random() * 0.4 + 0.3;
    this.rotation = Math.random() * Math.PI * 2;
    this.rotationSpeed = (Math.random() - 0.5) * 0.008;
    
    const colorOptions = [
      { r: 200, g: 200, b: 210 },
      { r: 180, g: 190, b: 200 },
      { r: 190, g: 200, b: 195 },
      { r: 170, g: 180, b: 190 },
      { r: 210, g: 210, b: 220 },
    ];
    this.color = colorOptions[Math.floor(Math.random() * colorOptions.length)];
  }
  
  update(time) {
    this.x += this.vx;
    this.y += this.vy;
    
    this.vx += (Math.random() - 0.5) * 0.05;
    this.vy += (Math.random() - 0.5) * 0.03;
    
    this.vx *= 0.99;
    this.vy *= 0.99;
    
    if (this.size < this.maxSize) {
      this.size += this.growthRate;
    }
    
    this.life -= this.decay;
    this.rotation += this.rotationSpeed;
  }
  
  draw(ctx) {
    if (this.life <= 0) return;
    
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.rotation);
    ctx.globalAlpha = this.opacity * this.life * 0.8;
    
    const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, this.size);
    gradient.addColorStop(0, `rgba(${this.color.r}, ${this.color.g}, ${this.color.b}, 0.8)`);
    gradient.addColorStop(0.3, `rgba(${this.color.r}, ${this.color.g}, ${this.color.b}, 0.6)`);
    gradient.addColorStop(0.6, `rgba(${this.color.r}, ${this.color.g}, ${this.color.b}, 0.3)`);
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
    
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(0, 0, this.size, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.restore();
  }
  
  isDead() {
    return this.life <= 0 || this.y < -200;
  }
}

// ━━━ APP STATE ━━━
const LaptopState = {
  IDLE: 'idle',
  MANIFESTING: 'manifesting',
  MONOLOGUE: 'monologue',
  LISTENING: 'listening',
  DELIBERATING: 'deliberating',
  REVELATION: 'revelation',
  DISMISSING: 'dismissing'
};

class LaptopApp {
  constructor() {
    this.currentState = LaptopState.IDLE;
    this.participantCount = 0;
    this.winningQuestion = null;
    
    // Firebase session
    this.session = null;
    
    // Animation canvases
    this.fireCanvas = document.getElementById('fireCanvas');
    this.smokeCanvas = document.getElementById('smokeCanvas');
    
    // Animation instances
    this.fireAnimation = new FireAnimation(this.fireCanvas);
    this.smokeAnimation = new SmokeAnimation(this.smokeCanvas);
    
    this.init();
  }
  
  async init() {
    console.log('🔥 Dead Internet Ritual - Laptop Interface (Ghost Vessel)');
    
    // Initialize Firebase session
    this.session = new RitualSession();
    await this.session.initSession();
    
    console.log('Session ID:', this.session.sessionId);
    
    // Setup Firebase listeners
    this.setupFirebaseListeners();
    
    // Start in idle state with fire animation
    this.setState(LaptopState.IDLE);
    
    // Setup fullscreen
    this.setupFullscreen();
  }
  
  setupFirebaseListeners() {
    // Listen to state changes
    this.session.onStateChange((state) => {
      console.log('🔥 Laptop State Update:', state);
      this.handleStateSync(state);
    });

    // Listen for new sacrifice images
    this.session.onSacrificeAdded((sacrifice) => {
      if (sacrifice && sacrifice.imageData) {
        this.flashSacrificeImage(sacrifice.imageData);
      }
    });

    // Fade QR code when quiesce fires (5s no new joins)
    this.session.onQrVisibleChange((visible) => {
      const qrCode = document.getElementById('qr-code-overlay');
      if (qrCode && visible === false) {
        qrCode.classList.add('fading-out');
        setTimeout(() => qrCode.classList.add('hidden'), 1500);
      }
    });
  }
  
  flashSacrificeImage(imageData) {
    const container = document.getElementById('sacrifice-flashes');
    if (!container) return;
    
    const img = document.createElement('img');
    img.src = imageData;
    img.className = 'sacrifice-flash';
    
    // Randomize path slightly for effect
    const startX = (Math.random() - 0.5) * 40; // -20% to 20%
    const startY = (Math.random() - 0.5) * 40;
    const midX = startX + (Math.random() - 0.5) * 20;
    const midY = startY + (Math.random() - 0.5) * 20;
    const endX = midX + (Math.random() - 0.5) * 20;
    const endY = midY - 20 - Math.random() * 30; // Float upwards
    
    img.style.setProperty('--tx-start', `${startX}%`);
    img.style.setProperty('--ty-start', `${startY}%`);
    img.style.setProperty('--tx-mid', `${midX}%`);
    img.style.setProperty('--ty-mid', `${midY}%`);
    img.style.setProperty('--tx-end', `${endX}%`);
    img.style.setProperty('--ty-end', `${endY}%`);
    
    // Randomize animation duration slightly
    const duration = 0.6 + Math.random() * 0.5;
    img.style.animationDuration = `${duration}s`;
    
    container.appendChild(img);
    
    // Remove after animation completes
    setTimeout(() => {
      if (img.parentNode) {
        img.parentNode.removeChild(img);
      }
    }, duration * 1000);
  }
  
  handleStateSync(firebaseState) {
    // Save the raw firebase state for fine-grained sub-state logic (like QR code)
    this.rawFirebaseState = firebaseState;
    
    // Map Firebase states to laptop states
    const stateMap = {
      'idle': LaptopState.IDLE,
      'part1': LaptopState.IDLE,
      'part2': LaptopState.IDLE,
      'part3': LaptopState.MANIFESTING,
      'part4': LaptopState.LISTENING,
      'part5': LaptopState.REVELATION,
      'gathering': LaptopState.IDLE,
      'sacrifice': LaptopState.IDLE,
      'summoning': LaptopState.MANIFESTING,
      'monologue': LaptopState.MONOLOGUE,
      'listening': LaptopState.LISTENING,
      'revelation': LaptopState.REVELATION,
      'dismissal': LaptopState.DISMISSING
    };
    
    const newState = stateMap[firebaseState] || LaptopState.IDLE;
    
    // QR code visibility within the idle visual state
    if (newState === LaptopState.IDLE) {
      const qrCode = document.getElementById('qr-code-overlay');
      if (qrCode) {
        if (firebaseState === 'idle' || firebaseState === 'part1' || firebaseState === 'gathering') {
          // Reset any fade-out classes so QR is fully visible at start of each loop
          qrCode.classList.remove('hidden', 'fading-out');
        } else {
          qrCode.classList.add('hidden');
        }
      }
    }
    
    // Only update if different
    if (this.currentState !== newState) {
      this.setState(newState);
    }
  }
  
  setState(newState) {
    console.log('State transition:', this.currentState, '→', newState);
    this.currentState = newState;
    
    // Hide all state containers
    document.getElementById('idle-state').classList.add('hidden');
    document.getElementById('manifestation-state').classList.add('hidden');
    document.getElementById('monologue-state').classList.add('hidden');
    document.getElementById('listening-state').classList.add('hidden');
    document.getElementById('revelation-state').classList.add('hidden');
    document.getElementById('dismissal-state').classList.add('hidden');
    
    // Show current state container and trigger effects
    switch (newState) {
      case LaptopState.IDLE:
        document.getElementById('idle-state').classList.remove('hidden');
        this.showFire();
        break;
        
      case LaptopState.MANIFESTING:
        document.getElementById('manifestation-state').classList.remove('hidden');
        this.transitionToSmoke();
        break;
        
      case LaptopState.MONOLOGUE:
        document.getElementById('monologue-state').classList.remove('hidden');
        // Smoke continues, no text (audio track)
        break;
        
      case LaptopState.LISTENING:
        document.getElementById('listening-state').classList.remove('hidden');
        // Smoke continues, no text (audio track)
        break;
        
      case LaptopState.REVELATION:
        document.getElementById('revelation-state').classList.remove('hidden');
        // Smoke continues with text overlay
        break;
        
      case LaptopState.DISMISSING:
        document.getElementById('dismissal-state').classList.remove('hidden');
        // Smoke continues, no text (deferred)
        break;
    }
  }
  
  showFire() {
    console.log('🔥 Starting fire animation');
    this.smokeAnimation.stop();
    this.smokeCanvas.classList.remove('fade-in');
    this.fireCanvas.classList.remove('fade-out');
    this.fireAnimation.start();
  }
  
  transitionToSmoke() {
    console.log('💨 Transitioning from fire to smoke');
    
    // Start smoke animation
    this.smokeAnimation.start();
    
    // Fade out fire, fade in smoke
    this.fireCanvas.classList.add('fade-out');
    this.smokeCanvas.classList.add('fade-in');
    
    // Stop fire after transition completes
    setTimeout(() => {
      this.fireAnimation.stop();
    }, 500);
  }
  
  setupFullscreen() {
    const prompt = document.getElementById('fullscreen-prompt');
    
    // Hide prompt after 5 seconds
    setTimeout(() => {
      prompt.classList.add('fade-out');
      setTimeout(() => {
        prompt.classList.add('hidden');
      }, 1000);
    }, 5000);
    
    // Listen for fullscreen changes
    document.addEventListener('fullscreenchange', () => {
      if (document.fullscreenElement) {
        console.log('✓ Fullscreen enabled');
      }
    });
  }
}

// ━━━ INITIALIZE APP ━━━
window.addEventListener('DOMContentLoaded', () => {
  window.laptopApp = new LaptopApp();
});
