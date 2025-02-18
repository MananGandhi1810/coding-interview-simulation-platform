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

load_dotenv()
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))
gemini_model = genai.GenerativeModel("gemini-2.0-flash")
cf_url = (
    f"https://api.cloudflare.com/client/v4/accounts/{os.getenv("CF_ACCOUNT_ID")}/ai/v1"
)
cf_model_name = "@cf/meta/llama-3.3-70b-instruct-fp8-fast"
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


def ask_ai_model_gemini(prompt, schema):
    response = gemini_model.generate_content(
        prompt,
        generation_config=GenerationConfig(
            response_schema=schema, response_mime_type="application/json"
        ),
    )
    return json.loads(response.text)


def ask_ai_model_cf(prompt, schema):
    response = cf_client.beta.chat.completions.parse(
        model=cf_model_name,
        messages=[
            {
                "role": "user",
                "content": prompt,
            }
        ],
    )
    try:
        return json.loads(
            response.choices[0].message.content.strip("```").replace("\n", "")
        )
    except Exception as e:
        print(e)
        return None