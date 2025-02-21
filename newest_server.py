import os
import uuid
import json
import tempfile
import markdown2
from flask import Flask, request, jsonify, render_template, session, redirect, url_for
from google import genai
import PIL.Image

from apikey import API_KEY

app = Flask(__name__)
app.secret_key = "some_random_secret_key"  # Needed for sessions

# Gemini client & model
client = genai.Client(api_key=API_KEY)
MODEL = "gemini-2.0-flash"

# Directory to store chat histories, one file per user
CHAT_DIR = "chats"
os.makedirs(CHAT_DIR, exist_ok=True)

#####################
# Utility Functions #
#####################


def markdownify(text):
    """
    Convert text to HTML via markdown2.
    Includes code block support with fenced-code-blocks.
    """
    return markdown2.markdown(text, extras=["fenced-code-blocks"])


def load_chat_history(username):
    """
    Load the user's chat history from a JSON file in CHAT_DIR.
    Returns a list of messages: [{"role": "user"|"assistant", "content": "..."}]
    """
    filepath = os.path.join(CHAT_DIR, f"{username}.json")
    if not os.path.exists(filepath):
        return []
    with open(filepath, "r", encoding="utf-8") as f:
        return json.load(f)


def save_chat_history(username, history):
    """
    Save the user's chat history (list of messages) to a JSON file in CHAT_DIR.
    """
    filepath = os.path.join(CHAT_DIR, f"{username}.json")
    with open(filepath, "w", encoding="utf-8") as f:
        json.dump(history, f, ensure_ascii=False, indent=2)


def rebuild_chat_from_history(history):
    """
    Rebuild a chat object from a list of messages.
    We create a new chat object, then send each message in turn.
    This ensures the conversation context is preserved.
    """
    chat_obj = client.chats.create(model=MODEL)
    for msg in history:
        if msg["role"] == "user":
            # The user's text or multimodal input
            chat_obj.send_message(msg["content"])
        else:
            # The model's response
            # We do nothing special here, because the conversation context
            # is built from user messages. The model's responses are not re-sent
            # as new prompts. Alternatively, you could store them as well if needed.
            pass
    return chat_obj


##############################
# Authentication In-Memory   #
# (Not production-ready!)    #
##############################

# For simplicity, store user credentials in a dict {username: password}
# In production, use a DB with hashed passwords (e.g., bcrypt)
users = {}


@app.route("/register", methods=["GET", "POST"])
def register():
    if request.method == "POST":
        username = request.form["username"]
        password = request.form["password"]
        if username in users:
            return "Username already taken."
        # Save to the in-memory dict
        users[username] = password
        # Optionally, create an empty chat file
        save_chat_history(username, [])
        return redirect(url_for("login"))
    return render_template("register.html")


@app.route("/login", methods=["GET", "POST"])
def login():
    if request.method == "POST":
        username = request.form["username"]
        password = request.form["password"]
        if username in users and users[username] == password:
            # Set session
            session["username"] = username
            return redirect(url_for("index"))
        return "Invalid credentials."
    return render_template("login.html")


@app.route("/logout")
def logout():
    session.clear()
    return redirect(url_for("login"))


###########################
# Main Chat App Endpoints #
###########################


@app.route("/")
def index():
    if "username" not in session:
        return redirect(url_for("login"))
    return render_template("index.html")


@app.route("/chat", methods=["POST"])
def chat():
    """
    Multi-turn chat endpoint:
    1) Load user chat history from disk
    2) Rebuild the chat object
    3) Send new message
    4) Save updated conversation
    5) Return response
    """
    if "username" not in session:
        return jsonify({"response": "Please log in first."}), 401

    username = session["username"]

    # 1) Load existing chat history
    history = load_chat_history(username)

    # 2) Rebuild chat object from user messages
    chat_obj = rebuild_chat_from_history(history)

    # 3) Handle new message
    text = request.form.get("text", "")
    image = request.files.get("image")
    audio = request.files.get("audio")

    # Collect content for new user message
    contents = []
    if text:
        contents.append(text)
    if image and image.filename:
        pil_img = PIL.Image.open(image)
        contents.append(pil_img)
    if audio and audio.filename:
        file_ext = os.path.splitext(audio.filename)[1]
        with tempfile.NamedTemporaryFile(delete=False, suffix=file_ext) as tmp:
            audio.save(tmp.name)
            tmp_path = tmp.name
        # Upload to Gemini
        myfile = client.files.upload(file=tmp_path)
        os.remove(tmp_path)
        contents.append(myfile)

    # If nothing to send
    if not contents:
        return jsonify({"response": "No valid input provided."})

    # Send user's new message
    # Note: chat_obj.send_message expects text or [text, image, ...] etc.
    response = chat_obj.send_message(contents)

    # 4) Update history with the new user message & model response
    #    We'll store text or references for the user content.
    #    For images/audio, we might store "image uploaded" or "audio uploaded"
    #    in the conversation, or the actual path if needed.
    user_message = {
        "role": "user",
        "content": contents,  # This could be a list of text/image references
    }
    assistant_message = {"role": "assistant", "content": response.text}
    history.append(user_message)
    history.append(assistant_message)
    save_chat_history(username, history)

    # 5) Return the model's response as markdown
    response_html = markdownify(response.text)
    return jsonify({"response": response_html})


if __name__ == "__main__":
    app.run(debug=True)
