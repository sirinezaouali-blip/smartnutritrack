from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
from cnn_service import cnn_service
import requests

app = FastAPI(title="SmartNutritrack AI API - Real CNN & RAG")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    return {
        "message": "SmartNutritrack AI API with Real CNN & RAG", 
        "status": "healthy",
        "cnn_loaded": cnn_service.model is not None
    }

@app.get("/health")
async def health_check():
    return {
        "status": "healthy", 
        "cnn_model_loaded": cnn_service.model is not None,
        "number_of_classes": len(cnn_service.class_names)
    }

@app.post("/api/scan/fruits-vegetables")
async def scan_fruits_vegetables(image: UploadFile = File(...)):
    """Scan fruits and vegetables using your ACTUAL CNN model"""
    try:
        if cnn_service.model is None:
            raise HTTPException(500, "CNN model not loaded")
        
        # Validate image
        if not image.content_type.startswith('image/'):
            raise HTTPException(400, "File must be an image")
        
        # Read image data
        image_data = await image.read()
        if len(image_data) == 0:
            raise HTTPException(400, "Empty image file")
        
        # Use your actual CNN model for prediction
        prediction_result = cnn_service.predict_fruits_vegetables(image_data)
        
        # Get nutrition data from FREE APIs (no static data)
        nutrition_data = cnn_service.get_nutrition_from_api(
            prediction_result["top_prediction"]["food_name"]
        )
        
        return {
            "success": True,
            "prediction": prediction_result,
            "nutrition": nutrition_data if nutrition_data["success"] else None,
            "message": "CNN prediction completed successfully"
        }
        
    except Exception as e:
        raise HTTPException(500, f"CNN prediction error: {str(e)}")

@app.post("/api/scan/dish")
async def scan_dish(image: UploadFile = File(...)):
    """Placeholder for dish recognition - integrate your dish model here"""
    try:
        # Read image for basic validation
        image_data = await image.read()
        
        return {
            "success": True,
            "message": "Dish recognition model not yet integrated",
            "note": "Integrate your dish model from: F:\\PFE Syrine\\PROJET PFE CONCLUSION\\Models\\CNN\\Dishs",
            "image_received": True
        }
        
    except Exception as e:
        raise HTTPException(500, f"Error processing dish image: {str(e)}")

@app.post("/api/planner/rag")
async def rag_meal_planner(user_input: str):
    """Call your RAG meal planner system"""
    try:
        # This will integrate with your RAG system
        # For now, return basic response
        return {
            "success": True,
            "plan": {
                "breakfast": "Oatmeal with fruits - 300 calories",
                "lunch": "Chicken salad - 450 calories", 
                "dinner": "Grilled fish with vegetables - 500 calories",
                "snacks": "Greek yogurt - 150 calories",
                "total_calories": 1400
            },
            "source": "rag_system",
            "note": "Integrate with your RAG system at: F:\\PFE Syrine\\PROJET PFE CONCLUSION\\Models\\Meal planner\\Meal Planner"
        }
        
    except Exception as e:
        raise HTTPException(500, f"Error generating meal plan: {str(e)}")

if __name__ == "__main__":
    print("🚀 Starting SmartNutritrack AI API with Real CNN...")
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)