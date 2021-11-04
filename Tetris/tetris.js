
const CANVAS = document.querySelector('#tetris')    // Access the canvas element
const CONTEXT = CANVAS.getContext('2d')             // Get the context
CONTEXT.scale(20, 20)                               // Scale the contexts
const ARENA = createMatrix(12, 20)                  // Tetris arena configuration
let dropInterval = 1000                             // Time steps (milliseconds) to drop the pieces
let dropCounter = 0
let lastTime = 0
let pause = 0


// Player configuration
const PLAYER = {
    position: { x: 0, y: 0 },
    matrix: null,
    score: 0
}

// Array to randomize colors of pieces
const COLORS = [
    null,
    '#FF0D72',
    '#0DC2FF',
    '#0DFF72',
    '#F538FF',
    '#FF8E0D',
    '#FFE138',
    '#3877FF'
]

function arenaSweep() {
    let rowCount = 1
    outer: for (let y = ARENA.length - 1; y > 0; --y) {
        for (let x = 0; x < ARENA[y].length; ++x) {
            if (ARENA[y][x] === 0)
                continue outer
        }

        const row = ARENA.splice(y, 1)[0].fill(0)
        ARENA.unshift(row)
        ++y

        PLAYER.score += rowCount * 10
        rowCount *= 2
    }
}

// Detecting if pieces collides on 
function collide(arena, player) {
    // Break player matrix into player position
    const [m, offset] = [player.matrix, player.position]
    for (let y = 0; y < m.length; ++y) {
        for (let x = 0; x < m[y].length; ++x) {
            // If undefined == if true
            if (m[y][x] !== 0 &&
                (arena[y + offset.y] && // Make sure arena row exists
                    arena[y + offset.y][x + offset.x]) !== 0) { // Make sure column exists
                return true
            }
        }
    }
    return false
}

// Function to create tetris arena and mapping game
function createMatrix(w, h) {
    const matrix = []

    // While height is not 0, decrement 1
    while (h--) {
        // Create a matrix with W length and fill it with 0 
        matrix.push(new Array(w).fill(0))
    }
    return matrix
}

// Function to create tetris pieces
function createPiece(type) {
    if (type === 'S') {
        return [
            [0, 1, 1],
            [1, 1, 0],
            [0, 0, 0]
        ]
    } else if (type === 'Z') {
        return [
            [2, 2, 0],
            [0, 2, 2],
            [0, 0, 0]
        ]
    } else if (type === 'L') {
        return [
            [0, 3, 0],
            [0, 3, 0],
            [0, 3, 3]
        ]
    } else if (type === 'J') {
        return [
            [0, 4, 0],
            [0, 4, 0],
            [4, 4, 0]
        ]
    } else if (type === 'I') {
        return [
            [0, 5, 0, 0],
            [0, 5, 0, 0],
            [0, 5, 0, 0],
            [0, 5, 0, 0]
        ]
    } else if (type === 'O') {
        return [
            [6, 6],
            [6, 6]
        ]
    } else if (type === 'T') {
        return [
            [7, 7, 7],
            [0, 7, 0],
            [0, 0, 0]
        ]
    }
}

// Drawing the game
function draw() {
    // Drawing the context on the DOM
    CONTEXT.fillStyle = "#000000"
    CONTEXT.fillRect(0, 0, CANVAS.width, CANVAS.height)

    // Create a piece
    drawPieces(ARENA, { x: 0, y: 0 })
    drawPieces(PLAYER.matrix, PLAYER.position)
}

// Drawing the piece
function drawPieces(piece, move) {
    piece.forEach((row, y) => {
        row.forEach((value, x) => {
            // Check if value isn't 0
            if (value !== 0) {
                CONTEXT.fillStyle = COLORS[value]   // Define colors of pieces
                CONTEXT.fillRect(x + move.x, y + move.y, 1, 1)  // Drawing pieces and set the movement 
            }
        })
    })
}

// Copy the values from player into tetris arena at correct position
function merge(arena, player) {
    player.matrix.forEach((row, y) => {
        row.forEach((value, x) => {
            if (value !== 0) {
                arena[y + player.position.y][x + player.position.x] = value
            }
        })
    })
}

function playerDrop() {
    PLAYER.position.y++
    if (collide(ARENA, PLAYER)) {
        PLAYER.position.y--

        // Put the piece position on the tetris arena
        merge(ARENA, PLAYER)

        // Drop down a different random pieces
        playerReset()

        arenaSweep()

        // Updatig div score element
        updateScore()
    }
    dropCounter = 0
}

// Check if pieces collide or not with another pieces or limit of arena
function playerMove(dir) {
    PLAYER.position.x += dir

    if (collide(ARENA, PLAYER))
        PLAYER.position.x -= dir
}

// Create a random pieces
function playerReset() {
    const pieces = 'IJLOTZZ'    // List type string of pieces 

    // Creating random pieces and set up on a player configuration
    PLAYER.matrix = createPiece(pieces[pieces.length * Math.random() | 0])
    PLAYER.position.y = 0   // Set piece position to the top

    // Set pieces on center position
    PLAYER.position.x = (ARENA[0].length / 2 | 0) - (PLAYER.matrix[0].length / 2 | 0)

    // Game Over
    if (collide(ARENA, PLAYER)) {
        ARENA.forEach(row => row.fill(0))
        PLAYER.score = 0
        updateScore()
    }
}

// Function to don't rotate pieces inside the wall
function playerRotate(dir) {
    const pos = PLAYER.position.x
    let offset = 1
    rotate(PLAYER.matrix, dir)

    // Check collision for don't rotate inside the wall
    while (collide(ARENA, PLAYER)) {
        PLAYER.position.x += offset
        offset = -(offset + (offset > 0 ? 1 : -1))

        if (offset > PLAYER.matrix[0].length) {
            rotate(PLAYER.matrix, -dir)
            PLAYER.position.x = pos
            return
        }
    }
}

// Rotate matrix to rotate pieces
function rotate(matrix, dir) {
    /* Transpose: Convert all rows into columns
     * Reverse: Invert each row
     * Transpose + Reverse = ROTATED MATRIX
    */
    for (let y = 0; y < matrix.length; ++y) {
        for (let x = 0; x < y; ++x) {
            // Using a tupple to switch values
            [
                matrix[x][y],
                matrix[y][x],
            ] = [
                    matrix[y][x],
                    matrix[x][y]
                ]
        }
    }

    // Checking direction
    if (dir > 0)
        matrix.forEach(row => row.reverse())
    else
        matrix.reverse()
}

// Updating animation frame ( drop pieces timer | update draw tetris arena )
function update(time = 0) {
    const deltaTime = time - lastTime
    lastTime = time
    dropCounter += deltaTime

    if (dropCounter > dropInterval) {
        playerDrop()
    }
    draw()
    requestAnimationFrame(update)
}

// Updating div score element
function updateScore() {
    document.querySelector('#score').innerText = PLAYER.score
}

// Listen a keyboard controlls in the DOM
document.addEventListener('keydown', event => {
    //console.log(event)
    if (event.key === 'ArrowLeft')
        playerMove(-1)
    else if (event.key === 'ArrowRight')
        playerMove(1)
    else if (event.key === 'ArrowDown')
        playerDrop()
    else if (event.key === ' ')
        playerRotate(-1)
})


// Start tetris
updateScore()
playerReset()
update()