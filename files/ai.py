from google import genai
import apikey

client = genai.Client(api_key=apikey.API_KEY)
MODEL = "gemini-2.0-flash"


def get_response(text):
    response = client.models.generate_content(
        model=MODEL,
        contents=text,
    )
    return response.text
