import os
import pandas as pd
from sqlalchemy import text
from typing import List, Optional
from pydantic import BaseModel, Field

from langchain_groq import ChatGroq
from langchain_core.prompts import ChatPromptTemplate
from database import engine

class QueryExtraction(BaseModel):
    kpis: List[str] = Field(description="The key performance indicators to extract (e.g., total_revenue, top_products, active_customers).")
    time_range: Optional[str] = Field(description="The time range mentioned in the query (e.g., 'last 6 months', '2023').")
    chart_types: List[str] = Field(description="Recommended chart types based on the query. Allowed: 'line', 'bar', 'pie', 'scatter', 'area', 'donut', 'funnel', 'table'. Recommend EXACTLY 3 or 4 different visual charts if the user asks for 'all types'.")
    suggested_colors: List[str] = Field(description="List of CSS colors or hex codes explicitly asked for or best suited (e.g. ['#EF4444', 'blue']). Leave empty if none specified.")
    sql_query: str = Field(description="A PostgreSQL valid SQL query that accurately answers the user's request using the available schema.")
    explanation: str = Field(description="Brief explanation of what the SQL query does.")

llm = None

def get_llm():
    global llm
    if llm is None:
        groq_api_key = os.getenv("GROQ_API_KEY")
        if not groq_api_key or groq_api_key == "your_groq_api_key_here":
            raise ValueError("GROQ_API_KEY is not configured.")
        llm = ChatGroq(temperature=0, groq_api_key=groq_api_key, model_name="llama-3.3-70b-versatile")
    return llm

SCHEMA_CONTEXT = """
You are an expert PostgreSQL data analyst. 
You have access to the following database schema.

Table products:
- id (Integer, primary key)
- name (String)
- category (String)
- price (Float)

Table customers:
- id (Integer, primary key)
- name (String)
- region (String)

Table orders:
- id (Integer, primary key)
- customer_id (Integer, foreign key to customers.id)
- order_date (Date)
- total_amount (Float)

Table order_items:
- id (Integer, primary key)
- order_id (Integer, foreign key to orders.id)
- product_id (Integer, foreign key to products.id)
- quantity (Integer)
- price_at_purchase (Float)
"""

def process_user_query(user_query: str):
    chat_llm = get_llm()
    
    prompt = ChatPromptTemplate.from_messages([
        ("system", SCHEMA_CONTEXT + "\n\nGiven the user query, formulate a PostgreSQL SQL query to fetch the necessary data. Return structured JSON matching the requested model. If the user asks for colors, populate suggested_colors. If they ask for 'all types of charts', rigorously provide 3-4 diverse types from the allowed list."),
        ("human", "{query}")
    ])
    
    structured_llm = chat_llm.with_structured_output(QueryExtraction)
    chain = prompt | structured_llm
    
    extraction_raw = chain.invoke({"query": user_query})
    
    # Handle case where LLM structured output parser returns a dict instead of Pydantic model
    if isinstance(extraction_raw, dict):
        extraction = QueryExtraction(**extraction_raw)
    else:
        extraction = extraction_raw
    
    # Execute SQL using pandas
    try:
        df = pd.read_sql_query(text(extraction.sql_query), engine)
        data = df.to_dict(orient="records")
        columns = df.columns.tolist()
    except Exception as e:
        data = []
        columns = []
        return {
            "error": str(e),
            "sql_query": extraction.sql_query
        }
        
    return {
        "kpis": extraction.kpis,
        "time_range": extraction.time_range,
        "chart_types": extraction.chart_types,
        "suggested_colors": extraction.suggested_colors,
        "sql_query": extraction.sql_query,
        "explanation": extraction.explanation,
        "data": data,
        "columns": columns
    }

def generate_insights(user_query: str, data: list):
    chat_llm = get_llm()
    data_sample = data[:20] if data else []
    
    prompt = ChatPromptTemplate.from_messages([
        ("system", "You are an expert Data Analyst BI tool. Analyze the provided query and SQL results, and write 3-4 bullet points of crisp, business-value insights based on the data. Do not mention SQL in your final output. Be concise."),
        ("human", "User Request: {query}\n\nData Sample: {data}")
    ])
    
    chain = prompt | chat_llm
    response = chain.invoke({"query": user_query, "data": str(data_sample)})
    return response.content
