// Tennis Jump
// version 5.1
// by Brad
//
// Makes the game work with p5.play v3, outside of Game Lab.
//
// Changelog:
// v5: Manually set frameRate to 60 (after default changed to 30)
// v4: Adjusted ball physics: Not 100% bounciness anymore, and can
//     apply spin which has a subtle effect when bouncing on the
//     ground.
// v3: Added game start/end states and in-game reset (TOURNAMENT MODE)
// v2: Players have simple jump animations
//
// Old versions:
// v5: https://studio.code.org/projects/gamelab/XTiROHdHBhywT7P5D-Y-aA
// v4: https://studio.code.org/projects/gamelab/cNPz3iv6WqsRIp1fJxpI5Q
// v3: https://studio.code.org/projects/gamelab/sBcfnlCtW13IOUFSOGcfJg
// v2: https://studio.code.org/projects/gamelab/Q3-r_Yr4kz_-Fl_N4fejFA
// v1: https://studio.code.org/projects/gamelab/PIR50vyW7uL7ijv9D26B5Q

const GAME_WIDTH = 400
const GAME_HEIGHT = 400
const GROUND_HEIGHT = 50
const GROUND_Y_POS = GAME_HEIGHT - GROUND_HEIGHT

const PLAYER_WIDTH = 20
const PLAYER_HALF_WIDTH = PLAYER_WIDTH / 2
const PLAYER_HEIGHT = 40
const PLAYER_HALF_HEIGHT = PLAYER_HEIGHT / 2

const BALL_SIZE = 10
const BALL_HALF_SIZE = BALL_SIZE / 2
const BALL_ACCELERATION_FACTOR = 0.1
const SERVE_SPEED_X = 3
const SERVE_INSET_POSITION = 50
const BALL_BOUNCINESS = 0.9 // 1.0 is 100% vertical velocity preserved
const SPIN_EFFECT = 0.2 // 0.2 is nice 0.3 for a really spin-heavy game

const TARGET_SCORE = 7
const MIN_VICTORY_DELTA = 2

let leftScore = 0, rightScore = 0
let leftPlayer, rightPlayer
let ball

let leftIdleAnimation
let leftJumpAnimation
let leftFallAnimation
let rightIdleAnimation
let rightJumpAnimation
let rightFallAnimation
let ballAnimation

// Note: Everything that loads images needs to be called in preload,
// and right now that includes adding animations to sprites? So I'm also
// creating sprites in preload.
function preload() {
  leftPlayer = createSprite(20, GAME_HEIGHT / 2, PLAYER_WIDTH, PLAYER_HEIGHT)
  leftPlayer.addAnimation('left player idle', "./left_idle.png")
  leftPlayer.addAnimation('left player jump', "./left_jump.png")
  leftPlayer.addAnimation('left player fall', "./left_fall.png")

  rightPlayer = createSprite(GAME_WIDTH - 20, GAME_HEIGHT / 2, PLAYER_WIDTH, PLAYER_HEIGHT)  
  rightPlayer.addAnimation('right player idle', "./right_idle.png")
  rightPlayer.addAnimation('right player jump', "./right_jump.png")
  rightPlayer.addAnimation('right player fall', "./right_fall.png")

  ball = createSprite(GAME_WIDTH / 2, GAME_HEIGHT / 2, 10, 10)
  ball.addAnimation('ball', "./ball.png")

  // This game uses our own super-simple physics.
  leftPlayer.collider = 'none'
  rightPlayer.collider = 'none'
  ball.collider = 'none'
}

function setup() {
  frameRate(60)
  createCanvas(GAME_WIDTH, GAME_HEIGHT)
  autoDrawSprites = false

  setAnimationIfChanged(leftPlayer, 'left player idle')
  setAnimationIfChanged(rightPlayer, 'right player idle')

  waitForReady()
}

let currentDrawFunction
function draw() {
  currentDrawFunction()
}

let leftReady, rightReady
function waitForReady() {
  leftReady = false
  rightReady = false
  leftScore = 0
  rightScore = 0
  leftPlayer.velocity.y = 0
  rightPlayer.velocity.y = 0
  leftPlayer.y = GAME_HEIGHT / 2
  rightPlayer.y = GAME_HEIGHT / 2
  currentDrawFunction = waitForReadyDrawFunction
}

function waitForReadyDrawFunction() {
  if (kb.pressing('a')) {
    leftReady = true
  }
  
  if (kb.pressing('l')) {
    rightReady = true
  }
  
  if (leftReady && rightReady) {
    startCountdown()
  }
  
  drawBackground()
  allSprites.draw()
  drawWaitForReadyHUD()
}

var countdownRemaining, ticksRemainingInCount
function startCountdown() {
  countdownRemaining = 3
  ticksRemainingInCount = 30
  currentDrawFunction = countdownDrawFunction
}

function countdownDrawFunction() {
  ticksRemainingInCount--
  if (ticksRemainingInCount <= 0) {
    ticksRemainingInCount = 30
    countdownRemaining--
    if (countdownRemaining <= 0) {
      startGame()
    }
  }
  updatePlayer(leftPlayer, 'left player', 1, 'a')
  updatePlayer(rightPlayer, 'right player', 1, 'l')
  
  drawBackground()
  allSprites.draw()
  drawCountdownHUD()
}

function startGame() {
  if (random([1, 2]) === 1) {
    resetBall(1)
  } else {
    resetBall(-1)
  }
  currentDrawFunction = gameplayDrawFunction
}

function gameplayDrawFunction() {
  updatePlayer(leftPlayer, 'left player', 1, 'a')
  updatePlayer(rightPlayer, 'right player', 1, 'l')
  updateBall()
  if (leftScore >= TARGET_SCORE && leftScore - rightScore >= MIN_VICTORY_DELTA
      || rightScore >= TARGET_SCORE && rightScore - leftScore >= MIN_VICTORY_DELTA) {
    endGame()
  }
  
  drawBackground()
  allSprites.draw()
  drawHUD()
}

function updatePlayer(sprite, animPrefix, direction, key) {
  if (kb.pressing(key)) {
    sprite.velocity.y = -6
  } else {
    sprite.velocity.y += 0.4
  }
  if (sprite.y > GROUND_Y_POS - PLAYER_HALF_HEIGHT) {
    sprite.y = GROUND_Y_POS - PLAYER_HALF_HEIGHT
    sprite.velocity.y = 0
  } else if (sprite.y < PLAYER_HALF_HEIGHT) {
    sprite.y = PLAYER_HALF_HEIGHT
    sprite.velocity.y = 0
  }
  
  if (sprite.velocity.y < -1) {
    setAnimationIfChanged(sprite, animPrefix + ' jump')
  } else if (sprite.velocity.y > 1) {
    setAnimationIfChanged(sprite, animPrefix + ' fall')
  } else {
    setAnimationIfChanged(sprite, animPrefix + ' idle')
  }
}

function setAnimationIfChanged(sprite, name) {
  if (sprite.currentAnimationName !== name) {
    sprite.currentAnimationName = name
    sprite.changeAnimation(name)
  }
}

function updateBall() {
  ball.velocity.y += 0.1
  // Bounce off floor and ceiling
  if (ball.y > GROUND_Y_POS - BALL_HALF_SIZE) {
    ball.y = GROUND_Y_POS - BALL_HALF_SIZE
    ball.velocity.y *= -BALL_BOUNCINESS
    
    // Account for spin on bounce
    var spinEffect = ball.rotationSpeed * SPIN_EFFECT
    ball.velocity.x += spinEffect
    ball.rotationSpeed -= spinEffect
  } else if (ball.y < BALL_HALF_SIZE) {
    ball.y = BALL_HALF_SIZE
    ball.velocity.y *= -1
  }
  
  // Bounce off players
  if (ball.x < leftPlayer.x + PLAYER_HALF_WIDTH &&
      ball.x > leftPlayer.x &&
      ball.y + BALL_HALF_SIZE > leftPlayer.y - PLAYER_HALF_HEIGHT &&
      ball.y - BALL_HALF_SIZE < leftPlayer.y + PLAYER_HALF_HEIGHT) {
    ball.x = leftPlayer.x + PLAYER_HALF_WIDTH
    ball.velocity.x *= -(1 + BALL_ACCELERATION_FACTOR)
    ball.velocity.y = leftPlayer.velocity.y
    ball.rotationSpeed += -leftPlayer.velocity.y
  } else if (ball.x > rightPlayer.x - PLAYER_HALF_WIDTH &&
      ball.x < rightPlayer.x &&
      ball.y + BALL_HALF_SIZE > rightPlayer.y - PLAYER_HALF_HEIGHT &&
      ball.y - BALL_HALF_SIZE < rightPlayer.y + PLAYER_HALF_HEIGHT) {
    ball.x = rightPlayer.x - PLAYER_HALF_WIDTH
    ball.velocity.x *= -(1 + BALL_ACCELERATION_FACTOR)
    ball.velocity.y = rightPlayer.velocity.y
    ball.rotationSpeed += rightPlayer.velocity.y
  }
  
  // Score point if beyond boundary
  if (ball.x < -BALL_HALF_SIZE) {
    rightScore++
    resetBall(1)
  } else if (ball.x > GAME_WIDTH + BALL_HALF_SIZE) {
    leftScore++
    resetBall(-1)
  }
}

function endGame() {
  // Move the ball offscreen
  ball.y = -BALL_SIZE
  currentDrawFunction = endGameDrawFunction
}

function endGameDrawFunction() {
  updatePlayer(leftPlayer, 'left player', 1, 'a')
  updatePlayer(rightPlayer, 'right player', 1, 'l')
  
  if (kb.pressing('r')) {
    waitForReady()
  }
  
  drawBackground()
  allSprites.draw()
  drawEndGameHUD()
}

function resetBall(direction) {
  if (direction === 1) {
    ball.x = SERVE_INSET_POSITION
  } else {
    ball.x = GAME_WIDTH - SERVE_INSET_POSITION
  }
  ball.y = GROUND_Y_POS - 100
  ball.velocity.x = SERVE_SPEED_X * direction
  ball.velocity.y = -1 + -2 * Math.random()
  ball.rotationSpeed = 0
}


function drawBackground() {
  background('white')
  fill('#0a0')
  noStroke()
  rect(0, GROUND_Y_POS, GAME_WIDTH, GROUND_HEIGHT)
}

function drawWaitForReadyHUD() {
  textFont('sans')
  
  stroke('black')
  fill('black')
  textSize(20)
  textAlign(CENTER, CENTER)
  text('TENNIS JUMP', 0, 20, GAME_WIDTH, 20)
  textSize(16)
  text('Play to ' + TARGET_SCORE, 0, 54, GAME_WIDTH, 16)
  if (MIN_VICTORY_DELTA > 1) {
    text('Must win by ' + MIN_VICTORY_DELTA, 0, 80, GAME_WIDTH, 16)
  }
  
  stroke(leftReady ? 'red' : 'black')
  fill(leftReady ? 'red' : 'black')
  textSize(leftReady ? 24 : 18)
  textAlign(LEFT, BOTTOM)
  text(leftReady ? 'READY!' : 'Ready?', 10, GAME_HEIGHT / 2 - 50, 180, 30)
  
  stroke(rightReady ? 'blue' : 'black')
  fill(rightReady ? 'blue' : 'black')
  textSize(rightReady ? 24 : 18)
  textAlign(RIGHT, BOTTOM)
  text(rightReady ? 'READY!' : 'Ready?', GAME_WIDTH - 190, GAME_HEIGHT / 2 - 50, 180, 30)
  
  drawActionText('READY')
}

var displayedCountdown, fontSize = 40
function drawCountdownHUD() {
  if (countdownRemaining != displayedCountdown) {
    displayedCountdown = countdownRemaining
    fontSize = 100
  } else {
    fontSize--
  }
  
  if (fontSize > 0) {
    textFont('sans')
    stroke('black')
    fill('black')
    textSize(fontSize)
    textAlign(CENTER, CENTER)
    text(displayedCountdown, 0, 0, GAME_WIDTH, GAME_HEIGHT)
  }
  
  drawScores()
  drawActionText('JUMP')
}

function drawHUD() {
  drawScores()  
  drawActionText('JUMP')
  
  // Show 'MATCH POINT' text if the next point could win
  if (leftScore + 1 >= TARGET_SCORE && leftScore + 1 - rightScore >= MIN_VICTORY_DELTA
      || rightScore + 1 >= TARGET_SCORE && rightScore + 1 - leftScore >= MIN_VICTORY_DELTA) {
    drawTopCenterText('MATCH POINT')
  }
}

var oscillator = 20
function drawEndGameHUD() {
  oscillator--
  if (oscillator <= -20) {
    oscillator = 20
  }
  
  var leftWins = leftScore > rightScore
  textFont('sans')
  stroke(leftWins ? 'red' : 'blue')
  fill(leftWins ? 'red' : 'blue')
  textSize(40 + Math.abs(oscillator))
  textAlign(CENTER, CENTER)
  text((leftWins ? 'RED' : 'BLUE') + ' WINS', 0, 0, GAME_WIDTH, GROUND_Y_POS)
 
  stroke('black')
  fill('black')
  textAlign(CENTER, CENTER)
  textSize(16)
  text('Press "R" to restart', 0, GAME_HEIGHT / 2, GAME_WIDTH, 16)
    
  drawScores()
  drawTopCenterText('FINAL SCORE')
}

function drawScores() {
  // Draw scores in corners
  textFont('sans')
  textSize(20)
  stroke('red')
  fill('red')
  textAlign(LEFT, TOP)
  text(leftScore, 10, 10, 100, 100)
  stroke('blue')
  fill('blue')
  textAlign(RIGHT, TOP)
  text(rightScore, GAME_WIDTH - 110, 10, 100, 100)
}

function drawTopCenterText(txt) {
  textFont('sans')
  textSize(20)
  stroke('black')
  fill('black')
  textAlign(CENTER, TOP)
  text(txt, 0, 10, GAME_WIDTH, 20)
}

function drawActionText(actionText) {
  textFont('sans')
  stroke('white')
  fill('white')
  textSize(18)
  textAlign('left', 'bottom')
  text("A : " + actionText, 10, GAME_HEIGHT - 30, 180, 20)
  textAlign('right', 'bottom')
  text(actionText + " : L", GAME_WIDTH - 190, GAME_HEIGHT - 30, 180, 20)
}
