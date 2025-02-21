from google import genai
from apikey import API_KEY
client = genai.Client(api_key=API_KEY)

response = client.models.generate_content_stream(
    model="gemini-2.0-flash",
    contents=["Explain how AI works"])
for chunk in response:
    print(chunk.text, end="")