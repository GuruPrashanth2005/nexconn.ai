from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import laya

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

print("Loading Convai Laya AI Decision Model...")
router = laya.Router()
print("Laya AI Ready! (33ms inference mode)")

class LayaDynamicRequest(BaseModel):
    text: str
    choices: List[str]
    description: str

@app.post("/predict")
async def predict_intent(request: LayaDynamicRequest):
    prompt = request.text.strip()
    
    # 100% Dynamic - No hardcoded values in the server!
    # Laya will evaluate the text based entirely on the choices and description provided by the client.
    questions = {
        "intent": {
            "type": "choice",
            "choices": request.choices,
            "description": request.description
        }
    }
    
    # Fast decision pass (~33ms)
    decision = router.system_one(state=prompt, questions=questions)
    intent = decision["intent"]
    
    print(f"LAYA DYNAMIC PREDICTION: '{prompt}' -> {intent}")
    
    return {"predicted_intent": intent}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000)
