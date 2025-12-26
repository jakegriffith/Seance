const canvas = document.getElementById('fireCanvas');
const ctx = canvas.getContext('2d');

let width, height;
let particles = [];

// Resize canvas to fill window
function resize() {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
}

// Fire particle class
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
        this.vy -= 0.1; // Upward acceleration
        this.vx *= 0.99; // Slight horizontal damping
        this.life -= this.decay;
        this.size *= 0.98; // Shrink over time
    }

    draw(time) {
        if (this.life <= 0) return;

        ctx.save();
        ctx.globalAlpha = this.life;

        // Flicker effect
        const flicker = Math.sin(time * this.flickerSpeed + this.flickerOffset) * 0.2 + 0.8;
        const currentSize = this.size * flicker;

        // Create fire gradient based on particle life
        let color1, color2, color3;
        
        if (this.life > 0.7) {
            // Hot core - white to yellow
            color1 = `rgba(255, 255, 200, ${this.life})`;
            color2 = `rgba(255, 200, 50, ${this.life * 0.8})`;
            color3 = `rgba(255, 100, 0, 0)`;
        } else if (this.life > 0.4) {
            // Middle - yellow to orange
            color1 = `rgba(255, 200, 50, ${this.life})`;
            color2 = `rgba(255, 100, 0, ${this.life * 0.8})`;
            color3 = `rgba(200, 50, 0, 0)`;
        } else {
            // Cooling - orange to red/dark
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

// Ember/spark class for flying embers
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
        this.vy += 0.1; // Gravity
        this.vx *= 0.99;
        this.life -= this.decay;
        this.angle += this.spin;
    }

    draw() {
        if (this.life <= 0) return;

        ctx.save();
        ctx.globalAlpha = this.life * 0.8;
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle);

        // Glowing ember
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

let time = 0;
let embers = [];

// Create fire sources across the bottom of the screen
function createFireParticles() {
    const particlesPerFrame = 15;
    const fireWidth = width;
    
    for (let i = 0; i < particlesPerFrame; i++) {
        // Create particles across the bottom with some variation
        const x = Math.random() * fireWidth;
        const y = height - Math.random() * 50;
        particles.push(new FireParticle(x, y));
    }

    // Occasionally create embers
    if (Math.random() < 0.3) {
        const x = Math.random() * fireWidth;
        const y = height - Math.random() * 100;
        embers.push(new Ember(x, y));
    }
}

// Animation loop
function animate() {
    // Slight fade instead of full clear for trail effect
    ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
    ctx.fillRect(0, 0, width, height);

    time++;

    // Create new fire particles
    createFireParticles();

    // Update and draw fire particles
    for (let i = particles.length - 1; i >= 0; i--) {
        particles[i].update();
        particles[i].draw(time);

        if (particles[i].isDead()) {
            particles.splice(i, 1);
        }
    }

    // Update and draw embers
    for (let i = embers.length - 1; i >= 0; i--) {
        embers[i].update();
        embers[i].draw();

        if (embers[i].isDead()) {
            embers.splice(i, 1);
        }
    }

    // Add base glow at the bottom
    const glowGradient = ctx.createLinearGradient(0, height, 0, height - 200);
    glowGradient.addColorStop(0, 'rgba(255, 100, 0, 0.3)');
    glowGradient.addColorStop(0.5, 'rgba(255, 50, 0, 0.1)');
    glowGradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
    
    ctx.fillStyle = glowGradient;
    ctx.fillRect(0, height - 200, width, 200);

    requestAnimationFrame(animate);
}

// Event listeners
window.addEventListener('resize', () => {
    resize();
    particles = [];
    embers = [];
});

// Start animation
resize();
animate();
