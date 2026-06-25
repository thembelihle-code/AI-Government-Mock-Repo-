import shutil
from pathlib import Path
from fastapi import FastAPI, UploadFile, File
from fastapi.responses import HTMLResponse
from fastapi.middleware.cors import CORSMiddleware
from faster_whisper import WhisperModel
from transformers import MarianMTModel, MarianTokenizer

# 1. Initialize FastAPI
app = FastAPI(title="AI Transcription & Translation Assistant")

# 2. CORS SECURITY ALIGNMENT
# This grants permission to your local frontend servers to exchange data packets
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173", 
        "http://localhost:3000", 
        "http://127.0.0.1:5173",
        "http://127.0.0.1:3000"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 3. Load Whisper Engine
print("Loading Whisper Engine (Speech-to-Text)...")
whisper_model = WhisperModel("small", device="cpu", compute_type="int8")
print("Whisper Engine is ready!")

tokenizer = None
translation_model = None

@app.get("/", response_class=HTMLResponse)
async def get_interface():
    return "<h1>AI Pipeline Server Running on Port 8000</h1>"

@app.post("/process_audio")
async def process_audio(file: UploadFile = File(...)):
    global tokenizer, translation_model
    
    upload_dir = Path("temp_audio")
    upload_dir.mkdir(exist_ok=True)
    file_path = upload_dir / file.filename
    
    with file_path.open("wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
        
    try:
        # Step A: Whisper Speech-to-Text
        segments, _ = whisper_model.transcribe(str(file_path), language="en", beam_size=5)
        english_text = " ".join([segment.text.strip() for segment in segments])
        
        if not english_text.strip():
            return {"english_transcript": "", "hebrew_translation": ""}
            
        # Step B: Lazy Load Translator
        if tokenizer is None or translation_model is None:
            print("Loading Translator Engine dynamically on-demand...")
            model_name = "Helsinki-NLP/opus-mt-en-he"
            tokenizer = MarianTokenizer.from_pretrained(model_name)
            translation_model = MarianMTModel.from_pretrained(model_name)
        
        # Step C: Hebrew Translation
        tokenized_text = tokenizer(english_text, return_tensors="pt", padding=True)
        translated_tokens = translation_model.generate(**tokenized_text)
        hebrew_text = tokenizer.decode(translated_tokens[0], skip_special_tokens=True)
        
        return {
            "english_transcript": english_text,
            "hebrew_translation": hebrew_text
        }
        
    finally:
        if file_path.exists():
            file_path.unlink()

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="localhost", port=8000)