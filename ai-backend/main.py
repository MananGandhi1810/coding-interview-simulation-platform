import redis
import json
from utils import parse_resume, ask_ai_model_gemini, ask_ai_model_cf
from pydantic import BaseModel


class ResumeAnalysisSchema(BaseModel):
    analysis: str
    rating: int


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
        schema:
            - analysis: str
            - rating: int
        """
        cf_response = ask_ai_model_cf(prompt, ResumeAnalysisSchema)
        gemini_response = ask_ai_model_gemini(prompt, ResumeAnalysisSchema)
        print("Coudflare:", cf_response)
        print("Gemini:", gemini_response)
