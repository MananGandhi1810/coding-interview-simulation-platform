import requests
import tempfile
import os
from pytesseract import image_to_string
from pdf2image import convert_from_path
import google.generativeai as genai
from google.generativeai.types.generation_types import GenerationConfig
from dotenv import load_dotenv
import json

load_dotenv()
genai.configure(api_key=os.environ["GEMINI_API_KEY"])
model = genai.GenerativeModel("gemini-2.0-flash")


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


def ask_ai_model(prompt, schema):
    response = model.generate_content(
        prompt,
        generation_config=GenerationConfig(
            response_schema=schema, response_mime_type="application/json"
        ),
    )
    return json.loads(response.text)
