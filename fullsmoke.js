const canvas = document.getElementById('fullsmokeCanvas');
const ctx = canvas.getContext('2d');

let width, height;
let smokeParticles = [];
let time = 0;

// Resize canvas
function resize() {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
}

// Smoke particle class
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
        
        // Color variations - gray smoke
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
        
        // Add some turbulence
        this.vx += (Math.random() - 0.5) * 0.05;
        this.vy += (Math.random() - 0.5) * 0.03;
        
        // Damping
        this.vx *= 0.99;
        this.vy *= 0.99;
        
        // Expand
        if (this.size < this.maxSize) {
            this.size += this.growthRate;
        }
        
        this.life -= this.decay;
        this.rotation += this.rotationSpeed;
    }

    draw() {
        if (this.life <= 0) return;

        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation);
        ctx.globalAlpha = this.opacity * this.life * 0.8;
        
        // Create smooth gradient
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

// Create smoke particles from bottom
function createSmoke() {
    const particlesPerFrame = 10; // Lots of smoke to fill screen
    
    for (let i = 0; i < particlesPerFrame; i++) {
        // Spawn across entire bottom width
        const x = Math.random() * width;
        const y = height + 50;
        smokeParticles.push(new SmokeParticle(x, y));
    }
}

// Animation loop
function animate() {
    // Fade effect for smoky trails
    ctx.fillStyle = 'rgba(10, 10, 10, 0.04)';
    ctx.fillRect(0, 0, width, height);

    time++;

    // Create smoke continuously
    createSmoke();

    // Update and draw smoke particles
    for (let i = smokeParticles.length - 1; i >= 0; i--) {
        smokeParticles[i].update(time);
        smokeParticles[i].draw();

        if (smokeParticles[i].isDead()) {
            smokeParticles.splice(i, 1);
        }
    }

    requestAnimationFrame(animate);
}

// Event listeners
window.addEventListener('resize', () => {
    resize();
    smokeParticles = [];
});

// Start
resize();
animate();
