/*
 * @name Constellation
 * @description Creates a simple constellation
 * Inspired by Particle.js by Sagar Arora.
 */
p5.disableFriendlyErrors = true;


// --- Constants --- 
const N_PARTICLES   = 50;
const MAX_DISTANCE  = 10000;
const FORCE_DIST    = 5000.0;
const SPN_DIST      = 5000.0;
const G             = 6.67;
const FOURTHIRDS    = 4/3;
const SPHERE_RATIO  = FOURTHIRDS * Math.PI; 
const TRAIL_LENGTH  = 20;
const TRAIL_SPACING = 400;
const START_SPEED   = 5.0;
const MIN_PLANET_RAD = 3;
const MAX_PLANET_RAD = 20;
const CAM_START_POS = -3000;
const SPHERE_SEGS   = 16;
const PAN_SPEED     = 0.05;


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
    push();
    strokeWeight(width);
    stroke(color);
    beginShape(LINES);
    vertex(vector1.x, vector1.y, vector1.z);
    vertex(vector2.x, vector2.y, vector2.z);
    endShape();
    pop();
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
        this.spacing    = TRAIL_SPACING;
        this.colors     = [];
        this.widths     = [];
        for(let i = 0; i < this.length; i++) {
            this.trail.push(new p5.Vector().set(pos));
            let strength = ((this.length - i) / this.length) + 0.2;
            this.widths.push(this.width * strength);
            this.colors.push(RGBA(130, 140, 255, strength));
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

    updateTrail(draw) {
        let angle = Math.abs(this.previous.angleBetween(this.position));
        let delta = p5.Vector.dist(this.previous, this.position);
        if (angle > 1 || delta > this.spacing) {
            this.addSegment();
        }
        if (draw){
            this.drawTrail();
        }
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
    
    update(seconds) {
        this.moveParticle(seconds);
        this.drawParticle();
        if (this.acceleration.mag() > 0.1){
            this.trail.updateTrail(true);
        }
        else{
            this.trail.updateTrail(false);
        }
    }
    
    moveParticle(seconds) {
        // Bounce of walls 
        if(Math.abs(this.position.x) >= MAX_DISTANCE)
            this.velocity.x *= -1;
        if(Math.abs(this.position.y) >= MAX_DISTANCE)
            this.velocity.y *= -1;
        if(Math.abs(this.position.z) >= MAX_DISTANCE)
            this.velocity.z *= -1;
        
        // Move according to speed
        this.acceleration = new p5.Vector.div(this.force, this.mass).mult(seconds);
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
    
    update(seconds) {
        super.moveParticle(seconds);
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
    
    updateParticles(seconds) {
        let length = this.particles.length;
        for(let i = 0; i < length; i++) {
           this.particles[i].applyForce(this.particles);
        }
        for(let i = 0; i < length; i++) {
          this.particles[i].update(seconds);
        }
    }
    
    createRandomVector(range) {
        let x = random(-range, range);
        let y = random(-range, range);
        let z = random(-range, range);
        return new p5.Vector(x, y, z);
    }
}


class userCamera {
    constructor(w, h){
        this.panvalue = 1;
        this.prevpan = 1;
        this.tiltvalue = 1;
        this.prevtilt = 1;
        this.PanTiltActive = false;
        this.x = -w/2;
        this.y = -h/2;
        this.z = CAM_START_POS;
        this.cam = createCamera();
    }

    updatePanTilt(pan, tilt) {
        if (this.PanTiltActive === false){
            return;
        }

        if (Math.abs(pan) > PAN_SPEED){
            this.panvalue = pan;
        }
        else{
            this.panvalue = 0;
        }
        if (Math.abs(tilt) > PAN_SPEED){
            this.tiltvalue = tilt;
        }
        else{
            this.tiltvalue = 0;
        }
        if (this.panvalue != this.prevpan){   
            this.prevpan = this.panvalue;
        }
        if (this.tiltvalue != this.prevtilt){  
            this.prevtilt = this.tiltvalue;
        }
        this.cam.pan(-this.panvalue * PAN_SPEED);
        this.cam.tilt(this.tiltvalue * PAN_SPEED);
    }

    updatePosX(amount) {
        this.x += amount;
    }

    updatePosY(amount) {
        this.y += amount;
    }
    
    updatePosZ(amount) {
        this.z += amount;
    }

    updateCamera() {
        translate(this.x, this.y, this.z);
    }

    enablePanTilt() {
        this.PanTiltActive = true;
    }

    disablePanTilt() {
        this.PanTiltActive = false;
    }
}

// --- Variables --- 
let constellation;
let userCam;

// --- P5js functions --- 
function updateMouse() {
    var pan = (mouseX - width/2) / width/2;
    var tilt = (mouseY - height/2) / height/2;
    userCam.updatePanTilt(pan, tilt);
}

function mousePressed() {
    userCam.enablePanTilt()
}

function mouseReleased() {
    userCam.disablePanTilt()
}

function mouseWheel(event) {
    userCam.updatePosZ(event.delta);
}

function windowResized() {
    resizeCanvas(windowWidth, windowHeight);
}

function updateKeyboard() {
    if (keyIsDown(65)){
        userCam.updatePosX(5);
    }
    if (keyIsDown(68)){
        userCam.updatePosX(-5);
    }
    if (keyIsDown(87)){
        userCam.updatePosY(5);
    }
    if (keyIsDown(83)){
        userCam.updatePosY(-5);
    }
 }

function setup() {
  colorMode(RGB);
  frameRate(60);
  const renderer = createCanvas(windowWidth, windowHeight, WEBGL);
  renderer.canvas.style.display = 'block';
  userCam = new userCamera(width, height);
  constellation = new Constellation(N_PARTICLES);
  constellation.addParticles();
  constellation.addCenterParticle();
}

function draw() {
    let fps = frameRate()
    let sec = 1.0 / Math.max(fps, 1.0);
    updateKeyboard();
    updateMouse();
    userCam.updateCamera();
    background('#020202');
    constellation.updateParticles(sec);
}
