import requests
import tempfile
import os
from pytesseract import image_to_string
from pdf2image import convert_from_path
import google.generativeai as genai
from google.generativeai.types.generation_types import GenerationConfig
from dotenv import load_dotenv
import json
import openai
from prisma import Prisma

db = Prisma()
db.connect()

load_dotenv()
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))
gemini_model = genai.GenerativeModel("gemini-2.0-flash")
cf_url = (
    f"https://api.cloudflare.com/client/v4/accounts/{os.getenv("CF_ACCOUNT_ID")}/ai/v1"
)
cf_model_name = "@cf/mistral/mistral-7b-instruct-v0.2-lora"
cf_client = openai.Client(api_key=os.getenv("CF_API_KEY"), base_url=cf_url)


def parse_resume(url):
    resume_data = requests.get(url)
    with tempfile.NamedTemporaryFile(suffix=".pdf", delete=False) as temp_pdf_file:
        temp_pdf_file.write(resume_data.content)
        temp_pdf_path = temp_pdf_file.name
    images = convert_from_path(temp_pdf_path)
    text_content = ""
    for image in images:
        image = image.point(lambda x: 0 if x < 100 else 255)
        text = image_to_string(image)
        text_content += text
    if temp_pdf_path:
        os.remove(temp_pdf_path)
    return text_content


def ask_ai_model_gemini(prompt):
    response = gemini_model.generate_content(
        prompt,
        generation_config=GenerationConfig(
            response_mime_type="application/json",
        ),
    )
    return json.loads(response.text)


def ask_ai_model_cf(prompt):
    response = cf_client.beta.chat.completions.parse(
        model=cf_model_name,
        messages=[
            {
                "role": "user",
                "content": prompt,
            }
        ],
        max_completion_tokens=100000,
        max_tokens=100000,
    )
    try:
        return json.loads(
            response.choices[0].message.content.strip("```").replace("\n", "")
        )
    except Exception as e:
        print(e)
        print(response.choices[0].message.content)
        return None


def push_to_db(id, analysis, question_answer):
    res = db.resumeanalysis.create(
        {
            "interviewId": id,
            "analysis": analysis.get("analysis"),
            "rating": analysis.get("rating"),
        },
    )

    print(question_answer)
    for qa in question_answer:
        res = db.questionanswer.create(
            {
                "interviewId": id,
                "question": qa.get("question"),
                "answer": qa.get("answer"),
                "expectedAnswer": qa.get("answer"),
            }
        )
        print(res)

    db.interview.update(
        {
            "state": "PROCESSED",
        },
        {
            "id": id,
        },
    )
    return res


def push_error_to_db(id):
    db.interview.update(
        {
            "state": "ERROR",
        },
        {
            "id": id,
        },
    )
