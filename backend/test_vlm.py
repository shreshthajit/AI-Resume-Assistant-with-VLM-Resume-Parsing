from pathlib import Path
from vlmrun.client import VLMRun

client = VLMRun(api_key="Wfaxnld7KMK3YUAeGplJTKO7zOSCEd")

response = client.document.generate(
    file=Path("C:/Users/jisnu/Downloads/Shreshthajit_Das_FSE.pdf"),
    domain="document.resume"
)

print("Task ID:", response.id)
