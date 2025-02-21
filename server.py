from google import genai
import PIL.Image
from flask import Flask, request, jsonify, render_template
from apikey import API_KEY
import markdown2  # Converts markdown text to HTML
import tempfile
import os

app = Flask(__name__)
client = genai.Client(api_key=API_KEY)
MODEL = "gemini-2.0-flash"


def markdownify(text):
    return markdown2.markdown(
        text,
    )


@app.route("/")
def index():
    return render_template("index.html")


@app.route("/chat", methods=["POST"])
def chat():
    text = request.form.get("text", "")
    image = request.files.get("image")
    audio = request.files.get("audio")

    if text and not image and not audio:
        response_html = text_response(text)
    elif text and image and not audio:
        response_html = image_response(text, image)
    elif text and audio and not image:
        response_html = audio_response(text, audio)
    elif text and image and audio:
        response_html = function_4(text, image, audio)
    else:
        response_html = markdown2.markdown(
            "Invalid request. Please send text with optional image/audio."
        )

    return jsonify({"response": response_html})


def text_response(text):
    response = client.models.generate_content(
        model=MODEL,
        contents=text,
    )
    return markdown2.markdown(f"{response.text}", extras=["fenced-code-blocks"])
    # return response.text
    # markdownify(response.text)


def image_response(text, image):
    test_image = PIL.Image.open(image)
    response = client.models.generate_content(model=MODEL, contents=[text, test_image])
    return markdown2.markdown(f"{response.text}")
    # return response.text

    # markdownify(response.text)


def audio_response(text, audio):
    # Use a temporary file to store the uploaded audio
    file_ext = os.path.splitext(audio.filename)[1]  # preserve original extension
    with tempfile.NamedTemporaryFile(delete=False, suffix=file_ext) as tmp:
        audio.save(tmp.name)
        tmp_path = tmp.name
    # Upload the file using its temporary path
    myfile = client.files.upload(file=tmp_path)
    # Remove the temporary file
    os.remove(tmp_path)

    response = client.models.generate_content(
        model=MODEL,
        contents=[text, myfile],
    )
    # return markdown2.markdown(f"{response.text}")
    # return response.text
    return markdown2.markdown(f"{response.text}")


def function_4(text, image, audio):
    image_res = image_response(text, image)
    audio_res = audio_response(text, audio)
    return markdown2.markdown(
        f"About Image:\n\t{image_res}\nAbout Audio:\n\t{audio_res}"
    )
    # return f"About Image:\n\t{image_res}\nAbout Audio:\n\t{audio_res}"
    # markdownify(f"About Image:\n\t{image_res}\nAbout Audio:\n\t{audio_res}")


if __name__ == "__main__":
    app.run(debug=True)
