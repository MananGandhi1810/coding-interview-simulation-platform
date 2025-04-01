import redis
import json
import asyncio
from utils import (
    parse_resume,
    prompt_ai_model,
    get_code_problems,
    push_to_db,
    push_error_to_db,
    init_db,
)
import time


async def generate_qa(data, redis_client):
    resume_text = await parse_resume(data.get("resumeUrl"), redis_client)
    print(f"Resume of {data.get('name')} parsed")
    prompt = f"""JSON MODE ON
    YOU ARE A RESUME ANALYSIS MODEL AND INTERVIEW QUESTION GENERATION MODEL.
    Also create technical questions and expected answers based on the role, as if you are an interviewer asking those to a candidate.
    ONLY USE JSON, NO other format.
    DO NOT use MarkDown outside the JSON content.
    When replying, ONLY answer in the JSON schema no other output or text outside the JSON.
    The user's name is: {data.get('name')}
    The user is applying for: {data.get('role')} at {data.get('company')}
    The user has an experience of {data.get('yoe')} years
    GIVE FEEDBACK AND CONSTRUCTIVE CRITICISM TO THE USER.
    THE RATING OF THE RESUME MUST BE OUT OF 10.
    This resume is parsed from a PDF file using OCR, so there might be inconsistencies. Consider those when replying.
    Adhere to the role and years of experience and give feedback accordingly.
    Also check if the Resume is tailored to the role the user is applying for.
    For the questions, ask at least 3 concept based questions and 2 resume based questions.
    Create at least 5 interview questions.
    schema:
        - resume_analysis (THIS IS COMPULSORY):
            - analysis: str
            - rating: int
        - question_answer (list):
            - question: str
            - answer: str
    This is the text in the user's resume:
    {resume_text}
    """
    start = time.time()
    qa_response = await prompt_ai_model(prompt)
    qa_response_time = time.time() - start
    print("QA Response Time:", qa_response_time)
    return qa_response


async def generate_code_questions(yoe):
    difficulty = ""
    if yoe <= 3:
        difficulty = "EASY"
    elif yoe > 3 and yoe <= 5:
        difficulty = "MEDIUM"
    else:
        difficulty = "HARD"

    problems = await get_code_problems(difficulty)
    return problems


async def process_message(message, redis_client):
    if message["type"] == "message":
        data = json.loads(message["data"])
        print(f"Received analysis request of {data.get('name')} - {data.get('id')}")
        try:
            qa_response, code_problem_response = await asyncio.gather(
                generate_qa(data, redis_client),
                generate_code_questions(int(data["yoe"])),
            )
            result = await push_to_db(
                data.get("id"),
                qa_response["resume_analysis"],
                qa_response["question_answer"],
                code_problem_response,
            )
        except Exception as e:
            print(e)
            await push_error_to_db(data.get("id"))


async def process_messages():
    tasks = set()
    redis_client = redis.Redis(host="localhost", port=6379, db=0)
    pubsub = redis_client.pubsub()
    pubsub.subscribe("new-interview")
    print(f"Subscribed to new-interview. Waiting for messages...")

    try:
        while True:
            message = pubsub.get_message()
            if message:
                task = asyncio.create_task(process_message(message, redis_client))
                tasks.add(task)
                task.add_done_callback(tasks.discard)

            done_tasks = {t for t in tasks if t.done()}
            for task in done_tasks:
                tasks.discard(task)

            await asyncio.sleep(0.1)
    finally:
        if tasks:
            await asyncio.gather(*tasks)
        pubsub.close()
        redis_client.close()


async def main():
    await init_db()
    await process_messages()


if __name__ == "__main__":
    asyncio.run(main())
