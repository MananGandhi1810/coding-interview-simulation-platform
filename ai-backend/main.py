import redis
import json
from utils import parse_resume, ask_ai_model
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
        resume_text = parse_resume(data.get("resumeUrl"))
        prompt = f"""You are a resume analysis model.
        The user's name is: {data.get("name")}
        The user is applying for: {data.get("role")}
        The user has an experience of: {data.get("yoe")} years
        This is the text in the user's resume:
        {resume_text}
        Give feedback and constructive criticism to the user.
        The rating of the resume must be out of 10
        """
        response = ask_ai_model(prompt, ResumeAnalysisSchema)
        print(response)