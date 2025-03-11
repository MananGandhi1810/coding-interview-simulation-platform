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
from redis import Redis
from mistralai import Mistral

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
mistral_client = Mistral(api_key=os.getenv("MISTRAL_API_KEY"))

drive_regex = re.compile(r"https://drive.google.com/file/d/(.*)/view")


def parse_resume(url: str, redis_client: Redis = None) -> str:
    if "google.com" in url:
        url = get_drive_download_url(url)
    cache_key = f"resume:contents:{url}"
    if redis_client and redis_client.exists(cache_key):
        return redis_client.get(cache_key)
    response = mistral_client.ocr.process(
        model="mistral-ocr-latest",
        document={
            "type": "document_url",
            "document_url": url,
        },
    )
    text_content = "\n".join([x.markdown for x in response.pages])
    redis_client.set(cache_key, text_content, ex=3 * 60 * 60)
    return text_content


def get_drive_download_url(url: str) -> str:
    groups = drive_regex.match(url).groups()
    if len(groups) < 1:
        raise Exception("Invalid drive URL")
    return f"https://www.googleapis.com/drive/v3/files/{groups[0]}?key={os.getenv("GDRIVE_API_KEY")}&alt=media"


def ask_ai_model_gemini(prompt: str) -> dict:
    response = gemini_model.generate_content(
        prompt,
        generation_config=GenerationConfig(
            response_mime_type="application/json",
        ),
    )
    return json.loads(response.text)


def ask_ai_model_cf(prompt: str) -> dict:
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
        return None


def ask_ai_model_mistral(prompt: str) -> dict:
    res = mistral_client.chat.complete(
        model="mistral-small-latest",
        messages=[
            {
                "content": prompt,
                "role": "user",
            },
        ],
        stream=False,
        response_format={
            "type": "json_object",
        },
    )
    try:
        return json.loads(res.choices[0].message.content.strip("```").replace("\n", ""))
    except Exception as e:
        print(e)
        return None


def push_to_db(id: str, analysis: str, question_answer: list) -> None:
    res = db.resumeanalysis.create(
        {
            "interviewId": id,
            "analysis": analysis.get("analysis"),
            "rating": analysis.get("rating"),
        },
    )

    for qa in question_answer:
        res = db.questionanswer.create(
            {
                "interviewId": id,
                "question": qa.get("question"),
                "expectedAnswer": qa.get("answer"),
            }
        )

    db.interview.update(
        {
            "state": "PROCESSED",
        },
        {
            "id": id,
        },
    )
    return res


def push_error_to_db(id: str) -> None:
    db.interview.update(
        {
            "state": "ERROR",
        },
        {
            "id": id,
        },
    )
