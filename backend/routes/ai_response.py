import os
import json
from fastapi.responses import StreamingResponse
from openai import OpenAI
from dotenv import load_dotenv
from fastapi import APIRouter
from redis_utils import save_message, get_messages
from schemas import PlayGroundQuestionResquest
from prompts.openai_prompts import (
    get_explore_user_prompt, 
    get_playground_user_prompt, 
    playground_system_prompt, 
    EXPLORE_SYSTEM_PROMPT
)


load_dotenv()
response_router = APIRouter()
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
MODEL = "gpt-3.5-turbo"
TEMPERATURE = 0.7
MAX_TOKENS = 2000
RESPONSE_FORMAT = { "type": "json_object" }


async def generate_openai_stream(session_id: str, prompt: str, age: str):
    try:
        messages = [
            {"role": "system", "content": EXPLORE_SYSTEM_PROMPT}
        ]
        messages += get_messages(session_id)
        messages.append({"role": "user", "content": get_explore_user_prompt(prompt, age)})
        stream = client.chat.completions.create(
            model=MODEL,
            messages=messages,
            max_tokens=MAX_TOKENS,
            temperature=TEMPERATURE,
            stream=True,
            response_format=RESPONSE_FORMAT
        )
        full_response = ""
        current_content = ""
        
        for chunk in stream:
            if chunk.choices[0].delta.content is not None:
                content_piece = chunk.choices[0].delta.content
                full_response += content_piece
                
                try:
                    parsed_json = json.loads(full_response)
                    
                    if 'content' in parsed_json:
                        if isinstance(parsed_json['content'], dict):
                            new_content = "\n\n".join(
                                str(v) for k, v in parsed_json['content'].items()
                                if k.startswith('paragraph') and v
                            )
                        else:
                            new_content = str(parsed_json['content'])
                        
                        if new_content != current_content:
                            current_content = new_content
                            yield "data: " + json.dumps({"content": current_content}) + "\n\n"
                    
                    topics_data = parsed_json.get('relatedTopics') or parsed_json.get('topics')
                    if topics_data:
                        formatted_topics = []
                        for topic in topics_data:
                            formatted_topic = {
                                "topic": topic.get("name", topic.get("topic", "")),
                                "type": topic.get("type", ""),
                                "reason": topic.get("detail", topic.get("reason", ""))
                            }
                            formatted_topics.append(formatted_topic)
                        
                        print("Formatted topics:", formatted_topics)
                        yield "data: " + json.dumps({"topics": formatted_topics}) + "\n\n"
                    
                    questions_data = parsed_json.get('relatedQuestions') or parsed_json.get('questions')
                    if questions_data:
                        formatted_questions = []
                        for question in questions_data:
                            formatted_question = {
                                "question": question.get("text", question.get("question", "")),
                                "type": question.get("type", ""),
                                "context": question.get("detail", question.get("context", ""))
                            }
                            formatted_questions.append(formatted_question)
                        
                        yield "data: " + json.dumps({"questions": formatted_questions}) + "\n\n"
                        
                except json.JSONDecodeError:
                    continue
                except Exception as e:
                    print(f"Error processing chunk: {e}")
                    continue
        
        yield "data: [DONE]\n\n"
        save_message(session_id, "user", prompt)
        save_message(session_id, "assistant", full_response)
        
    except Exception as e:
        print(f"Error in generate_stream: {e}")
        yield f"data: {json.dumps({'error': str(e)})}\n\n"


@response_router.get("/stream")
async def stream_response(session_id: str, prompt: str, age: str):
    stream_data = generate_openai_stream(session_id, prompt, age)
    return StreamingResponse(
        stream_data,
        media_type="text/event-stream"
    )


@response_router.post("/playground/question")
async def generate_playground_question(request: PlayGroundQuestionResquest):
    completion = client.chat.completions.create(
    model=MODEL,
    max_tokens=MAX_TOKENS,
    response_format=RESPONSE_FORMAT,
    temperature=TEMPERATURE,
    messages=[
        {"role": "system", "content": playground_system_prompt(
            request.topic, request.selected_aspect, request.level, request.age
        )},
        {"role": "user", "content": get_playground_user_prompt(
            request.topic, request.level, request.selected_aspect, request.age    
        )},
    ]
    )

    return completion.choices[0].message

