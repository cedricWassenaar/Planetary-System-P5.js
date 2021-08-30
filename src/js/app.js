/*
 * Original version:
 * @name Constellation
 * @description Creates a simple constellation
 * Inspired by Particle.js by Sagar Arora.
 */

function RGBA(r, g, b, a) {
    var str = 'rgba(';
    str += r + ', ';
    str += g + ', ';
    str += b + ', ';
    str += a + ')';
    return str;
}

function weightedRandom(min, max) {
  return (min - 1) + Math.round(max / (Math.random() * max + min));
}

const N_PARTICLES = 100;
const CON_DIST = 300.0;
const G = 0.00067;
const PI = 3.14159
const FOURTHIRDS = 1.3333;


// this class describes the properties of a single particle.
class Particle {
    // setting the co-ordinates, radius and the
    // speed of a particle in both the co-ordinates axes.
    constructor(r = weightedRandom(5, 50)){
        this.position       = new p5.Vector(random(0,width), random(0,height), 0);
        this.velocity       = new p5.Vector(random(-0.1, 0.1), random(-0.1,0.1));
        this.acceleration   = new p5.Vector(0, 0);
        this.force          = new p5.Vector(0, 0);
        this.radius         = r;
        this.mass           = FOURTHIRDS * PI * r * r * r;
    }

    // creation of a particle.
    paintParticle() {
        noStroke();
        fill(RGBA(80,80,255,1));
        // pointLight(RGBA(200, 200, 200, 1), this.position.x, this.position.y, 0);
        // circle(this.position.x, this.position.y, this.position.z, this.radius);
        circle(this.position.x, this.position.y, this.radius);
        //this.printData();
    }
    
    printData() {
        fill(RGBA(255,255,255,1));
        textSize(6);
        text('mass: ' + this.mass + '\nrad: ' + this.radius + '\nvel: ' + round(this.velocity) + '\nfor: ' + this.force, this.position.x, this.position.y);
    }
    
    drawForce() {
        strokeWeight(1);
        stroke(RGBA(250, 80, 240, this.force.mag()));
        line(this.position.x, this.position.y, (this.position.x + 5 * this.force.x), (this.position.y + 5 * this.force.y));
    }

    // setting the particle in motion.
    moveParticle() {
        // Bounce of walls 
        if(this.position.x <= 0 || this.position.x >= width)
              this.velocity.x *= -1;
        if(this.position.y <= 0 || this.position.y >= height)
              this.velocity.y *= -1;

        // Move according to speed
        this.acceleration = new p5.Vector.div(this.force, this.mass);
        this.velocity.add(this.acceleration);
        this.position.add(this.velocity);
        //this.drawForce();
        this.force.set(0, 0);
    }
    
    applyForce(particles) {
        particles.forEach(element =>{
            // Skip self with self
            if (this === element) return;
            let dis = p5.Vector.dist(this.position, element.position);
            if((dis < CON_DIST) && (dis > 2)) {
                let force = new p5.Vector(0, 0);
                force.limit(10);
                force.add(this.position);
                force.sub(element.position);
                force.normalize();
                let strength = ((G * this.mass * element.mass) / (dis * dis));
                force.mult(strength);
                // Apply pulling force off current object to other element
                element.force.add(force);
            }
        });
    }

    // this function creates the connections(lines)
    // between particles which are less than a certain distance apart
    showJoinParticles(particles) {
        particles.forEach(element =>{
            let dis = p5.Vector.dist(this.position, element.position);
            if (dis > CON_DIST) return;
            let connection = CON_DIST - Math.abs(dis);
            strokeWeight(connection / CON_DIST);
            stroke(RGBA(80, 80, 240, (connection / CON_DIST)));
            line(this.position.x, this.position.y, element.position.x, element.position.y);
        });
    }
}

class Constellation {
    constructor(){
        this.particles = [];
    }
    
    addParticles() {
        for(let i = 0; i < N_PARTICLES; i++){
            this.particles.push(new Particle());
        }
    }
    
    updateParticles() {
        for(let i = 0; i < this.particles.length; i++) {
            this.particles[i].applyForce(this.particles.slice(i));
        }
        for(let i = 0; i < this.particles.length; i++) {
            this.particles[i].moveParticle();
            this.particles[i].showJoinParticles(this.particles.slice(i));
            this.particles[i].paintParticle(); 
        }
    }
}

// an array to add multiple particles
let constellation = new Constellation();

function setup() {
  var renderer = createCanvas(windowWidth, windowHeight);
    // createCanvas(windowWidth, windowHeight, WEBGL);
  renderer.canvas.style.display = 'block';
  constellation.addParticles();
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}

function draw() {
    let interval = 1 / frameRate();
    background('#020202');
    // translate(-width/2, -height/2, 0);
    constellation.updateParticles();
}
