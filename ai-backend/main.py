import redis
import json
from utils import parse_resume, ask_ai_model_gemini, ask_ai_model_cf
from pydantic import BaseModel


class ResumeAnalysisSchema(BaseModel):
    analysis: str
    rating: int


class QuestionAnswerSchema(BaseModel):
    question: str
    expected_answer: str


class ModelResponseSchema(BaseModel):
    resume_analysis: ResumeAnalysisSchema
    question_answer: list[QuestionAnswerSchema]


redis_client = redis.StrictRedis(host="localhost", port=6379, db=0)
channel = "new-interview"
pubsub = redis_client.pubsub()
pubsub.subscribe(channel)
print(f"Subscribed to {channel}. Waiting for messages...")
for message in pubsub.listen():
    if message["type"] == "message":
        data = json.loads(message["data"])
        print(f"Received analysis request of {data.get("name")}")
        resume_text = parse_resume(data.get("resumeUrl"))
        print(f"Resume of {data.get("name")} parsed")
        prompt = f"""JSON MODE ON
        ONLY USE JSON, NO other format.
        DO NOT use MarkDown outside the JSON content.
        You are a resume analysis model.
        The user's name is: {data.get("name")}
        The user is applying for: {data.get("role")}
        The user has an experience of {data.get("yoe")} years
        This is the text in the user's resume:
        {resume_text}
        GIVE FEEDBACK AND CONSTRUCTIVE CRITICISM TO THE USER.
        THE RATING OF THE RESUME MUST BE OUT OF 10.
        Adhere to the role and years of experience and give feedback accordingly.
        Explain in detail.
        For projects, focus on the When and Why, then How and not Where.
        Also check if the Resume is tailored to the role the user is applying for.
        For the questions, ask concept based questions as well as resume based questions.
        When replying, ONLY answer in the JSON schema no other output or text outside the JSON
        schema:
            - resume_analysis:
                - analysis: str
                - rating: int
            - question_answer:
                [
                    - question: str
                    - expected_answer: str
                ]
        """
        cf_response = ask_ai_model_cf(prompt, ModelResponseSchema)
        gemini_response = ask_ai_model_gemini(prompt, ModelResponseSchema)
        print("Cloudflare:", cf_response)
        print("Gemini:", gemini_response)
        # print("-------------------------------------------------------")
        # print("Cloudflare")
        # print("----")
        # print("Resume Analysis: ", cf_response["resume_analysis"]["analysis"])
        # print("Rating: ", cf_response["resume_analysis"]["rating"])
        # for i in range(len(cf_response["question_answer"])):
        #     print("Question: ", cf_response["question_answer"][i]["question"])
        #     print("Answer: ", cf_response["question_answer"][i]["answer"])
        # print("-------------------------------------------------------")
        print("-------------------------------------------------------")
        print("Gemini")
        print("----")
        print("Resume Analysis: ", gemini_response["resume_analysis"]["analysis"])
        print("Rating: ", gemini_response["resume_analysis"]["rating"])
        for i in range(len(gemini_response["question_answer"])):
            print("Question: ", gemini_response["question_answer"][i]["question"])
            print("Answer: ", gemini_response["question_answer"][i]["answer"])
        print("-------------------------------------------------------")
