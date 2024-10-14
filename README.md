# Web-Based Game with NLP and Voice Commands

## Project Overview

This is a web-based game developed using Flask and JavaScript, with **NLP** and **spell correction** for processing text commands. The player controls a character by entering commands via text or voice, and the game supports both **English** and **Danish** commands. Commands include actions like moving the character left, right, jumping, and changing the color of the character. The game integrates external libraries such as `spaCy`, `TextBlob`, and `SpellChecker` for **NLP processing**, **typo correction**, and **language detection**.

## Features

- **Multilingual Support**: The game can process commands in both **English** and **Danish**.
- **NLP-based Command Processing**: Uses NLP to recognize and process player commands. It handles **synonyms** and **typos** in both languages.
- **Voice Commands**: Players can input commands using **speech recognition** in **English**.
- **Dynamic Gameplay**: The character can move left, right, jump, or change colors, with smooth updates to the game visuals.
- **Coin Collection**: The player can collect coins, and the **score** is updated in real-time.

## Technologies Used

- **Backend**: Python, Flask
- **NLP Libraries**: `spaCy`, `TextBlob`, `SpellChecker`
- **Frontend**: HTML, JavaScript, CSS
- **Speech Recognition**: Integrated using native web APIs for voice input
- **Graphics**: Canvas API for rendering the game and player movement

## Installation

### Prerequisites

- **Python 3.x**
- **Flask**
- **spaCy** and **English language model** (`en_core_web_sm`)
- **TextBlob**
- **pyspellchecker**

### Setup

1. Clone the repository:
   ```bash
   git clone https://github.com/your-repo-link
   cd your-repo-folder
