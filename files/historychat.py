from google import genai
import apikey

client = genai.Client(api_key=apikey.API_KEY)

chat = client.chats.create(model="gemini-2.0-flash")
while True:
    x = input("User: ")
    response = chat.send_message(x)
    print(response.text)
    # response = chat.send_message("How many paws are in my house?")
    # print(response.text)
    # last_message = chat._curated_history[-1]
    # print(last_message)
        # print(message)
        
        
