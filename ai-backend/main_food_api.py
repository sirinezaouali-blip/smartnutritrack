from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import uvicorn
from professional_food_service import ProfessionalFoodService
import requests
from pyzbar.pyzbar import decode
import cv2
import numpy as np
from PIL import Image
import io
from dish_service import DishRecognitionService

app = FastAPI(title="SmartNutritrack AI Food API")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global service instance
food_service = ProfessionalFoodService()
dish_service = DishRecognitionService()

@app.get("/")
async def root():
    return {
        "message": "SmartNutritrack AI Food API - Real Food Recognition",
        "status": "healthy", 
        "models_loaded": {
            "fruits_vegetables": food_service.model is not None,
            "general_dishes": dish_service.model is not None
        },
        "endpoints": [
            "GET /health",
            "POST /api/scan/food",           # Fruits & Vegetables (VGG16)
            "POST /api/scan/dish",           # General Dishes (MobileNetV2) 
            "POST /api/scan/barcode",
            "GET /api/nutrition/{food_name}",
            "POST /api/planner/suggest",
            "POST /api/recommend-meal"
        ]
    }

@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "models_loaded": {
            "fruits_vegetables_vgg16": food_service.model is not None,
            "general_dishes_mobilenetv2": dish_service.model is not None
        },
        "services": [
            "professional_food_recognition", 
            "dish_recognition_service"
        ],
        "features": [
            "food_recognition", 
            "dish_recognition", 
            "barcode_scanning", 
            "nutrition_api"
        ]
    }

@app.post("/api/scan/food")
async def scan_food(image: UploadFile = File(...)):
    """Scan food using AI and get nutrition data"""
    try:
        print(f"🔍 Processing food image: {image.filename}")
        
        # Validate image
        if not image.content_type.startswith('image/'):
            raise HTTPException(400, "File must be an image")
        
        # Read image data
        image_data = await image.read()
        if len(image_data) == 0:
            raise HTTPException(400, "Empty image file")
        
        # Use AI to recognize food
        prediction_result = food_service.predict_food(image_data)
        
        # Get nutrition data for the top prediction
        nutrition_data = None
        if prediction_result.get('top_prediction'):
            food_name = prediction_result['top_prediction']['food_name']
            nutrition_data = food_service.get_nutrition_from_api(food_name)
        
        return {
            "success": True,
            "message": "Food recognition completed",
            "prediction": prediction_result,
            "nutrition": nutrition_data,
            "image_processed": True
        }
        
    except Exception as e:
        raise HTTPException(500, f"Food recognition error: {str(e)}")

@app.post("/api/scan/barcode")
async def scan_barcode(image: UploadFile = File(...)):
    """Scan barcode and get product nutrition"""
    try:
        print(f"📦 Processing barcode image: {image.filename}")
        
        if not image.content_type.startswith('image/'):
            raise HTTPException(400, "File must be an image")
        
        image_data = await image.read()
        if len(image_data) == 0:
            raise HTTPException(400, "Empty image file")
        
        # Convert to OpenCV format
        nparr = np.frombuffer(image_data, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_GRAYSCALE)
        
        if img is None:
            raise HTTPException(400, "Could not decode image")
        
        # Decode barcodes
        barcodes = decode(img)
        
        if not barcodes:
            return {
                "success": False,
                "message": "No barcode detected",
                "suggestions": [
                    "Ensure barcode is clearly visible",
                    "Try better lighting",
                    "Make sure barcode is not blurry"
                ]
            }
        
        barcode_results = []
        for barcode in barcodes:
            barcode_data = barcode.data.decode('utf-8')
            barcode_info = {
                "data": barcode_data,
                "type": barcode.type,
                "location": {
                    "x": barcode.rect.left,
                    "y": barcode.rect.top,
                    "width": barcode.rect.width,
                    "height": barcode.rect.height
                }
            }
            
            # Get product info from Open Food Facts
            product_info = await get_product_from_barcode(barcode_data)
            barcode_info["product"] = product_info
            
            barcode_results.append(barcode_info)
        
        return {
            "success": True,
            "barcodes_found": len(barcode_results),
            "barcodes": barcode_results,
            "message": f"Found {len(barcode_results)} barcode(s)"
        }
        
    except Exception as e:
        raise HTTPException(500, f"Barcode scanning error: {str(e)}")

@app.get("/api/nutrition/{food_name}")
async def get_nutrition(food_name: str):
    """Get nutrition data for any food"""
    try:
        nutrition_data = food_service.get_nutrition_from_api(food_name)
        
        return {
            "success": nutrition_data['success'],
            "food_name": food_name,
            "data": nutrition_data
        }
        
    except Exception as e:
        raise HTTPException(500, f"Nutrition API error: {str(e)}")

async def get_product_from_barcode(barcode: str):
    """Get product information from Open Food Facts"""
    try:
        url = f"https://world.openfoodfacts.org/api/v0/product/{barcode}.json"
        response = requests.get(url, timeout=10)
        
        if response.status_code == 200:
            data = response.json()
            if data.get("status") == 1:
                product = data.get("product", {})
                
                # Extract nutrition information
                nutriments = product.get("nutriments", {})
                nutrition = {
                    "calories": nutriments.get("energy-kcal_100g"),
                    "protein": nutriments.get("proteins_100g"),
                    "carbs": nutriments.get("carbohydrates_100g"),
                    "fats": nutriments.get("fats_100g"),
                    "sugar": nutriments.get("sugars_100g"),
                    "fiber": nutriments.get("fiber_100g"),
                    "sodium": nutriments.get("sodium_100g")
                }
                
                # Clean nutrition data
                nutrition = {k: v for k, v in nutrition.items() if v is not None}
                
                return {
                    "name": product.get("product_name", "Unknown Product"),
                    "brand": product.get("brands", ""),
                    "categories": product.get("categories", ""),
                    "ingredients": product.get("ingredients_text", ""),
                    "nutrition": nutrition,
                    "image_url": product.get("image_url", ""),
                    "source": "openfoodfacts"
                }
        
        return {
            "name": "Product not found",
            "barcode": barcode,
            "source": "openfoodfacts"
        }
        
    except Exception as e:
        return {
            "error": f"Failed to fetch product: {str(e)}",
            "barcode": barcode,
            "source": "openfoodfacts"
        }

@app.post("/api/planner/suggest")
async def suggest_meals(user_preferences: dict):
    """AI meal suggestions based on preferences"""
    try:
        # Extract user preferences and data
        preferences = user_preferences.get('preferences', {})
        target_calories = user_preferences.get('target_calories', 2000)
        remaining_calories = user_preferences.get('remainingCalories', target_calories)
        meal_type = user_preferences.get('mealType', 'lunch')
        wanted_meal = user_preferences.get('wantedMeal', '')
        user_profile = user_preferences.get('userProfile', {})

        print(f"🍽️ Daily meal plan request for: {meal_type} - {wanted_meal}")
        print(f"📊 Target calories: {target_calories}, Remaining: {remaining_calories}")

        # Calculate meal-specific calorie distribution
        CALORIE_DISTRIBUTION = {
            "breakfast": 0.20,  # 20%
            "lunch": 0.35,      # 35%
            "dinner": 0.35,     # 35%
            "snack": 0.10       # 10%
        }

        # Use remaining calories for the specific meal
        meal_target_calories = int(remaining_calories * CALORIE_DISTRIBUTION.get(meal_type, 0.35))
        max_calories = int(meal_target_calories * 1.2)  # 20% flexibility

        # Build search query from user input
        search_query = f"{wanted_meal} {meal_type}" if wanted_meal else meal_type

        # Get meal recommendations from ChromaDB
        recommendations = food_service.get_meal_recommendations(
            query=search_query,
            meal_type=meal_type,
            target_calories=meal_target_calories,
            max_calories=max_calories,
            max_results=10
        )

        # Format recommendations for frontend
        formatted_meals = []
        total_calories = 0

        if recommendations:
            for rec in recommendations[:5]:  # Limit to 5 meals
                # Extract meal data from ChromaDB content
                meal_data = food_service._parse_meal_from_content(rec.get('content', ''))
                if meal_data:
                    formatted_meals.append({
                        "name": meal_data.get('name', 'Unknown Meal'),
                        "description": meal_data.get('description', ''),
                        "calories": rec.get('calories', 0),
                        "protein": meal_data.get('protein', 0),
                        "carbs": meal_data.get('carbs', 0),
                        "fats": meal_data.get('fats', 0),
                        "ingredients": meal_data.get('ingredients', []),
                        "mealType": meal_type
                    })
                    total_calories += rec.get('calories', 0)

        # If no recommendations from ChromaDB, provide fallback
        if not formatted_meals:
            formatted_meals = [
                {
                    "name": f"{wanted_meal.title()} {meal_type.title()}" if wanted_meal else f"Healthy {meal_type.title()}",
                    "description": f"A nutritious {meal_type} option based on your preferences",
                    "calories": meal_target_calories,
                    "protein": int(meal_target_calories * 0.25 / 4),  # ~25% from protein
                    "carbs": int(meal_target_calories * 0.50 / 4),   # ~50% from carbs
                    "fats": int(meal_target_calories * 0.25 / 9),     # ~25% from fats
                    "ingredients": ["Various healthy ingredients"],
                    "mealType": meal_type
                }
            ]
            total_calories = meal_target_calories

        return {
            "success": True,
            "data": {
                "meals": formatted_meals,
                "totalCalories": total_calories,
                "mealType": meal_type,
                "targetCalories": meal_target_calories,
                "source": "chromadb_rag" if recommendations else "fallback"
            },
            "message": f"Generated {len(formatted_meals)} meal suggestions for {meal_type}"
        }

    except Exception as e:
        print(f"❌ Meal suggestion error: {str(e)}")
        raise HTTPException(500, f"Meal suggestion error: {str(e)}")
    

@app.post("/api/recommend-meal")
async def recommend_meal(meal_request: dict):
    """Get personalized meal recommendations based on user data"""
    try:
        meal_type = meal_request.get('meal_type', 'lunch')
        preference = meal_request.get('preference', '')
        user_calories = meal_request.get('user_daily_calories', 2173)  # Dynamic from user
        max_results = meal_request.get('max_results', 10)
        
        print(f"🍽️ Meal recommendation request: {meal_type}, preference: {preference}")
        print(f"📊 User daily calories: {user_calories}")

        # Calculate target calories for this specific meal
        CALORIE_DISTRIBUTION = {
            "breakfast": 0.20,  # 20%
            "lunch": 0.35,      # 35%
            "dinner": 0.35,     # 35%
            "snack": 0.10       # 10%
        }
        
        target_calories = int(user_calories * CALORIE_DISTRIBUTION.get(meal_type, 0.35))
        max_calories = int(target_calories * 1.2)  # 20% flexibility

        # Build search query
        search_query = f"{preference} {meal_type}" if preference else meal_type
        
        # Use your existing food service to get recommendations
        # This integrates with your ChromaDB vector store
        recommendations = food_service.get_meal_recommendations(
            query=search_query,
            meal_type=meal_type,
            target_calories=target_calories,
            max_calories=max_calories,
            max_results=max_results
        )

        return {
            "success": True,
            "meal_type": meal_type,
            "user_preference": preference,
            "target_calories": target_calories,
            "max_calories": max_calories,
            "recommendations": recommendations,
            "total_recommendations": len(recommendations) if recommendations else 0
        }
        
    except Exception as e:
        raise HTTPException(500, f"Meal recommendation error: {str(e)}")
    
@app.post("/api/scan/dish")
async def scan_dish(image: UploadFile = File(...)):
    """Scan general dishes (pizza, burger, pasta, etc.) using MobileNetV2"""
    try:
        print(f"🍽️ Processing dish image: {image.filename}")
        
        # Validate image
        if not image.content_type.startswith('image/'):
            raise HTTPException(400, "File must be an image")
        
        # Read image data
        image_data = await image.read()
        if len(image_data) == 0:
            raise HTTPException(400, "Empty image file")
        
        # Use dish service to recognize general dishes
        prediction_result = dish_service.recognize_dish(image_data)
        print(f"🎯 Prediction result keys: {prediction_result.keys()}")
        
        # Get nutrition data for the top prediction
        nutrition_data = None
        if prediction_result.get('predictions') and len(prediction_result['predictions']) > 0:
            top_dish = prediction_result['predictions'][0]['food_name']
            print(f"🔍 Getting nutrition for top dish: {top_dish}")
            nutrition_data = dish_service.get_nutrition_for_dish(top_dish)
            print(f"📊 Nutrition data source: {nutrition_data.get('source', 'unknown')}")
            print(f"📊 Nutrition data content: {nutrition_data}")

            if nutrition_data and nutrition_data.get('success') and 'nutrients' in nutrition_data:
                    if 'fats' not in nutrition_data['nutrients']:
                        print(f"🔄 Adding fat fallback for: {top_dish}")
                        known_fat_values = {
                            'pizza': 8.0, 'burger': 12.0, 'pasta': 2.0, 'sandwich': 10.0,
                            'chicken': 3.6, 'beef': 15.0, 'fish': 5.0, 'rice': 0.3,
                            'salad': 1.0, 'soup': 3.0, 'bread': 1.0, 'cheese': 9.0
                        }
                        
                        for food, fat_value in known_fat_values.items():
                            if food in top_dish.lower():
                                nutrition_data['nutrients']['fats'] = f"{fat_value}g/100g"
                                print(f"✅ Added fat value for {top_dish}: {fat_value}g")
                                break
        else:
            print("⚠️ No predictions found for nutrition data")
        
        return {
            "success": True,
            "message": "Dish recognition completed",
            "prediction": prediction_result,
            "nutrition": nutrition_data,
            "service_used": "dish_recognition_mobilenetv2"
        }
        
    except Exception as e:
        raise HTTPException(500, f"Dish recognition error: {str(e)}")
        

if __name__ == "__main__":
    print("🚀 Starting SmartNutritrack AI Food API...")
    print("📡 Available endpoints:")
    print("   GET  /")
    print("   GET  /health")
    print("   POST /api/scan/food")
    print("   POST /api/scan/barcode")
    print("   GET  /api/nutrition/{food_name}")
    print("   POST /api/planner/suggest")
    print("   POST /api/recommend-meal") 
    print("🌐 Server: http://localhost:8000")
    

    uvicorn.run(app, host="0.0.0.0", port=8000)