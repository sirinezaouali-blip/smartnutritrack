from fastapi import FastAPI, UploadFile, File, HTTPException, Form
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
from cnn_service import cnn_service
from rag_planner_service import rag_planner_service
from barcode_service import barcode_scanner_service
from dish_service import vit_dish_classifier
from unified_food_recognition import unified_food_system
import requests
from PIL import Image
import io
import numpy as np
import traceback

app = FastAPI(title="SmartNutritrack AI API - Enhanced Version")

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
        "message": "SmartNutritrack AI API with Enhanced CNN Service", 
        "status": "healthy",
        "cnn_loaded": cnn_service.model_loaded,
        "model_type": "ONNX" if cnn_service.model_loaded else "Enhanced Mock"
    }

@app.get("/health")
async def health_check():
    try:
        return {
            "status": "healthy",
            "cnn_model_loaded": cnn_service.model_loaded,
            "vit_model_loaded": vit_dish_classifier.model_loaded,
            "model_type": "ONNX" if cnn_service.model_loaded else "Enhanced Mock",
            "number_of_classes": {
                "fruits_vegetables": len(cnn_service.class_names),
                "dishes": len(vit_dish_classifier.class_names)
            },
            "message": "Real nutrition data from FREE APIs - ViT + CNN + Barcode Integration"
        }
    except Exception as e:
        return {"error": str(e)}

@app.post("/api/scan/fruits-vegetables")
async def scan_fruits_vegetables(image: UploadFile = File(...)):
    """Scan fruits and vegetables using enhanced CNN service"""
    try:
        # Validate image
        if not image.content_type.startswith('image/'):
            raise HTTPException(400, "File must be an image")
        
        # Read image data
        image_data = await image.read()
        if len(image_data) == 0:
            raise HTTPException(400, "Empty image file")
        
        # Use enhanced CNN service for prediction
        prediction_result = cnn_service.predict_fruits_vegetables(image_data)
        
        return {
            "success": True,
            "prediction": prediction_result,
            "message": "CNN prediction completed successfully"
        }
        
    except Exception as e:
        raise HTTPException(500, f"CNN prediction error: {str(e)}")

@app.post("/api/scan/dish")
async def scan_dish(image: UploadFile = File(...)):
    """Scan dish using ViT model"""
    try:
        # Validate image
        if not image.content_type.startswith('image/'):
            raise HTTPException(400, "File must be an image")

        # Read image data
        image_data = await image.read()
        if len(image_data) == 0:
            raise HTTPException(400, "Empty image file")

        # Use ViT dish classifier
        prediction_result = vit_dish_classifier.predict_dish(image_data)

        return {
            "success": True,
            "prediction": prediction_result,
            "message": "ViT dish recognition completed successfully"
        }

    except Exception as e:
        raise HTTPException(500, f"Dish recognition error: {str(e)}")

@app.post("/api/planner/rag")
async def rag_meal_planner(user_input: str):
    """Call your RAG meal planner system"""
    try:
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

@app.post("/api/scan/test-prediction")
async def test_prediction():
    """Test endpoint to simulate complete prediction flow"""
    try:
        # Simulate image processing and prediction
        mock_image_data = b"mock_image_data"
        
        # Use enhanced CNN service
        prediction_result = cnn_service.predict_fruits_vegetables(mock_image_data)
        
        return {
            "success": True,
            "test_type": "enhanced_mock_system",
            "prediction": prediction_result,
            "features": {
                "real_nutrition_data": True,
                "no_static_data": True,
                "free_apis_used": ["USDA", "Open Food Facts"],
                "ready_for_real_cnn": True
            }
        }
        
    except Exception as e:
        raise HTTPException(500, f"Test prediction error: {str(e)}")

@app.get("/api/model-status")
async def model_status():
    """Check model status and conversion instructions"""
    return {
        "current_model": "enhanced_mock" if not cnn_service.model_loaded else "real_onnx",
        "model_loaded": cnn_service.model_loaded,
        "number_of_classes": len(cnn_service.class_names),
        "conversion_required": not cnn_service.model_loaded,
        "conversion_instructions": "Use Google Colab to convert best_model.h5 to ONNX format",
        "your_model_path": r"F:\PFE Syrine\PROJET PFE CONCLUSION\Models\CNN\Fruits&vegetables\best_model.h5"
    }

from pydantic import BaseModel

class SingleDayRequest(BaseModel):
    user_input: str
    user_id: str = "current_user"

class MultiplePlansRequest(BaseModel):
    user_input: str
    number_of_plans: int = 3
    user_id: str = "current_user"

class SingleMealRequest(BaseModel):
    meal_type: str
    target_calories: int
    user_id: str = "current_user"
    limit: int = 20

@app.post("/api/planner/single-day")
async def plan_single_day(request: SingleDayRequest):
    """Generate single day meal plan using database meals"""
    try:
        result = await rag_planner_service.generate_single_day_plan(request.user_input, request.user_id)
        return result
    except Exception as e:
        raise HTTPException(500, f"Single day planning error: {str(e)}")

@app.post("/api/planner/multiple-plans")
async def plan_multiple_days(request: MultiplePlansRequest):
    """Generate multiple meal plan options from database"""
    try:
        result = await rag_planner_service.generate_multiple_plans(request.user_input, request.user_id, request.number_of_plans)
        return result
    except Exception as e:
        raise HTTPException(500, f"Multiple plans error: {str(e)}")

@app.post("/api/planner/single-meal")
async def plan_single_meal(request: SingleMealRequest):
    """Generate similar meal suggestions from database"""
    try:
        result = await rag_planner_service.generate_single_meal_suggestions(request.meal_type, request.target_calories, request.user_id, request.limit)
        return result
    except Exception as e:
        raise HTTPException(500, f"Single meal planning error: {str(e)}")

@app.get("/api/planner/status")
async def planner_status():
    """Check RAG planner status"""
    return {
        "rag_system_available": rag_planner_service.initialized,
        "backend_connected": True,
        "database_meals": "Ready to fetch from MongoDB",
        "endpoints_available": [
            "POST /api/planner/single-day",
            "POST /api/planner/multiple-plans", 
            "POST /api/planner/single-meal"
        ]
    }

@app.post("/api/scan/barcode")
async def scan_barcode(image: UploadFile = File(...)):
    """Scan barcode from image and get product info"""
    try:
        # Validate image
        if not image.content_type.startswith('image/'):
            raise HTTPException(400, "File must be an image")
        
        # Read image data
        image_data = await image.read()
        if len(image_data) == 0:
            raise HTTPException(400, "Empty image file")
        
        # Scan barcode
        result = await barcode_scanner_service.scan_barcode(image_data)
        return result
        
    except Exception as e:
        raise HTTPException(500, f"Barcode scanning error: {str(e)}")

@app.post("/api/scan/search-product")
async def search_product(product_name: str = Form(...)):
    """Manual product search as fallback"""
    try:
        result = await barcode_scanner_service.search_product_manual(product_name)
        return result
    except Exception as e:
        raise HTTPException(500, f"Product search error: {str(e)}")

@app.get("/api/scan/barcode-status")
async def barcode_status():
    """Check barcode scanner status"""
    return {
        "barcode_scanner_available": True,
        "open_food_facts_integration": True,
        "database_search": True,
        "endpoints_available": [
            "POST /api/scan/barcode",
            "POST /api/scan/search-product"
        ]
    }

@app.post("/api/scan/unified")
async def scan_unified(image: UploadFile = File(...), recognition_type: str = Form("auto")):
    """Unified food recognition using all available models"""
    try:
        # Validate image
        if not image.content_type.startswith('image/'):
            raise HTTPException(400, "File must be an image")

        # Read image data
        image_data = await image.read()
        if len(image_data) == 0:
            raise HTTPException(400, "Empty image file")

        # Use unified food recognition system
        result = await unified_food_system.recognize_food(image_data, recognition_type)

        return result

    except Exception as e:
        raise HTTPException(500, f"Unified recognition error: {str(e)}")

@app.get("/api/scan/unified-status")
async def unified_status():
    """Check unified recognition system status"""
    return {
        "unified_system_available": True,
        "available_models": {
            "vit_dish_classifier": vit_dish_classifier.model_loaded,
            "cnn_fruits_vegetables": cnn_service.model_loaded,
            "barcode_scanner": True
        },
        "endpoints_available": [
            "POST /api/scan/unified"
        ],
        "supported_types": ["auto", "dish", "fruit_veg", "barcode"]
    }

if __name__ == "__main__":
    print("🚀 Starting SmartNutritrack AI API (Enhanced Version)...")
    print("📡 Endpoints available:")
    print("   GET  /health")
    print("   POST /api/scan/fruits-vegetables")
    print("   POST /api/scan/dish")
    print("   POST /api/scan/unified")
    print("   POST /api/scan/barcode")
    print("   POST /api/planner/rag")
    print("🌐 Server running on: http://localhost:8000")
    uvicorn.run("main_light:app", host="0.0.0.0", port=8000, reload=True)
