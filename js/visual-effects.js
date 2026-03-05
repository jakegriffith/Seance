/* ═══════════════════════════════════════════════════════════════
   DEAD INTERNET RITUAL - VISUAL EFFECTS LIBRARY
   Matrix rain, glitch effects, particle systems
   ═══════════════════════════════════════════════════════════════ */

// ━━━ MATRIX RAIN EFFECT ━━━
class MatrixRain {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.columns = [];
    this.fontSize = 14;
    this.chars = 'ｱｲｳｴｵｶｷｸｹｺｻｼｽｾｿﾀﾁﾂﾃﾄﾅﾆﾇﾈﾉﾊﾋﾌﾍﾎﾏﾐﾑﾒﾓﾔﾕﾖﾗﾘﾙﾚﾛﾜﾝABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789<>{}[]()!@#$%^&*';
    this.glitchChars = '404ERRORDEPRECATED<html></><script>NULL VOID';
    this.isActive = false;
    this.animationFrame = null;
    this.glitchMode = false;
    this.corruptionLevel = 0;
    
    this.resize();
    window.addEventListener('resize', () => this.resize());
  }
  
  resize() {
    this.canvas.width = this.canvas.clientWidth || window.innerWidth;
    this.canvas.height = this.canvas.clientHeight || window.innerHeight;

    const numColumns = Math.floor(this.canvas.width / this.fontSize);
    this.columns = Array(numColumns).fill(1);
  }
  
  start(glitchMode = false) {
    if (this.isActive) return;
    this.isActive = true;
    this.glitchMode = glitchMode;
    this.corruptionLevel = 0;
    this.draw();
  }
  
  stop() {
    this.isActive = false;
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
      this.animationFrame = null;
    }
    this.clear();
  }
  
  clear() {
    this.ctx.fillStyle = 'rgba(10, 10, 10, 1)';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
  }
  
  setCorruption(level) {
    // level: 0-1, higher = more corruption
    this.corruptionLevel = Math.max(0, Math.min(1, level));
  }
  
  draw() {
    if (!this.isActive) return;
    
    // Fade previous frame
    const fadeAmount = this.glitchMode ? 0.03 : 0.05;
    this.ctx.fillStyle = `rgba(10, 10, 10, ${fadeAmount})`;
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    // Set color based on mode
    if (this.glitchMode) {
      this.ctx.fillStyle = `rgba(0, 255, 136, ${0.8 - this.corruptionLevel * 0.3})`;
    } else {
      this.ctx.fillStyle = 'rgba(0, 255, 136, 0.8)';
    }
    this.ctx.font = `${this.fontSize}px monospace`;
    
    // Draw characters
    for (let i = 0; i < this.columns.length; i++) {
      // Choose character set based on mode
      const charSet = (this.glitchMode && Math.random() < this.corruptionLevel) 
        ? this.glitchChars 
        : this.chars;
      
      const char = charSet[Math.floor(Math.random() * charSet.length)];
      const x = i * this.fontSize;
      const y = this.columns[i] * this.fontSize;
      
      // Glitch effects during corruption
      if (this.glitchMode && Math.random() < this.corruptionLevel * 0.3) {
        // RGB split effect
        this.ctx.fillStyle = 'rgba(255, 0, 0, 0.5)';
        this.ctx.fillText(char, x - 2, y);
        this.ctx.fillStyle = 'rgba(0, 255, 255, 0.5)';
        this.ctx.fillText(char, x + 2, y);
      } else {
        this.ctx.fillText(char, x, y);
      }
      
      // Reset column randomly
      const resetChance = this.glitchMode ? 0.99 : 0.975;
      if (y > this.canvas.height && Math.random() > resetChance) {
        this.columns[i] = 0;
      }
      
      // Speed variation during glitch mode
      const speed = this.glitchMode 
        ? 1 + Math.random() * this.corruptionLevel * 2
        : 1;
      this.columns[i] += speed;
    }
    
    this.animationFrame = requestAnimationFrame(() => this.draw());
  }
}

// ━━━ GLITCH EFFECT UTILITIES ━━━
class GlitchEffects {
  static applyRGBSplit(element, duration = 200) {
    element.classList.add('rgb-split');
    setTimeout(() => {
      element.classList.remove('rgb-split');
    }, duration);
  }
  
  static applyGlitchText(element, duration = 500) {
    const originalText = element.textContent;
    element.setAttribute('data-text', originalText);
    element.classList.add('glitch');
    
    setTimeout(() => {
      element.classList.remove('glitch');
    }, duration);
  }
  
  static flashScreen(color = '#ffffff', duration = 100) {
    const flash = document.createElement('div');
    flash.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: ${color};
      z-index: 10000;
      pointer-events: none;
      opacity: 0.8;
    `;
    document.body.appendChild(flash);
    
    setTimeout(() => {
      flash.style.transition = 'opacity 0.1s';
      flash.style.opacity = '0';
      setTimeout(() => flash.remove(), 100);
    }, duration);
  }
  
  static invertColors(duration = 100) {
    document.body.style.filter = 'invert(1)';
    setTimeout(() => {
      document.body.style.filter = '';
    }, duration);
  }
  
  static scanLineDisplacement(element, duration = 300) {
    const originalTransform = element.style.transform;
    let startTime = Date.now();
    
    const animate = () => {
      const elapsed = Date.now() - startTime;
      if (elapsed < duration) {
        const offset = Math.random() * 10 - 5;
        element.style.transform = `translateX(${offset}px)`;
        requestAnimationFrame(animate);
      } else {
        element.style.transform = originalTransform;
      }
    };
    
    animate();
  }
  
  static staticBurst(canvas, duration = 200) {
    const ctx = canvas.getContext('2d');
    const imageData = ctx.createImageData(canvas.width, canvas.height);
    
    const startTime = Date.now();
    const animate = () => {
      const elapsed = Date.now() - startTime;
      if (elapsed < duration) {
        // Fill with random noise
        for (let i = 0; i < imageData.data.length; i += 4) {
          const value = Math.random() * 255;
          imageData.data[i] = value;     // R
          imageData.data[i + 1] = value; // G
          imageData.data[i + 2] = value; // B
          imageData.data[i + 3] = 100;   // A
        }
        ctx.putImageData(imageData, 0, 0);
        requestAnimationFrame(animate);
      } else {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    };
    
    animate();
  }
}

// ━━━ RITUAL ANIMATION ━━━
class RitualAnimation {
  constructor(container) {
    this.container = container;
    this.canvas = document.createElement('canvas');
    this.ctx = this.canvas.getContext('2d');
    this.isActive = false;
    this.animationFrame = null;
    this.startTime = 0;
    this.duration = 10000; // 10 seconds
    
    this.canvas.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
    `;
    
    this.resize();
    window.addEventListener('resize', () => this.resize());
  }
  
  resize() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
  }
  
  start() {
    this.isActive = true;
    this.startTime = Date.now();
    this.container.innerHTML = '';
    this.container.appendChild(this.canvas);
    this.animate();
  }
  
  stop() {
    this.isActive = false;
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
      this.animationFrame = null;
    }
  }
  
  animate() {
    if (!this.isActive) return;
    
    const elapsed = Date.now() - this.startTime;
    const progress = Math.min(elapsed / this.duration, 1);
    
    // Clear canvas
    this.ctx.fillStyle = 'rgba(10, 10, 10, 0.1)';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    // Draw concentric circles that grow and intensify
    const centerX = this.canvas.width / 2;
    const centerY = this.canvas.height / 2;
    const numCircles = 8;
    
    for (let i = 0; i < numCircles; i++) {
      const phase = (i / numCircles) * Math.PI * 2;
      const radius = 50 + (progress * 300) + Math.sin(elapsed / 200 + phase) * 20;
      const opacity = progress * 0.5 * (1 - i / numCircles);
      
      this.ctx.strokeStyle = `rgba(0, 255, 136, ${opacity})`;
      this.ctx.lineWidth = 2 + progress * 3;
      this.ctx.beginPath();
      this.ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
      this.ctx.stroke();
    }
    
    // Draw code fragments that appear and scramble
    if (progress > 0.3 && Math.random() < 0.1) {
      const fragments = ['<html>', '</>', '404', 'ERROR', 'NULL', 'DEPRECATED', '{}', '[]'];
      const fragment = fragments[Math.floor(Math.random() * fragments.length)];
      const x = Math.random() * this.canvas.width;
      const y = Math.random() * this.canvas.height;
      
      this.ctx.font = '20px monospace';
      this.ctx.fillStyle = `rgba(0, 255, 136, ${0.3 + progress * 0.5})`;
      this.ctx.fillText(fragment, x, y);
    }
    
    // Glitch effects at key moments
    if (progress > 0.5 && Math.random() < 0.05) {
      GlitchEffects.flashScreen('#00ff88', 50);
    }
    
    // Haptic feedback at checkpoints
    if (navigator.vibrate) {
      if (Math.abs(progress - 0.5) < 0.01 || Math.abs(progress - 1.0) < 0.01) {
        navigator.vibrate(100);
      }
    }
    
    this.animationFrame = requestAnimationFrame(() => this.animate());
  }
}

// ━━━ EXPORT FOR USE ━━━
window.VisualEffects = {
  MatrixRain,
  GlitchEffects,
  RitualAnimation
};
