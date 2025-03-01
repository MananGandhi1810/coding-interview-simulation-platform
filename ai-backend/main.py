import redis
import json
from utils import (
    parse_resume,
    ask_ai_model_gemini,
    ask_ai_model_cf,
    push_to_db,
    push_error_to_db,
)


def process_message(message):
    if message["type"] == "message":
        data = json.loads(message["data"])
        print(f"Received analysis request of {data.get("name")} ({data.get("id")})")
        try:
            resume_text = parse_resume(data.get("resumeUrl"), redis_client)
            print(f"Resume of {data.get("name")} parsed")
            prompt = f"""JSON MODE ON
            YOU ARE A RESUME ANALYSIS MODEL AND INTERVIEW QUESTION GENERATION MODEL.
            Also create technical questions and expected answers based on the role, as if you are an interviewer asking those to a candidate.
            ONLY USE JSON, NO other format.
            DO NOT use MarkDown outside the JSON content.
            When replying, ONLY answer in the JSON schema no other output or text outside the JSON.
            The user's name is: {data.get("name")}
            The user is applying for: {data.get("role")} at {data.get("company")}
            The user has an experience of {data.get("yoe")} years
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
            cf_response = ask_ai_model_cf(prompt)
            gemini_response = ask_ai_model_gemini(prompt)
            print("Cloudflare:", cf_response)
            print("Gemini:", gemini_response)
            print("-------------------------------------------------------")
            print("Cloudflare")
            print("----")
            print("Resume Analysis: ", cf_response["resume_analysis"]["analysis"])
            print("Rating: ", cf_response["resume_analysis"]["rating"])
            for i in range(len(cf_response["question_answer"])):
                print("Question: ", cf_response["question_answer"][i]["question"])
                print("Answer: ", cf_response["question_answer"][i]["answer"])
            print("-------------------------------------------------------")
            print("-------------------------------------------------------")
            print("Gemini")
            print("----")
            print("Resume Analysis: ", gemini_response["resume_analysis"]["analysis"])
            print("Rating: ", gemini_response["resume_analysis"]["rating"])
            for i in range(len(gemini_response["question_answer"])):
                print("Question: ", gemini_response["question_answer"][i]["question"])
                print("Answer: ", gemini_response["question_answer"][i]["answer"])
            print("-------------------------------------------------------")
            result = push_to_db(
                data.get("id"), gemini_response["resume_analysis"], gemini_response["question_answer"]
            )
        except Exception as e:
            print(e)
            push_error_to_db(data.get("id"))


redis_client = redis.StrictRedis(host="localhost", port=6379, db=0)
channel = "new-interview"
pubsub = redis_client.pubsub()
pubsub.subscribe(channel)
print(f"Subscribed to {channel}. Waiting for messages...")
for message in pubsub.listen():
    process_message(message)
