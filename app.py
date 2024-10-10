import spacy
from textblob import TextBlob
from spellchecker import SpellChecker
from flask import Flask, render_template, request, jsonify

app = Flask(__name__)

nlp = spacy.load("en_core_web_sm")

# Initialize Danish spell checker
danish_spellchecker = SpellChecker(language=None)
DANISH_WORDS = {
    "gå", "løb", "hop", "skift", "flyt", "springe", "højre", "venstre", "op", "ned",
    "rød", "grøn", "blå", "gul", "lilla", "orange", "pink", "sort", "hvid", "grå"
}
danish_spellchecker.word_frequency.load_words(DANISH_WORDS)

# Keywords for actions and directions
DIRECTION_KEYWORDS = ["right", "left", "up", "down", "højre", "venstre", "op", "ned"]
ACTION_KEYWORDS = ["move", "go", "step", "run", "walk", "jump", "hop", "leap", "change", "gå", "løb", "hop", "skift", "flyt", "springe"]

# Synonym mappings
ACTION_SYNONYMS = {
    "go": "move", "step": "move", "run": "move", "walk": "move", "hop": "jump", "leap": "jump", "skift": "change",
    "gå": "move", "flyt": "move", "løb": "run", "springe": "jump"
}

DANISH_TO_ENGLISH_DIRECTIONS = {
    "højre": "right",
    "venstre": "left",
    "op": "up",
    "ned": "down"
}

# List of colors in Danish and English
COLOR_KEYWORDS = {
    "rød": (255, 0, 0), "grøn": (0, 255, 0), "blå": (0, 0, 255), "gul": (255, 255, 0), "lilla": (128, 0, 128),
    "orange": (255, 165, 0), "pink": (255, 182, 193), "sort": (0, 0, 0), "hvid": (255, 255, 255), "grå": (200, 200, 200),
    "red": (255, 0, 0), "green": (0, 255, 0), "blue": (0, 0, 255), "yellow": (255, 255, 0), "purple": (128, 0, 128),
    "black": (0, 0, 0), "white": (255, 255, 255), "gray": (200, 200, 200)
}


def detect_language(text):
    """
    Detects if the input is more likely Danish or English based on the presence of known Danish words.
    """
    danish_word_count = sum(1 for word in text.split() if word.lower() in DANISH_WORDS)
    return "danish" if danish_word_count > 0 else "english"


def correct_typo_danish(text):
    """
    Corrects typos in Danish using the pyspellchecker library.
    """
    corrected_words = []
    for word in text.split():
        corrected_word = danish_spellchecker.correction(word)
        corrected_words.append(corrected_word)
    return " ".join(corrected_words)


def correct_typo_with_textblob(text, language):
    """
    Corrects typos based on the identified language.
    If Danish, use the custom Danish spellchecker. If English, use TextBlob.
    """
    if language == "danish":
        return correct_typo_danish(text)
    else:
        return str(TextBlob(text).correct())  # English correction


def get_synonym_action(action):
    """
    Map synonyms (both English and Danish) to standard actions.
    """
    return ACTION_SYNONYMS.get(action, action)  # Return synonym or action


def translate_danish_to_english(action, direction, color):
    """
    Translates Danish action and direction to English equivalent.
    """
    if action in ACTION_SYNONYMS:
        action = get_synonym_action(action)
    if direction in DANISH_TO_ENGLISH_DIRECTIONS:
        direction = DANISH_TO_ENGLISH_DIRECTIONS[direction]
    return action, direction, color


def extract_direction_action_color(doc):
    """
    Extract direction, action, and color based on the user's input.
    """
    direction = None
    action = None
    color = None

    for token in doc:
        if token.text.lower() in ACTION_KEYWORDS or token.text.lower() in ACTION_SYNONYMS:
            action = get_synonym_action(token.text.lower())
        elif token.text.lower() in DIRECTION_KEYWORDS:
            direction = token.text.lower()
        elif token.text.lower() in COLOR_KEYWORDS:
            color = token.text.lower()

    action, direction, color = translate_danish_to_english(action, direction, color)

    return action, direction, color


def normalize_command(input_text):
    """
    Normalize user input to a standard command
    """
    detected_language = detect_language(input_text)

    # Correct any typos in the input based on detected language
    corrected_text = correct_typo_with_textblob(input_text, detected_language)

    doc = nlp(corrected_text.lower().strip())
    action, direction, color = extract_direction_action_color(doc)

    if action == "change" and color:
        return f"change color {color}"
    elif action == "change" and not color:
        return "change color random"

    if action == "jump":
        return "jump"

    if direction and not action:
        if direction == "left":
            return "move left"
        elif direction == "right":
            return "move right"

    if action and direction:
        return f"{action} {direction}"

    return "error: unrecognized command"


@app.route('/')
def index():
    return render_template('index.html')


@app.route('/process_command', methods=['POST'])
def process_command():
    data = request.json
    user_input = data.get("command", "")
    processed_command = normalize_command(user_input)
    return jsonify({"command": processed_command})


if __name__ == '__main__':
    app.run(debug=True)
