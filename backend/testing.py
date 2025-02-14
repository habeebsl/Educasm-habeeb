import os
from openai import OpenAI
from dotenv import load_dotenv
from prompts.openai_prompts import get_user_prompt, SYSTEM_PROMPT


load_dotenv()
print(os.getenv("OPENAI_API_KEY"))
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
messages = [
    {"role": "system", "content": SYSTEM_PROMPT}
]
messages.append({"role": "user", "content": get_user_prompt("Quantum physics", 18)})

stream = client.chat.completions.create(
    model="gpt-3.5-turbo",
    messages=messages,
    max_tokens=2000,
    temperature=0.7,
    response_format={"type": "json_object"},
    stream=True
)

full_content = ""
for chunk in stream:
    if chunk.choices[0].delta.content is not None:
        content_piece = chunk.choices[0].delta.content
        full_content += content_piece
        print(full_content)