import os
from openai import OpenAI
from dotenv import load_dotenv

load_dotenv()

openApiKey=os.getenv("OPENAI_API_KEY")

client = OpenAI(api_key=openApiKey)

def generate_chat_response(parsed_resume, history, user_message):
    system_prompt = (
        "You are a helpful resume assistant. Analyze the resume structure and suggest improvements "
        "based on job-fit, skill gaps, and clarity. Your output should be UI-friendly."
    )

    summary = f"""
Name: {parsed_resume.get('contact_info', {}).get('full_name')}
Summary: {parsed_resume.get('summary')}
Experience: {[exp.get('position') for exp in parsed_resume.get('work_experience', [])]}
Skills: {[skill.get('name') for skill in parsed_resume.get('technical_skills', {}).get('programming_languages', [])]}
"""

    messages = [{"role": "system", "content": system_prompt}]
    
    for msg in history[-8:]:
        role = "user" if msg["message_type"] == "user" else "assistant"
        messages.append({"role": role, "content": msg["content"]})

    messages.append({
        "role": "user",
        "content": f"{user_message}\n\nResume Summary:\n{summary}"
    })

    response = client.chat.completions.create(
        model="gpt-4",
        messages=messages,
        max_tokens=600,
        temperature=0.7,
    )

    return response.choices[0].message.content
