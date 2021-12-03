/*
 * @name Constellation
 * @description Creates a simple constellation
 * Inspired by Particle.js by Sagar Arora.
 */
p5.disableFriendlyErrors = true;


// --- Constants --- 
const N_PARTICLES   = 40;
const MAX_DISTANCE  = 30000;
const FORCE_DIST    = 8000.0;
const SPN_DIST      = 8000.0;
const G             = 6.67;
const FOURTHIRDS    = 4/3;
const SPHERE_RATIO  = FOURTHIRDS * Math.PI; 
const TRAIL_LENGTH  = 70;
const TRAIL_SPACING = 300;
const START_SPEED   = 5.0;
const MIN_PLANET_RAD = 3.0;
const MAX_PLANET_RAD = 20.0;
const CAM_START_POS = 4500;
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

function randomColor(min, max) {
    var r = Math.round(random(min, max));
    var g = Math.round(random(min, max));
    var b = Math.round(random(min, max));
    return RGBA(r, g, b, 1);
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
    constructor(pos, width, color) {
        this.updates    = 0;
        this.position   = pos;
        this.width      = width;
        this.trail      = [];
        this.previous   = createVector();
        this.current    = createVector();
        this.index      = 0;
        this.length     = TRAIL_LENGTH;
        this.spacing    = TRAIL_SPACING;
        this.colors     = [];
        this.widths     = [];
        this.color      = color
        for(let i = 0; i < this.length; i++) {
            this.trail.push(createVector().set(pos));
            let strength = ((this.length - i) / this.length) + 0.2;
            this.widths.push(this.width * strength);
            this.colors.push(color.replace(/[^,]+(?=\))/, strength));
        }
    }
    
    drawTrail() {
        let n;
        let revolution = this.length + this.index - 1;
        this.previous.set(this.position);
        push()
        for(let i = 0; i < this.length; i++) {
            n = (revolution - i) % this.length;
            this.current.set(this.trail[n]);
            line3D(this.previous, this.current, this.colors[i], this.widths[i]);
            this.previous.set(this.current);
        }
        pop()
    }

    addSegment() {
        this.trail[this.index].set(this.position);
        this.index = (this.index + 1) % this.length;
    }

    updateTrail(draw) {
        this.addSegment();
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
        this.acceleration   = createVector();
        this.force          = createVector();
        this.forceTemp      = createVector();
        this.forceTemp.limit(30);
        this.radius         = r;
        this.mass           = 10 * SPHERE_RATIO * r * r * r;
        this.id             = this.id_count++;
        this.color          = color;
        this.trail          = new Trail(this.position, this.radius / 2, this.color);
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
        if (this.acceleration.mag() > 0.05){
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
        push()
        super.drawParticle();
        pop()
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
            var pos = this.createRandomVector(SPN_DIST);
            var vel = this.createRandomVector(START_SPEED);
            var color = randomColor(100, 250);
            this.particles.push(new Particle(pos, vel, color, rad));
        }
    }
    
    addCenterParticle() {
        var pos = this.createRandomVector(SPN_DIST / 10);
        var vel = createVector();
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
        return createVector(x, y, z);
    }
}


class userCamera {
    constructor(w, h){
        this.panvalue = 1;
        this.prevpan = 1;
        this.tiltvalue = 1;
        this.prevtilt = 1;
        this.PanTiltActive = false;
        this.pos = createVector(0, 0, CAM_START_POS);
        this.mousePos = createVector(0, 0, 0);
        this.startX = 0;
        this.startY = 0;
        this.cam = createCamera();
    }

    updatePanTilt(x, y) {
        if (this.PanTiltActive === false) return;
        var pan = (this.startX - x) / this.startX;
        var tilt = (this.startY - y) / this.startY;
        this.panvalue = pan * (Math.abs(pan) > PAN_SPEED);
        this.tiltvalue = tilt * (Math.abs(tilt) > PAN_SPEED);
        this.cam.pan(-this.panvalue * PAN_SPEED);
        this.cam.tilt(this.tiltvalue * PAN_SPEED);
    }

    updatePosX(amount) {
        this.pos.x = -amount;
    }

    updatePosY(amount) {
        this.pos.y = -amount;
    }
    
    updatePosZ(amount) {
        this.pos.z = amount;
    }

    updateCamera() {
        this.cam.move(this.pos.x, this.pos.y, this.pos.z);
        this.pos.set(0, 0, 0);
    }

    enablePanTilt(x, y) {
        this.startX = x;
        this.startY = y;
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
    userCam.updatePanTilt(mouseX, mouseY);
}

function mousePressed() {
    userCam.enablePanTilt(mouseX, mouseY)
}

function mouseReleased() {
    userCam.disablePanTilt()
}

function mouseWheel(event) {
    userCam.updatePosZ(event.delta * 3);
}

function windowResized() {
    resizeCanvas(windowWidth, windowHeight);
}

function updateKeyboard() {
    if (keyIsDown(65) || keyIsDown(LEFT_ARROW)){
        userCam.updatePosX(10);
    }
    if (keyIsDown(68) || keyIsDown(RIGHT_ARROW)){
        userCam.updatePosX(-10);
    }
    if (keyIsDown(87) || keyIsDown(UP_ARROW)){
        userCam.updatePosY(10);
    }
    if (keyIsDown(83) || keyIsDown(DOWN_ARROW)){
        userCam.updatePosY(-10);
    }
 }

function setup() {
  colorMode(RGB);
  frameRate(30);
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
    push()
    constellation.updateParticles(sec);
    pop()
}
