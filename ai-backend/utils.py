import os
import google.generativeai as genai
from google.generativeai.types.generation_types import GenerationConfig
from dotenv import load_dotenv
import json
from generated.prisma_client import Prisma
import re
from redis import Redis
from mistralai import Mistral
import random

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


async def prompt_ai_model(prompt: str) -> dict:
    response = await gemini_model.generate_content_async(
        prompt,
        generation_config=GenerationConfig(
            response_mime_type="application/json",
        ),
    )
    return json.loads(response.text)


async def get_code_problems(difficulty: str) -> list[str]:
    if difficulty not in ["EASY", "MEIDUM", "HARD"]:
        raise "Invalid difficulty - " + difficulty
    problems = await db.codeproblem.find_many(
        where={"difficulty": difficulty},
    )
    if len(problems) < 3:
        raise "Not enough problems to choose from"
    problems = random.choices(problems, k=3)
    problems = list(map(lambda x: x.id, problems))
    return problems


async def get_interview_responses(interview_id: str) -> dict:
    interview = await db.interview.find_unique(
        {"id": interview_id},
        include={"questionAnswer": True, "interviewCodeProblems": True},
    )
    code_submissions = {}
    for code_problem in interview.interviewCodeProblems:
        code_submissions[code_problem.codeProblemId] = await db.codeproblem.find_first(
            where={"id": code_problem.codeProblemId},
            include={
                "submissions": {
                    "where": {"success": True, "interviewId": interview_id},
                    "order_by": {"execTime": "asc"},
                    "take": 1,
                },
            },
        )
        code_submissions[code_problem.codeProblemId] = json.loads(
            code_submissions[code_problem.codeProblemId].model_dump_json()
        )
    interview = json.loads(interview.model_dump_json())
    interview["code"] = code_submissions
    return interview


async def push_to_db(
    id: str, analysis: dict, question_answer: list[int], code_problems: list[str]
) -> None:
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

    await db.interviewcodeproblem.create_many(
        data=[
            {"codeProblemId": problem_id, "interviewId": id}
            for problem_id in code_problems
        ]
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


async def set_interview_result_state(id: str, status: str) -> None:
    await db.interview.update(
        where={"id": id},
        data={
            "resultState": status,
        },
    )


async def push_analysis_to_db(qa_analysis, code_analysis, id):
    qa_analysis_records = [
        {
            "correctness": qa.get("correctness"),
            "explanation": qa.get("explanation"),
            "questionAnswerId": qa.get("id"),
            "interviewId": id,
        }
        for qa in qa_analysis
    ]
    await db.qaanalysis.create_many(data=qa_analysis_records)

    code_analysis_records = [
        {
            "review": code.get("review"),
            "codeProblemId": code.get("id"),
            "interviewId": id,
        }
        for code in code_analysis
    ]
    await db.codeanalysis.create_many(data=code_analysis_records)

    await set_interview_result_state(id, "PROCESSED")
