from fastapi import FastAPI
from data_collector import get_latest_scams

app = FastAPI()

@app.get("/scams")
def scams():
    data = get_latest_scams()

    return {
        "latest_scams": data,
        "count": len(data)
    }
