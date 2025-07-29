from pathlib import Path
from vlmrun.client import VLMRun
from vlmrun.client.types import PredictionResponse
import time
from dotenv import load_dotenv
import os

load_dotenv()


API_KEY=os.getenv("VLM_API_KEY")

vlm = VLMRun(api_key=API_KEY)

def upload_resume_to_vlm(file: bytes, filename: str):
    # Save the file temporarily
    import tempfile
    with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as tmp:
        tmp.write(file)
        tmp_path = tmp.name

    # Now parse using VLM SDK
    response: PredictionResponse = vlm.document.generate(
        file=Path(tmp_path),
        domain="document.resume"
    )

    return response.id  # task ID

def poll_parsing_result(task_id: str, timeout=120):  # Increase to 120+ seconds
    start = time.time()
    while time.time() - start < timeout:
        result = vlm.document.get(task_id)
        if result.status == "completed":
            return result.response
        elif result.status == "failed":
            raise Exception(f"VLM parsing failed: {result.errors}")
        time.sleep(5)  # Check less frequently (e.g., every 5 seconds)
    raise TimeoutError(f"Task {task_id} timed out after {timeout} seconds")
