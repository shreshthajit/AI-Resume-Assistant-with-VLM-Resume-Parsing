# AI-Resume-Assistant-with-VLM-Resume-Parsing
## 🚀 Running the Backend (FastAPI)

```
cd backend

1. Use virtual environment:
* python -m venv venv
* On Windows: venv\Scripts\activate  # On linux: source venv/bin/activate 

2 Install dependencies
* pip install -r requirements.txt

3 Run the server
* uvicorn app.main:app --reload 

```
## .env file
```
export OPENAI_API_KEY=
export DATABASE_URL=
export SECRET_KEY=
export VLM_API_KEY=

```

## 🖥 Running the Frontend (Next.js)
```
cd frontend

1. Install dependencies
* npm install 

2. Run dev server
* npm run dev

```

## .env.local file
```
NEXT_PUBLIC_BASE_URL=http://localhost:8000

```

### Async Flow Description
```
[Login ✅]

   ↓
   
[fetchChatHistory()] ───▶ Sidebar Recent Chats

   ↓
   
[Upload Resume]

   ↓

[POST /resume/upload]

   ↓

[poll /resume/status/{id}] until "done"

   ↓

[User asks question]

   ↓

[POST /v1/chat/completions]

   ↓

[Append assistant reply]

   ↓

[Refresh history]
```
