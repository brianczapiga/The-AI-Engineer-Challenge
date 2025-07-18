# Import required FastAPI components for building the API
from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
# Import Pydantic for data validation and settings management
from pydantic import BaseModel
# Import OpenAI client for interacting with OpenAI's API
from openai import OpenAI
import os
import time
from typing import Optional, List, Dict, Any
from collections import defaultdict

# Initialize FastAPI application with a title
app = FastAPI(title="OpenAI Chat API")

# Rate limiting configuration
RATE_LIMIT_REQUESTS = 10  # Maximum requests per window
RATE_LIMIT_WINDOW = 60    # Time window in seconds (1 minute)

# In-memory storage for rate limiting
request_history: Dict[str, List[float]] = defaultdict(list)

def get_client_ip(request: Request) -> str:
    """Extract client IP address from request"""
    # Check for forwarded headers first (for proxy/load balancer setups)
    forwarded_for = request.headers.get("X-Forwarded-For")
    if forwarded_for:
        return forwarded_for.split(",")[0].strip()
    
    # Fall back to direct client IP
    if request.client and request.client.host:
        return request.client.host
    
    # Fallback for edge cases
    return "unknown"

def is_rate_limited(client_ip: str) -> bool:
    """Check if client has exceeded rate limit"""
    current_time = time.time()
    
    # Clean old requests outside the time window
    request_history[client_ip] = [
        req_time for req_time in request_history[client_ip] 
        if current_time - req_time < RATE_LIMIT_WINDOW
    ]
    
    # Check if client has exceeded the limit
    if len(request_history[client_ip]) >= RATE_LIMIT_REQUESTS:
        return True
    
    # Add current request to history
    request_history[client_ip].append(current_time)
    return False

# Configure CORS (Cross-Origin Resource Sharing) middleware
# This allows the API to be accessed from different domains/origins
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows requests from any origin
    allow_credentials=True,  # Allows cookies to be included in requests
    allow_methods=["*"],  # Allows all HTTP methods (GET, POST, etc.)
    allow_headers=["*"],  # Allows all headers in requests
)

# Define the data model for chat requests using Pydantic
# This ensures incoming request data is properly validated
class ChatRequest(BaseModel):
    developer_message: str  # Message from the developer/system
    user_message: str      # Message from the user
    conversation_history: Optional[List[Dict[str, Any]]] = []  # Full conversation history
    model: Optional[str] = "gpt-4.1-mini"  # Optional model selection with default
    api_key: str          # OpenAI API key for authentication

# Define the main chat endpoint that handles POST requests
@app.post("/api/chat")
async def chat(request: ChatRequest, http_request: Request):
    # Check rate limit
    client_ip = get_client_ip(http_request)
    if is_rate_limited(client_ip):
        raise HTTPException(
            status_code=429, 
            detail=f"Rate limit exceeded. Maximum {RATE_LIMIT_REQUESTS} requests per {RATE_LIMIT_WINDOW} seconds."
        )
    
    try:
        # Initialize OpenAI client with the provided API key
        client = OpenAI(api_key=request.api_key)
        
        # Build conversation history
        messages = []
        
        # Add system message
        messages.append({"role": "system", "content": request.developer_message})
        
        # Add conversation history from frontend (limit to prevent token overflow)
        max_history = 50  # Keep last 50 messages
        conversation_history = request.conversation_history or []
        if len(conversation_history) > max_history:
            conversation_history = conversation_history[-max_history:]
        
        messages.extend(conversation_history)
        
        print(f"Total messages being sent to OpenAI: {len(messages)}")
        print(f"Conversation history roles: {[msg.get('role', 'unknown') for msg in messages]}")
        
        # Create an async generator function for streaming responses
        async def generate():
            try:
                # Create a streaming chat completion request
                stream = client.chat.completions.create(
                    model=request.model or "gpt-4.1-mini",
                    messages=messages,
                    stream=True  # Enable streaming response
                )
                
                # Yield each chunk of the response as it becomes available
                for chunk in stream:
                    if chunk.choices[0].delta.content is not None:
                        yield chunk.choices[0].delta.content
                        
            except Exception as e:
                # Log the error but don't crash the server
                print(f"Streaming error: {str(e)}")
                # Yield a graceful error message
                yield "Sorry, there was an error processing your request. Please try again."

        # Return a streaming response to the client
        return StreamingResponse(generate(), media_type="text/plain")
    
    except Exception as e:
        # Handle any errors that occur during processing
        raise HTTPException(status_code=500, detail=str(e))

# Define a health check endpoint to verify API status
@app.get("/api/health")
async def health_check():
    return {"status": "ok"}

# Entry point for running the application directly
if __name__ == "__main__":
    import uvicorn
    # Start the server on all network interfaces (0.0.0.0) on port 8000
    uvicorn.run(app, host="0.0.0.0", port=8000)
