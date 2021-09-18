/*
 * Original version:
 * @name Constellation
 * @description Creates a simple constellation
 * Inspired by Particle.js by Sagar Arora.
 */
p5.disableFriendlyErrors = true;

function RGBA(r, g, b, a) {
    let str = 'rgba(';
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
const MAX_DISTANCE = 10000;
const FORCE_DIST = 5000.0;
const SPN_DIST = 2000.0;
const CON_DIST = 500.0;
const G = 0.0667;
const FOURTHIRDS = 4/3;
const SPHERE_RATIO = FOURTHIRDS * Math.PI; 
const TRAIL_LENGTH = 20;
const FPTRAIL = 20;


function line3D(vector1, vector2, color, width) {
    strokeWeight(width);
    stroke(color);
    line(vector1.x, vector1.y, vector1.z, vector2.x, vector2.y, vector2.z);
}


class Trail {
    constructor(pos, width) {
        this.position   = pos;
        this.trail      = [];
        this.previous   = new p5.Vector();
        this.current    = new p5.Vector();
        this.strength;
        this.width      = width;
    }
    
    drawTrail() {
        this.previous.set(this.position);
        for(let i = 0; i < this.trail.length; i++) {
            this.strength = (this.trail.length - i) / this.trail.length;
            this.current.set(this.trail[i]);
            line3D(this.previous, this.current, RGBA(120, 120, 120, this.strength), this.width * this.strength);
            this.previous.set(this.current);
        }
    }

    addTrail() {
        let v = new p5.Vector();
        v.set(this.position);
        this.trail.unshift(v);
        if (this.trail.length > TRAIL_LENGTH) {
            this.trail.pop();
        }
    }
}

// this class describes the properties of a single particle.
class Particle {
    static id_count;
    // setting the co-ordinates, radius and the
    // speed of a particle in both the co-ordinates axes.
    constructor(pos, vel, color, r = weightedRandom(1, 25)) {
        this.position       = pos;
        this.velocity       = vel;
        this.acceleration   = new p5.Vector();
        this.force          = new p5.Vector();
        this.radius         = r;
        this.mass           = SPHERE_RATIO * r * r * r;
        this.id             = this.id_count++;
        this.color          = color;
        this.trail          = new Trail(this.position, this.radius);
    }
    
    // creation of a particle.
    drawParticle() {
        push();
        noStroke();
        fill(this.color);
        translate(this.position.x, this.position.y, this.position.z);
        sphere(this.radius);
        pop();
    }
    
    update(nr) {
        if (nr % FPTRAIL){
            this.trail.addTrail();
        }
        this.moveParticle();
        this.drawParticle();
        this.trail.drawTrail();
    }
    
    // setting the particle in motion.
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
              let force = new p5.Vector();
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
}


class starParticle extends Particle {
    constructor(pos, vel, color, r){
        super(pos, vel, color, r);
    }
    
    update(nr) {
        super.moveParticle();
        super.drawParticle();
    }

}

class Constellation {
    constructor(){
        this.particles  = [];
        this.updates    = 0;
    }
    
    addParticles() {
        for(let i = 0; i < N_PARTICLES; i++){
            var r = Math.round(random(120, 220));
            var g = Math.round(random(140, 190));
            var b = Math.round(random(140, 190));
            var pos = this.createRandomVector(SPN_DIST);
            var vel = new p5.Vector(random(-0.8, 0.8), random(-0.8, 0.8), random(-0.8, 0.8));
            var color = RGBA(r, g, b, 1);
            this.particles.push(new Particle(pos, vel, color));
        }
    }
    
    addCenterParticle(){
        var pos = this.createRandomVector(SPN_DIST / 2);
        var vel = new p5.Vector();
        var color = RGBA(255, 240, 180, 1);
        var radius = 50;
        this.particles.push(new starParticle(pos, vel, color, radius));
    }
    
    updateParticles() {
        this.updates++;
        for(let i = 0; i < this.particles.length; i++) {
           this.particles[i].applyForce(this.particles);
        }
        for(let i = 0; i < this.particles.length; i++) {
          this.particles[i].update(this.updates);
        }
    }
    
    createRandomVector(range) {
        let x = random(-range, range);
        let y = random(-range, range);
        let z = random(-range, range);
        return new p5.Vector(x, y, z);
    }
}

// an array to add multiple particles
const constellation = new Constellation();
let panvalue = 1;
let prevpan = 1;
let tiltvalue = 1;
let prevtilt = 1;
let updateCam = false;
let cam;
let pos = -500;
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

function setup() {
  frameRate(30);
  let interval = 1 / frameRate();
  const renderer = createCanvas(windowWidth, windowHeight, WEBGL);
  renderer.canvas.style.display = 'block';
  cam = createCamera();
  constellation.addParticles();
  constellation.addCenterParticle();
  x = -width/2;
  y = -height/2;
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

function draw() {
    updateKeyboard();
    updateMouse();
    translate(x, y, pos);
    background('#020202');
    constellation.updateParticles();
}
