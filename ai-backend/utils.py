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
from generated.prisma_client import Prisma
import re

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

drive_regex = re.compile(r"https://drive.google.com/file/d/(.*)/view")


def parse_resume(url):
    if "google.com" in url:
        url = get_drive_download_url(url)
    resume_data = requests.get(url)
    if resume_data.status_code >= 400:
        raise Exception("Invalid URL")
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


def get_drive_download_url(url):
    groups = drive_regex.match(url).groups()
    try:
        print(groups[0])
    except:
        raise Exception("Invalid drive URL")
    return f"https://www.googleapis.com/drive/v3/files/{groups[0]}?key={os.getenv("GDRIVE_API_KEY")}&alt=media"


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
