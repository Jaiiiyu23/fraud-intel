from fastapi import FastAPI

app = FastAPI()

@app.get("/")
def home():
    return {"message": "Fraud Intel backend running"}

@app.get("/scams")
def scams():
    return {
        "latest_scams": [
            "UPI phishing scam detected",
            "Telegram crypto fraud network",
            "Fake job recruitment scam",
            "Investment scam via WhatsApp"
        ]
    }
