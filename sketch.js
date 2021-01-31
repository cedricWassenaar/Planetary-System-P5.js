/*
 * @name Particles
 * @description There is a light-weight JavaScript library named
 * particle.js which creates a very pleasing particle system.
 * This is an attempt to recreate that particle system using p5.js.
 * Inspired by Particle.js, contributed by Sagar Arora.
 */

function RGBA(r, g, b, a) {
    var str = 'rgba(';
    str += r + ', ';
    str += g + ', ';
    str += b + ', ';
    str += a + ')';
    return str;
}

const CON_DIST = 300;
const G = 0.00067;

// this class describes the properties of a single particle.
class Particle {
// setting the co-ordinates, radius and the
// speed of a particle in both the co-ordinates axes.
  constructor(r = random(1, 10)){
    this.position   = new p5.Vector(random(0,width), random(0,height));
    this.velocity   = new p5.Vector(random(-0.1, 0.1), random(-0.1,0.1));
    this.force      = new p5.Vector(0, 0);
    this.radius     = r;
    this.mass       = 1.333 * 3.141 * r * r * r;
  }

// creation of a particle.
  paintParticle() {
    noStroke();
    fill(RGBA(80,80,255,1));
    circle(this.position.x, this.position.y, this.radius);
  }

// setting the particle in motion.
  moveParticle() {
    // Bounce of walss 
    if(this.position.x < 0 || this.position.x > width)
      this.velocity.x *= -1;
    if(this.position.y < 0 || this.position.y > height)
      this.velocity.y *= -1;
    
    // Move according to speed
    let acceleration = new p5.Vector.div(this.force, this.mass);
    this.velocity.add(acceleration);
    this.position.add(this.velocity);
    this.force = new p5.Vector(0, 0);
  }
    
  applyForce(particles){
      particles.forEach(element =>{
        // Skip self with self
        if (this === element){
          return;
        }
        let dis = p5.Vector.dist(this.position, element.position);
        if((dis < CON_DIST) && (dis > 2)) {
            let force = new p5.Vector(0, 0);
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
      // Skip self with self
      if (this === element){
          return;
      }
      let dis = p5.Vector.dist(this.position, element.position);
      if(dis < CON_DIST) {
        let connection = CON_DIST - dis;
        strokeWeight(connection / CON_DIST);
        stroke(RGBA(80, 80, 240, (connection / CON_DIST)));
        line(this.position.x, this.position.y, element.position.x, element.position.y);
      }
    });
  }
}

// an array to add multiple particles
let particles = [];

function setup() {
  createCanvas(windowWidth, windowHeight);
  for(let i = 0; i < width / 10; i++){
    particles.push(new Particle());
  }
}

function draw() {
  background('#020202');
  for(let i = 0; i < particles.length; i++) {
    particles[i].applyForce(particles.slice(i));
    
  }
  for(let i = 0; i < particles.length; i++) {
    particles[i].moveParticle();
    particles[i].showJoinParticles(particles.slice(i));
    particles[i].paintParticle(); 
  }
}
