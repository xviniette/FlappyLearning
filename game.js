var Neuvol;
var game;
var FPS = 60;
var maxScore=0;

var images = {};

var speed = function(fps){
	FPS = parseInt(fps);
}

var loadImages = function(sources, callback){
	var nb = 0;
	var loaded = 0;
	var imgs = {};
	for(var i in sources){
		nb++;
		imgs[i] = new Image();
		imgs[i].src = sources[i];
		imgs[i].onload = function(){
			loaded++;
			if (loaded === nb){
				callback(imgs);
			}
		}
	}
}

var Bird = function(json){
	this.x = 80;
	this.y = 250;
	this.width = 40;
	this.height = 30;

	this.alive = true;
	this.gravity = 0;
	this.velocity = 0.3;
	this.jump = -6;

	this.init(json);
}

Bird.prototype.init = function(json){
	for(var i in json){
		this[i] = json[i];
	}
}

Bird.prototype.flap = function(){
	this.gravity = this.jump;
}

Bird.prototype.update = function(){
	this.gravity += this.velocity;
	this.y += this.gravity;
}

Bird.prototype.isDead = function(height, pipes){
	if(this.y >= height || this.y + this.height <= 0){
		return true;
	}
	for(var i = 0; i < pipes.length; i++){
		if(!(
			this.x > pipes[i].x + pipes[i].width ||
			this.x + this.width < pipes[i].x || 
			this.y > pipes[i].y + pipes[i].height ||
			this.y + this.height < pipes[i].y
			)){
			return true;
		}
	}
}

var Pipe = function(json){
	this.x = 0;
	this.y = 0;
	this.width = 50;
	this.height = 40;
	this.speed = 3;

	this.init(json);
}

Pipe.prototype.init = function(json){
	for(var i in json){
		this[i] = json[i];
	}
}

Pipe.prototype.update = function(){
	this.x -= this.speed;
}

Pipe.prototype.isOut = function(){
	if(this.x + this.width < 0){
		return true;
	}
}

var Game = function(){
	this.pipes = [];
	this.birds = [];
	this.score = 0;
	this.canvas = document.querySelector("#flappy");
	this.ctx = this.canvas.getContext("2d");
	this.width = this.canvas.width;
	this.height = this.canvas.height;
	this.spawnInterval = 90;
	this.interval = 0;
	this.gen = [];
	this.alives = 0;
	this.generation = 0;
	this.backgroundSpeed = 0.5;
	this.backgroundx = 0;
  this.maxScore = 0;
}

Game.prototype.start = function(){
	this.interval = 0;
	this.score = 0;
	this.pipes = [];
	this.birds = [];

	this.gen = Neuvol.nextGeneration();
	for(var i = 0; i < this.gen.length; i++){
		var b = new Bird();
		this.birds.push(b)
	}
	this.generation++;
	this.alives = this.birds.length;
}

Game.prototype.update = function(){
	this.backgroundx += this.backgroundSpeed;
	var nextHoll = 0;
	if(this.birds.length > 0){
		for(var i = 0; i < this.pipes.length; i+=2){
			if(this.pipes[i].x + this.pipes[i].width > this.birds[0].x){
				nextHoll = this.pipes[i].height/this.height;
				break;
			}
		}
	}

	for(var i = 0; i < this.birds.length; i++){
		if(this.birds[i].alive){

			var inputs = [
			this.birds[i].y / this.height,
			nextHoll
			];

			var res = this.gen[i].compute(inputs);
			if(res > 0.5){
				this.birds[i].flap();
			}

			this.birds[i].update();
			if(this.birds[i].isDead(this.height, this.pipes)){
				this.birds[i].alive = false;
				this.alives--;
				//console.log(this.alives);
				Neuvol.networkScore(this.gen[i], this.score);
				if(this.isItEnd()){
					this.start();
				}
			}
		}
	}

	for(var i = 0; i < this.pipes.length; i++){
		this.pipes[i].update();
		if(this.pipes[i].isOut()){
			this.pipes.splice(i, 1);
			i--;
		}
	}

	if(this.interval === 0){
		var deltaBord = 50;
		var pipeHoll = 120;
		var hollPosition = Math.round(Math.random() * (this.height - deltaBord * 2 - pipeHoll)) +  deltaBord;
		this.pipes.push(new Pipe({x:this.width, y:0, height:hollPosition}));
		this.pipes.push(new Pipe({x:this.width, y:hollPosition+pipeHoll, height:this.height}));
	}

	this.interval++;
	if(this.interval === this.spawnInterval){
		this.interval = 0;
	}

	this.score++;
  this.maxScore = (this.score > this.maxScore) ? this.score : this.maxScore;

	setTimeout(function(){
		this.update();
	}.bind(this), 1000/FPS);

	this.draw();
}

Game.prototype.isItEnd = function(){
	for(var i = 0; i < this.birds.length; i++){
		if(this.birds[i].alive){
			return false;
		}
	}
	return true;
}

Game.prototype.draw = function(){

	this.ctx.clearRect(0, 0, this.width, this.height);

	this.drawBackground();

	this.drawPipes();
	this.drawBirds();
	this.drawStats();

}

Game.prototype.drawBackground = function() {

	var ctx = this.ctx;

	var length = Math.ceil(this.width / images.background.width) + 1;
	for(var i = 0; i < length; i++){
		ctx.drawImage(images.background, i * images.background.width - Math.floor(this.backgroundx%images.background.width), 0);
	}

}

Game.prototype.drawPipes = function() {

	var ctx = this.ctx;

	for(var i = 0; i < this.pipes.length;i++){
		if(i%2 === 0){
			ctx.drawImage(images.pipetop, this.pipes[i].x, this.pipes[i].y + this.pipes[i].height - images.pipetop.height, this.pipes[i].width, images.pipetop.height);
		}else{
			ctx.drawImage(images.pipebottom, this.pipes[i].x, this.pipes[i].y, this.pipes[i].width, images.pipetop.height);
		}
	}

}

Game.prototype.drawBirds = function() {

	var ctx = this.ctx;

	ctx.fillStyle = "#FFC600";
	ctx.strokeStyle = "#CE9E00";

	for(var i = 0; i < this.birds.length; i++){
		if(this.birds[i].alive){
			ctx.save(); 
 			ctx.translate(this.birds[i].x, this.birds[i].y);
 			ctx.translate(this.birds[i].width/2, this.birds[i].height/2);
 			ctx.rotate(Math.PI/2 * this.birds[i].gravity/20);
 			ctx.drawImage(images.bird, -this.birds[i].width, -this.birds[i].height/2, this.birds[i].width, this.birds[i].height);
 			ctx.restore();
		}
	}

}

Game.prototype.drawStats = function() {
	var ctx = this.ctx;
	ctx.fillStyle = "#fff";
	ctx.font="20px Oswald, sans-serif";
	ctx.fillText("Score : "+ this.score, 10, 25);
	ctx.fillText("Max Score : "+this.maxScore, 10, 50);
	ctx.fillText("Generation : "+this.generation, 10, 75);
	ctx.fillText("Alive : "+this.alives+" / "+Neuvol.options.population, 10, 100);
}

window.onload = function(){
	var sprites = {
		bird:"./img/bird.png",
		background:"./img/background.png",
		pipetop:"./img/pipetop.png",
		pipebottom:"./img/pipebottom.png"
	}

	var start = function(){
		Neuvol = new Neuroevolution({
			population:50,
			network:[2, [2], 1],
		});
		game = new Game();
		game.start();
		setTimeout(function(){
			game.update();
		}, 1000/FPS);
	}

	loadImages(sprites, function(imgs){
		images = imgs;
		start();
	})

}