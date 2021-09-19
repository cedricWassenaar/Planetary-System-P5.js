/*
 * @name Constellation
 * @description Creates a simple constellation
 * Inspired by Particle.js by Sagar Arora.
 */
p5.disableFriendlyErrors = true;


// --- Constants --- 
const N_PARTICLES   = 100;
const MAX_DISTANCE  = 10000;
const FORCE_DIST    = 5000.0;
const SPN_DIST      = 5000.0;
const G             = 0.667;
const FOURTHIRDS    = 4/3;
const SPHERE_RATIO  = FOURTHIRDS * Math.PI; 
const TRAIL_LENGTH  = 10;
const START_SPEED   = 5.0;
const MIN_PLANET_RAD = 3;
const MAX_PLANET_RAD = 20;
const CAM_START_POS = -3000;
const SPHERE_SEGS   = 16;

// --- Functions --- 
function RGBA(r, g, b, a) {
    let str = 'rgba(';
    str += r + ',';
    str += g + ',';
    str += b + ',';
    str += a + ')';
    return str;
}

function weightedRandom(min, max) {
  return (min - 1) + Math.round(max / (Math.random() * max + min));
}

function line3D(vector1, vector2, color, width) {
    strokeWeight(width);
    stroke(color);
    beginShape(LINES);
    vertex(vector1.x, vector1.y, vector1.z);
    vertex(vector2.x, vector2.y, vector2.z);
    endShape();
}


// --- Classes --- 
class Trail {
    constructor(pos, width) {
        this.updates    = 0;
        this.position   = pos;
        this.width      = width;
        this.trail      = [];
        this.previous   = new p5.Vector();
        this.current    = new p5.Vector();
        this.index      = 0;
        this.length     = TRAIL_LENGTH;
        this.colors     = [];
        this.widths     = [];
        for(let i = 0; i < this.length; i++) {
            this.trail.push(new p5.Vector().set(pos));
            let strength = ((this.length - i) / this.length) + 0.2;
            this.widths.push(this.width * strength);
            this.colors.push(RGBA(80, 80, 255, strength));
        }
    }
    
    drawTrail() {
        let n;
        let revolution = this.length + this.index - 1;
        this.previous.set(this.position);
        for(let i = 0; i < this.length; i++) {
            n = (revolution - i) % this.length;
            this.current.set(this.trail[n]);
            line3D(this.previous, this.current, this.colors[i], this.widths[i]);
            this.previous.set(this.current);
        }
    }

    addSegment() {
        this.trail[this.index].set(this.position);
        this.index = (this.index + 1) % this.length;
    }

    updateTrail() {
        if (p5.Vector.dist(this.previous, this.position) > this.width) {
            this.addSegment();
        }
        this.drawTrail();
    }
}


class Particle {
    static id_count;
    // setting the co-ordinates, radius and the
    // speed of a particle in both the co-ordinates axes.
    constructor(pos, vel, color, r) {
        this.position       = pos;
        this.velocity       = vel;
        this.acceleration   = new p5.Vector();
        this.force          = new p5.Vector();
        this.forceTemp      = new p5.Vector();
        this.forceTemp.limit(10);
        this.radius         = r;
        this.mass           = SPHERE_RATIO * r * r * r;
        this.id             = this.id_count++;
        this.color          = color;
        this.trail          = new Trail(this.position, this.radius / 2);
    }
    
    drawParticle() {
        push();
        noStroke();
        fill(this.color);
        translate(this.position.x, this.position.y, this.position.z);
        sphere(this.radius, SPHERE_SEGS, SPHERE_SEGS);
        pop();
    }
    
    update() {
        this.moveParticle();
        this.drawParticle();
        this.trail.updateTrail();
    }
    
    moveParticle() {
        // Bounce of walls 
        if(Math.abs(this.position.x) >= MAX_DISTANCE)
            this.velocity.x *= -1;
        if(Math.abs(this.position.y) >= MAX_DISTANCE)
            this.velocity.y *= -1;
        if(Math.abs(this.position.z) >= MAX_DISTANCE)
            this.velocity.z *= -1;
        
        // Move according to speed
        this.acceleration = new p5.Vector.div(this.force, this.mass);
        this.velocity.add(this.acceleration);
        this.position.add(this.velocity);
        this.force.set(0, 0, 0);
    }
    
    applyForce(particles) {
        particles.forEach(element => {
            // Skip self with self
            if (this.id == element.id) return;
            let dis = p5.Vector.dist(this.position, element.position);
            if(dis < FORCE_DIST) {
              if (dis < (this.radius + element.radius)) return;
              this.forceTemp.set(0, 0, 0);
              this.forceTemp.add(this.position);
              this.forceTemp.sub(element.position);
              this.forceTemp.normalize();
              let strength = ((G * this.mass * element.mass) / (dis * dis));
              this.forceTemp.mult(strength);
              // Apply pulling force off current object to other element
              element.force.add(this.forceTemp);
            }
        });
    }
}


class starParticle extends Particle {
    constructor(pos, vel, color, r){
        super(pos, vel, color, r);
    }
    
    update() {
        super.moveParticle();
        super.drawParticle();
    }
}

class Constellation {
    constructor(n){
        this.num_particles = n;
        this.particles  = [];
    }
    
    addParticles() {
        for(let i = 0; i < this.num_particles; i++){
            var rad = weightedRandom(MIN_PLANET_RAD, MAX_PLANET_RAD)
            var r = Math.round(random(120, 220));
            var g = Math.round(random(140, 190));
            var b = Math.round(random(140, 190));
            var pos = this.createRandomVector(SPN_DIST);
            var vel = this.createRandomVector(START_SPEED);
            var color = RGBA(r, g, b, 1);
            this.particles.push(new Particle(pos, vel, color, rad));
        }
    }
    
    addCenterParticle() {
        var pos = this.createRandomVector(SPN_DIST / 10);
        var vel = new p5.Vector();
        var color = RGBA(255, 255, 230, 1);
        var radius = 50;
        this.particles.push(new starParticle(pos, vel, color, radius));
    }
    
    updateParticles() {
        let length = this.particles.length;
        for(let i = 0; i < length; i++) {
           this.particles[i].applyForce(this.particles);
        }
        for(let i = 0; i < length; i++) {
          this.particles[i].update();
        }
    }
    
    createRandomVector(range) {
        let x = random(-range, range);
        let y = random(-range, range);
        let z = random(-range, range);
        return new p5.Vector(x, y, z);
    }
}

// --- Variables
const constellation = new Constellation(N_PARTICLES);
let panvalue = 1;
let prevpan = 1;
let tiltvalue = 1;
let prevtilt = 1;
let updateCam = false;
let cam;
let pos = CAM_START_POS;
let x;
let y;


function updateMouse(){
  if (updateCam){
      var pan = (mouseX - width/2) / width/2;
      var tilt = (mouseY - height/2) / height/2;
      if (Math.abs(pan) > 0.05){
          panvalue = pan;
      }
      else{
          panvalue = 0;
      }
      if (Math.abs(tilt) > 0.05){
          tiltvalue = tilt;
      }
      else{
          tiltvalue = 0;
      }
      if (panvalue != prevpan){   
        prevpan = panvalue;
      }
      if (tiltvalue != prevtilt){  
        prevtilt = tiltvalue;
      }
      cam.pan(-panvalue * 0.05);
      cam.tilt(tiltvalue * 0.05);
  }
}

function mousePressed() {
    updateCam = true;
}

function mouseReleased() {
    updateCam = false;
}

function mouseWheel(event) {
  pos += event.delta;
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}

function updateKeyboard() {
    if (keyIsDown(65)){
       x += 5;
     }
     if (keyIsDown(68)){
       x -= 5;
     }
     if (keyIsDown(87)){
       y += 5;
     }
     if (keyIsDown(83)){
       y -= 5;
     } 
 }

function setup() {
  colorMode(RGB);
  frameRate(30);
  const renderer = createCanvas(windowWidth, windowHeight, WEBGL);
  renderer.canvas.style.display = 'block';
  cam = createCamera();
  constellation.addParticles();
  constellation.addCenterParticle();
  x = -width/2;
  y = -height/2;
}

function draw() {
    updateKeyboard();
    updateMouse();
    translate(x, y, pos);
    background('#020202');
    constellation.updateParticles();
}
