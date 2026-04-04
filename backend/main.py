from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware

from services import process_user_query, generate_insights
from seed import seed_db

app = FastAPI(title="Talking BI API")

# Setup CORS for the frontend Vite server
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

class QueryRequest(BaseModel):
    query: str

class QueryResponse(BaseModel):
    kpis: list[str]
    time_range: str | None
    chart_types: list[str]
    suggested_colors: list[str] = []
    sql_query: str
    explanation: str
    data: list[dict]
    columns: list[str]
    insights: str | None

@app.on_event("startup")
def on_startup():
    try:
        seed_db()
    except Exception as e:
        print(f"Error seeding DB: {e}")

@app.post("/chat", response_model=QueryResponse)
def execute_chat(request: QueryRequest):
    try:
        result = process_user_query(request.query)
        
        if "error" in result:
            raise HTTPException(status_code=400, detail=result["error"])
        
        insights = generate_insights(request.query, result["data"])
        
        return QueryResponse(
            kpis=result["kpis"],
            time_range=result["time_range"],
            chart_types=result["chart_types"],
            suggested_colors=result.get("suggested_colors", []),
            sql_query=result["sql_query"],
            explanation=result["explanation"],
            data=result["data"],
            columns=result["columns"],
            insights=insights
        )
    except Exception as e:
        import traceback
        import sys
        print(f"Server Error in /chat: {e}", file=sys.stderr)
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

