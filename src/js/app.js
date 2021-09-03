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
const MAX_DISTANCE = 10000;
const FORCE_DIST = 5000.0;
const SPN_DIST = 2000.0;
const CON_DIST = 500.0;
const G = 0.0667;
const PI = 3.14159
const FOURTHIRDS = 1.3333;
const SPHERE_RATIO = FOURTHIRDS * PI; 


// this class describes the properties of a single particle.
class Particle {
    static id_count;
    // setting the co-ordinates, radius and the
    // speed of a particle in both the co-ordinates axes.
    constructor(pos, vel, color, r = weightedRandom(1, 25)){
        this.position       = pos;
        this.velocity       = vel;
        this.acceleration   = new p5.Vector(0, 0, 0);
        this.force          = new p5.Vector(0, 0, 0);
        this.radius         = r;
        this.mass           = SPHERE_RATIO * r * r * r;
        this.id             = this.id_count++;
        this.trail          = [];
        this.color          = color;
        this.respawn        = false;
    }
    
    // creation of a particle.
    drawParticle() {
        push();
        noStroke();
        fill(this.color);
        translate(this.position.x, this.position.y, this.position.z);
        sphere( this.radius);
        pop();
    }
    
    printData() {
        fill(RGBA(255,255,255,1));
        textSize(6);
        text('mass: ' + this.mass + '\nrad: ' + this.radius + '\nvel: ' + round(this.velocity) + '\nfor: ' + this.force);
    }
    
    drawForce() {
        fill(RGBA(80,80,255,1));
        strokeWeight(1);
        stroke(RGBA(250, 80, 240, this.force.mag()));
        line(this.position.x, this.position.y, this.position.z, (this.position.x + 5 * this.force.x), (this.position.y + 5 * this.force.y), (this.position.z + 5 * this.force.z));
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
        //this.drawForce();
        this.force.set(0, 0, 0);
    }
        
    applyForce(particles) {
        particles.forEach(element => {
            // Skip self with self
            if (this.id == element.id) return;
            let dis = p5.Vector.dist(this.position, element.position);
            if(dis < FORCE_DIST) {
              if (dis < (this.radius + element.radius)) return;
              let force = new p5.Vector(0, 0, 0);
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
    drawJoinParticles(particles) {
        particles.forEach(element =>{
            let dis = p5.Vector.dist(this.position, element.position);
            if (dis > CON_DIST) return;
            let connection = CON_DIST - Math.abs(dis);
            fill(RGBA(80,255,255,1));
            strokeWeight(connection / CON_DIST);
            stroke(RGBA(150, 80, 240, (connection / CON_DIST)));
            line(this.position.x, this.position.y, this.position.z, element.position.x, element.position.y, element.position.z);
        });
    }
}


class starParticle extends Particle {
    constructor(pos, vel, color, r){
        super(pos, vel, color, r);
    }

}

class Constellation {
    constructor(){
        this.particles = [];
    }
    
    addParticles() {
        for(let i = 0; i < N_PARTICLES; i++){
            var x = random(-SPN_DIST, SPN_DIST);
            var y = random(-SPN_DIST, SPN_DIST);
            var z = random(-SPN_DIST, SPN_DIST);
            var r = Math.round(random(120, 140));
            var g = Math.round(random(120, 140));
            var b = Math.round(random(180, 255));
            var pos = new p5.Vector(x, y, z);
            var vel = new p5.Vector(random(-0.8, 0.8), random(-0.8, 0.8), random(-0.8, 0.8));
            var color = RGBA(r, g, b, 1);
            this.particles.push(new Particle(pos, vel, color));
        }
    }
    
    addCenterParticle(){
        var pos = new p5.Vector(windowWidth/2, windowHeight/2, 0);
        var vel = new p5.Vector(0, 0, 0);
        var color = RGBA(255, 240, 180, 1);
        var radius = 50;
        this.particles.push(new starParticle(pos, vel, color, radius));
    }
    
    updateParticles() {
        for(let i = 0; i < this.particles.length; i++) {
           this.particles[i].applyForce(this.particles);
        }
        for(let i = 0; i < this.particles.length; i++) {
          this.particles[i].moveParticle();
          this.particles[i].drawJoinParticles(this.particles.slice(i));
          this.particles[i].drawParticle(); 
        }
    }
}

// an array to add multiple particles
let constellation = new Constellation();
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
  print(event.delta);
  pos += event.delta;
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}

function setup() {
  frameRate(30);
  let interval = 1 / frameRate();
  var renderer = createCanvas(windowWidth, windowHeight, WEBGL);
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
