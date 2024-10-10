const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Player properties
let player = {
    x: 375,
    y: canvas.height - 100 - 50,  // Start player on the ground
    width: 50,
    height: 50,
    color: 'black',
    speed: 50,
    dy: 0,  // Vertical velocity for jumping
    gravity: 1.5,  // Gravity value that pulls player down
    jumpPower: -20,  // Jump velocity when jumping
    grounded: true  // Is the player on the ground?
};

let coin = {
    x: Math.random() * (canvas.width - 50),
    y: canvas.height - 150,  // Ensure the coin appears above ground
    size: 50
};

let score = 0;  // Initialize score

// Load images for sky, ground, and coin
let skyImage = new Image();
let groundImage = new Image();
let coinImage = new Image();

skyImage.src = '/static/Sky.png';     // Ensure these paths are correct and point to your static folder
groundImage.src = '/static/ground.png';
coinImage.src = '/static/coin.png';

// Ensure images are loaded before drawing
let imagesLoaded = 0;
const totalImages = 3;

function imageLoaded() {
    imagesLoaded++;
    if (imagesLoaded === totalImages) {
        drawGame();
    }
}

// Add event listeners to check when the images are loaded
skyImage.onload = imageLoaded;
groundImage.onload = imageLoaded;
coinImage.onload = imageLoaded;

function drawGame() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw the sky
    ctx.drawImage(skyImage, 0, 0, canvas.width, canvas.height / 2);

    // Draw the ground
    ctx.drawImage(groundImage, 0, canvas.height - 100, canvas.width, 100);

    // Draw the player
    ctx.fillStyle = player.color;
    ctx.fillRect(player.x, player.y, player.width, player.height);

    // Draw the coin
    ctx.drawImage(coinImage, coin.x, coin.y, coin.size, coin.size);
}

function movePlayer(direction) {
    if (direction === 'left') {
        player.x -= player.speed;
        if (player.x < 0) player.x = 0;
    } else if (direction === 'right') {
        player.x += player.speed;
        if (player.x + player.width > canvas.width) player.x = canvas.width - player.width;
    }
    checkCoinCollision();
    drawGame();
}

function changeColor(color = null) {
    if (color) {
        player.color = color;
    } else {
        player.color = '#' + Math.floor(Math.random() * 16777215).toString(16);
    }
    drawGame();
}

function checkCoinCollision() {
    // Check if player collects the coin
    if (player.x < coin.x + coin.size &&
        player.x + player.width > coin.x &&
        player.y < coin.y + coin.size &&
        player.y + player.height > coin.y) {
        score++;  // Increment score
        document.getElementById('score').innerText = `Score: ${score}`;

        // Move the coin to a new random position
        coin.x = Math.random() * (canvas.width - coin.size);
        coin.y = canvas.height - 150;
    }
}

function jump() {
    if (player.grounded) {  // Only jump if player is on the ground
        player.dy = player.jumpPower;  // Apply jump force
        player.grounded = false;  // Player is now in the air
    }
}

function applyGravity() {
    // Apply gravity and handle jumping logic
    if (!player.grounded) {
        player.y += player.dy;  // Apply vertical velocity
        player.dy += player.gravity;  // Add gravity to vertical velocity

        // Check if player has hit the ground
        if (player.y >= canvas.height - 100 - player.height) {
            player.y = canvas.height - 100 - player.height;  // Reset player to ground level
            player.dy = 0;  // Reset vertical velocity
            player.grounded = true;  // Player is back on the ground
        }
    }
}

function handleCommand(commandInputValue) {
    const command = commandInputValue.toLowerCase();

    // Send the command to the backend for NLP processing
    fetch('/process_command', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ command })
    })
    .then(response => response.json())
    .then(data => {
        const processedCommand = data.command;

        // Clear any previous error message
        document.getElementById('errorMessage').innerText = '';

        if (processedCommand.includes('move left')) {
            movePlayer('left');
        } else if (processedCommand.includes('move right')) {
            movePlayer('right');
        } else if (processedCommand.includes('change color')) {
            const color = processedCommand.split(' ').slice(-1)[0];
            if (color === 'random') {
                changeColor();
            } else {
                changeColor(color);
            }
        } else if (processedCommand.includes('jump')) {
            jump();
        } else {
            // Display error message if command is not recognized
            document.getElementById('errorMessage').innerText = 'Unrecognized command or invalid color. Please try again.';
        }
    });

    document.getElementById('commandInput').value = '';  // Clear input field
}

// Add event listener for the Enter key
document.getElementById('commandInput').addEventListener('keydown', function(event) {
    if (event.key === 'Enter') {
        handleCommand(event.target.value);
    }
});

// Add event listener for the Enter button click
document.getElementById('enterButton').addEventListener('click', function() {
    const commandInputValue = document.getElementById('commandInput').value;
    handleCommand(commandInputValue);
});

// Update game logic and redraw the scene
function updateGame() {
    applyGravity();  // Apply gravity every frame to handle jumping and falling
    drawGame();  // Redraw the game
}

function startSpeechRecognition() {
    const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
    recognition.lang = 'en-US';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.start();

    recognition.onresult = (event) => {
        const speechResult = event.results[0][0].transcript.toLowerCase();
        document.getElementById('commandInput').value = speechResult;  // Display speech result in the input box

        // Send the recognized text to the backend for NLP processing
        fetch('/process_command', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ command: speechResult })
        })
        .then(response => response.json())
        .then(data => {
            const processedCommand = data.command;
            handleCommand(processedCommand);  // Handle the processed command from the backend
        })
        .catch(error => {
            console.error('Error:', error);
            document.getElementById('errorMessage').innerText = 'Error processing command.';
        });
    };

    recognition.onerror = (event) => {
        document.getElementById('errorMessage').innerText = 'Error occurred in speech recognition: ' + event.error;
    };
}

// Add event listener for microphone click
document.getElementById('microphoneIcon').addEventListener('click', startSpeechRecognition);

// Run the updateGame function repeatedly at a set interval
setInterval(updateGame, 30);  // Call updateGame 30 times per second
