import os
import google.generativeai as genai
from google.generativeai.types.generation_types import GenerationConfig
from dotenv import load_dotenv
import json
from generated.prisma_client import Prisma
import re
from redis import Redis
from mistralai import Mistral

db = Prisma()

load_dotenv()
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))
gemini_model = genai.GenerativeModel("gemini-2.0-flash")
mistral_client = Mistral(api_key=os.getenv("MISTRAL_API_KEY"))


drive_regex = re.compile(r"https://drive.google.com/file/d/(.*)/view")


async def init_db():
    await db.connect()


async def parse_resume(url: str, redis_client: Redis = None) -> str:
    if "google.com" in url:
        url = await get_drive_download_url(url)
    cache_key = f"resume:contents:{url}"
    if redis_client and redis_client.exists(cache_key):
        return redis_client.get(cache_key).decode("utf-8")
    response = await mistral_client.ocr.process_async(
        model="mistral-ocr-latest",
        document={
            "type": "document_url",
            "document_url": url,
        },
    )
    text_content = "\n".join([x.markdown for x in response.pages])
    if redis_client:
        redis_client.set(cache_key, text_content, ex=3 * 60 * 60)
    return text_content


async def get_drive_download_url(url: str) -> str:
    groups = drive_regex.match(url).groups()
    if len(groups) < 1:
        raise Exception("Invalid drive URL")
    return f"https://www.googleapis.com/drive/v3/files/{groups[0]}?key={os.getenv('GDRIVE_API_KEY')}&alt=media"


async def ask_ai_model_gemini(prompt: str) -> dict:
    response = await gemini_model.generate_content_async(
        prompt,
        generation_config=GenerationConfig(
            response_mime_type="application/json",
        ),
    )
    return json.loads(response.text)


async def push_to_db(id: str, analysis: dict, question_answer: list) -> None:
    res = await db.resumeanalysis.create(
        {
            "interviewId": id,
            "analysis": analysis.get("analysis"),
            "rating": analysis.get("rating"),
        },
    )

    for qa in question_answer:
        await db.questionanswer.create(
            {
                "interviewId": id,
                "question": qa.get("question"),
                "expectedAnswer": qa.get("answer"),
            }
        )

    await db.interview.update(
        {
            "state": "PROCESSED",
        },
        {
            "id": id,
        },
    )
    return res


async def push_error_to_db(id: str) -> None:
    await db.interview.update(
        {
            "state": "ERROR",
        },
        {
            "id": id,
        },
    )
