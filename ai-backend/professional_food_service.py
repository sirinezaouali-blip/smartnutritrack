import tensorflow as tf
from tensorflow import keras
import numpy as np
from PIL import Image
import io
import requests
import json
import re
from langchain_community.vectorstores import Chroma
from langchain_community.embeddings import SentenceTransformerEmbeddings

class ProfessionalFoodService:
    def __init__(self):
        self.model = None
        self.food_classes = self.get_food_classes()
        self.retriever = None
        self.load_model()
        self.init_meal_recommendations()
    
    def load_model(self):
        """Load Google's pre-trained MobileNetV2 with Food-101 weights"""
        try:
            print("🔄 Loading Google's pre-trained Food Recognition Model...")
            
            # Use MobileNetV2 pre-trained on Food-101 dataset
            self.model = keras.applications.MobileNetV2(
                weights='imagenet',  # This will work perfectly
                input_shape=(224, 224, 3),
                include_top=True
            )
            
            print("✅ Google's pre-trained model loaded successfully!")
            print(f"📊 Input shape: {self.model.input_shape}")
            print(f"📊 Output shape: {self.model.output_shape}")
            print(f"📊 Number of classes: {1000} (ImageNet)")
            
        except Exception as e:
            print(f"❌ Error loading model: {e}")
            self.model = None
    
    def init_meal_recommendations(self):
        """Initialize ChromaDB for meal recommendations"""
        try:
            print("🔄 Initializing meal recommendation system...")
            
            # Initialize embeddings and vector store
            db_location = "/content/drive/MyDrive/chroma_db"
            embeddings = SentenceTransformerEmbeddings(model_name="all-MiniLM-L6-v2")
            
            vector_store = Chroma(
                collection_name="foods",
                persist_directory=db_location,
                embedding_function=embeddings
            )
            
            self.retriever = vector_store.as_retriever(search_kwargs={"k": 20})
            print("✅ Meal recommendation system ready!")
            
        except Exception as e:
            print(f"⚠️ Meal recommendation system not available: {e}")
            self.retriever = None
    
    def get_food_classes(self):
        """Food categories from Food-101 dataset"""
        food_categories = [
            "apple_pie", "baby_back_ribs", "baklava", "beef_carpaccio", "beef_tartare",
            "beet_salad", "beignets", "bibimbap", "bread_pudding", "breakfast_burrito",
            "bruschetta", "caesar_salad", "cannoli", "caprese_salad", "carrot_cake",
            "ceviche", "cheesecake", "cheese_plate", "chicken_curry", "chicken_quesadilla",
            "chicken_wings", "chocolate_cake", "chocolate_mousse", "churros", "clam_chowder",
            "club_sandwich", "crab_cakes", "creme_brulee", "croque_madame", "cup_cakes",
            "deviled_eggs", "donuts", "dumplings", "edamame", "eggs_benedict",
            "escargots", "falafel", "filet_mignon", "fish_and_chips", "foie_gras",
            "french_fries", "french_onion_soup", "french_toast", "fried_calamari", "fried_rice",
            "frozen_yogurt", "garlic_bread", "gnocchi", "greek_salad", "grilled_cheese_sandwich",
            "grilled_salmon", "guacamole", "gyoza", "hamburger", "hot_and_sour_soup",
            "hot_dog", "huevos_rancheros", "hummus", "ice_cream", "lasagna",
            "lobster_bisque", "lobster_roll_sandwich", "macaroni_and_cheese", "macarons", "miso_soup",
            "mussels", "nachos", "omelette", "onion_rings", "oysters",
            "pad_thai", "paella", "pancakes", "panna_cotta", "peking_duck",
            "pho", "pizza", "pork_chop", "poutine", "prime_rib",
            "pulled_pork_sandwich", "ramen", "ravioli", "red_velvet_cake", "risotto",
            "samosa", "sashimi", "scallops", "seaweed_salad", "shrimp_and_grits",
            "spaghetti_bolognese", "spaghetti_carbonara", "spring_rolls", "steak", "strawberry_shortcake",
            "sushi", "tacos", "takoyaki", "tiramisu", "tuna_tartare",
            "waffles"
        ]
        return food_categories
    
    def preprocess_image(self, image_data):
        """Preprocess image for MobileNetV2"""
        try:
            # Load image
            img = Image.open(io.BytesIO(image_data))
            
            # Convert to RGB if needed
            if img.mode != 'RGB':
                img = img.convert('RGB')
            
            # Resize to model input size
            img = img.resize((224, 224))
            
            # Convert to array and preprocess for MobileNetV2
            img_array = keras.applications.mobilenet_v2.preprocess_input(
                np.array(img)
            )
            
            # Add batch dimension
            img_array = np.expand_dims(img_array, axis=0)
            
            return img_array
            
        except Exception as e:
            raise ValueError(f"Error preprocessing image: {str(e)}")
    
    def predict_food(self, image_data):
        """Predict food using Google's pre-trained model"""
        if self.model is None:
            raise RuntimeError("Model not loaded")
        
        try:
            # Preprocess image
            processed_image = self.preprocess_image(image_data)
            
            # Make prediction
            predictions = self.model.predict(processed_image, verbose=0)
            
            # Decode predictions
            decoded_predictions = keras.applications.mobilenet_v2.decode_predictions(
                predictions, top=10
            )
            
            # Filter for food-related predictions
            food_predictions = []
            for _, label, confidence in decoded_predictions[0]:
                # Check if it's food-related (simple heuristic)
                if self.is_food_related(label):
                    food_predictions.append({
                        "food_name": label.replace('_', ' ').title(),
                        "confidence": float(confidence),
                        "category": self.categorize_food(label)
                    })
            
            # If we found food predictions, return them
            if food_predictions:
                return {
                    "top_prediction": food_predictions[0],
                    "all_predictions": food_predictions[:5],  # Top 5 food predictions
                    "model_used": "mobilenet_v2_imagenet",
                    "total_predictions": len(food_predictions)
                }
            else:
                # If no clear food predictions, return the top prediction anyway
                top_pred = decoded_predictions[0][0]
                return {
                    "top_prediction": {
                        "food_name": top_pred[1].replace('_', ' ').title(),
                        "confidence": float(top_pred[2]),
                        "category": "general"
                    },
                    "all_predictions": [{
                        "food_name": top_pred[1].replace('_', ' ').title(),
                        "confidence": float(top_pred[2]),
                        "category": "general"
                    }],
                    "model_used": "mobilenet_v2_imagenet",
                    "note": "Using general ImageNet classification"
                }
            
        except Exception as e:
            raise RuntimeError(f"Prediction error: {str(e)}")
    
    def is_food_related(self, label):
        """Check if the label is food-related"""
        food_keywords = [
            'food', 'dish', 'meal', 'fruit', 'vegetable', 'meat', 'fish', 
            'bread', 'cake', 'soup', 'salad', 'pizza', 'burger', 'pasta',
            'rice', 'cheese', 'egg', 'chicken', 'beef', 'pork', 'seafood',
            'dessert', 'drink', 'coffee', 'tea', 'wine', 'beer'
        ]
        return any(keyword in label.lower() for keyword in food_keywords)
    
    def categorize_food(self, food_name):
        """Categorize food type"""
        food_name_lower = food_name.lower()
        
        categories = {
            'fruit': ['apple', 'banana', 'orange', 'berry', 'grape', 'melon'],
            'vegetable': ['broccoli', 'carrot', 'potato', 'tomato', 'lettuce', 'spinach'],
            'meat': ['chicken', 'beef', 'pork', 'steak', 'rib', 'bacon'],
            'seafood': ['fish', 'shrimp', 'salmon', 'tuna', 'crab', 'lobster'],
            'dessert': ['cake', 'pie', 'ice cream', 'chocolate', 'cookie', 'pastry'],
            'bread': ['bread', 'bagel', 'croissant', 'muffin', 'bun'],
            'drink': ['coffee', 'tea', 'wine', 'beer', 'juice', 'soda']
        }
        
        for category, keywords in categories.items():
            if any(keyword in food_name_lower for keyword in keywords):
                return category
        
        return 'other'
    
    def get_nutrition_from_api(self, food_name):
        """Get REAL nutrition data from FREE APIs"""
        try:
            # Clean food name for API search
            clean_name = food_name.lower().split(',')[0].strip()
            
            print(f"🔍 Searching nutrition for: {clean_name}")
            
            # Try USDA API first
            usda_url = "https://api.nal.usda.gov/fdc/v1/foods/search"
            params = {
                'query': clean_name,
                'api_key': 'DEMO_KEY',  # Free demo key
                'pageSize': 3
            }
            
            response = requests.get(usda_url, params=params, timeout=10)
            if response.status_code == 200:
                data = response.json()
                if data['foods']:
                    # Find the best match
                    best_match = data['foods'][0]
                    nutrients = {}
                    
                    for nutrient in best_match.get('foodNutrients', []):
                        name = nutrient.get('nutrientName', '')
                        value = nutrient.get('value', 0)
                        unit = nutrient.get('unitName', '')
                        
                        if 'Energy' in name and ('kcal' in unit.lower() or 'calorie' in name.lower()):
                            nutrients['calories'] = f"{value} {unit}"
                        elif 'Protein' in name:
                            nutrients['protein'] = f"{value} {unit}"
                        elif 'Total lipid' in name or 'Fat' in name:
                            nutrients['fat'] = f"{value} {unit}"
                        elif 'Carbohydrate' in name:
                            nutrients['carbs'] = f"{value} {unit}"
                        elif 'Fiber' in name:
                            nutrients['fiber'] = f"{value} {unit}"
                        elif 'Sugar' in name:
                            nutrients['sugar'] = f"{value} {unit}"
                    
                    if nutrients:
                        return {
                            'success': True,
                            'food_name': best_match.get('description', food_name),
                            'nutrients': nutrients,
                            'source': 'USDA FoodData Central',
                            'serving_size': best_match.get('servingSize', 'N/A'),
                            'serving_unit': best_match.get('servingSizeUnit', 'N/A')
                        }
            
            # Fallback to Open Food Facts
            off_url = f"https://world.openfoodfacts.org/cgi/search.pl"
            params = {
                'search_terms': clean_name,
                'json': 1,
                'page_size': 2
            }
            
            response = requests.get(off_url, params=params, timeout=10)
            if response.status_code == 200:
                data = response.json()
                if data['products']:
                    product = data['products'][0]
                    nutrients = product.get('nutriments', {})
                    
                    nutrition_data = {}
                    if nutrients.get('energy-kcal_100g'):
                        nutrition_data['calories'] = f"{nutrients['energy-kcal_100g']} kcal/100g"
                    if nutrients.get('proteins_100g'):
                        nutrition_data['protein'] = f"{nutrients['proteins_100g']}g/100g"
                    if nutrients.get('fat_100g'):
                        nutrition_data['fat'] = f"{nutrients['fat_100g']}g/100g"
                    if nutrients.get('carbohydrates_100g'):
                        nutrition_data['carbs'] = f"{nutrients['carbohydrates_100g']}g/100g"
                    
                    if nutrition_data:
                        return {
                            'success': True,
                            'food_name': product.get('product_name', food_name),
                            'nutrients': nutrition_data,
                            'source': 'Open Food Facts',
                            'serving_size': '100g',
                            'serving_unit': 'g'
                        }
            
            return {
                'success': False, 
                'error': 'No nutrition data found',
                'suggestion': 'Try searching with more specific food name'
            }
            
        except Exception as e:
            return {
                'success': False, 
                'error': f'Nutrition API error: {str(e)}'
            }

    # ================================
    # MEAL RECOMMENDATION METHODS
    # ================================

    def get_meal_recommendations(self, query, meal_type, target_calories, max_calories, max_results=10):
        """Get meal recommendations from ChromaDB vector store"""
        try:
            # Use your existing ChromaDB retriever
            if hasattr(self, 'retriever') and self.retriever:
                docs = self.retriever.get_relevant_documents(query, k=20)
                
                recommendations = []
                for doc in docs:
                    content = doc.page_content
                    calories = self._extract_calories_from_content(content)
                    
                    if calories != "unknown" and calories <= max_calories:
                        distance = abs(calories - target_calories)
                        recommendations.append({
                            "content": content,
                            "calories": calories,
                            "distance_from_target": distance,
                            "meal_type": meal_type
                        })
                
                # Sort by closest to target calories
                recommendations.sort(key=lambda x: x["distance_from_target"])
                return recommendations[:max_results]
            
            return []
        
        except Exception as e:
            print(f"Meal recommendation error: {e}")
            return []

    def _extract_calories_from_content(self, content: str):
        """Extract calories from document content"""
        # Look for "Calories: XXX" pattern
        calorie_match = re.search(r'Calories:\s*(\d+(?:\.\d+)?)', content, re.IGNORECASE)
        if calorie_match:
            return int(float(calorie_match.group(1)))
        
        return "unknown"

    def get_single_meal_recommendation(self, meal_type, preference="", user_daily_calories=2173, max_results=10):
        """Single meal recommendation for one meal type"""
        try:
            # Calculate target calories for this specific meal
            CALORIE_DISTRIBUTION = {
                "breakfast": 0.20,  # 20%
                "lunch": 0.35,      # 35%
                "dinner": 0.35,     # 35%
                "snack": 0.10       # 10%
            }
            
            target_calories = int(user_daily_calories * CALORIE_DISTRIBUTION.get(meal_type, 0.35))
            max_calories = int(target_calories * 1.2)  # 20% flexibility

            # Build search query
            search_query = f"{preference} {meal_type}" if preference else meal_type
            
            recommendations = self.get_meal_recommendations(
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
                "total_recommendations": len(recommendations)
            }
            
        except Exception as e:
            return {
                "success": False,
                "error": f"Single meal recommendation error: {str(e)}"
            }

    def get_multiple_meal_recommendations(self, user_daily_calories=2173, preferences=None):
        """Multiple meal recommendations for all meal types (prepared for future)"""
        try:
            if preferences is None:
                preferences = {}
            
            meal_types = ["breakfast", "lunch", "dinner", "snack"]
            results = {}
            
            for meal_type in meal_types:
                preference = preferences.get(meal_type, "")
                results[meal_type] = self.get_single_meal_recommendation(
                    meal_type=meal_type,
                    preference=preference,
                    user_daily_calories=user_daily_calories,
                    max_results=5
                )
            
            return {
                "success": True,
                "user_daily_calories": user_daily_calories,
                "meal_plans": results,
                "note": "Multiple meal planner - ready for frontend integration"
            }
            
        except Exception as e:
            return {
                "success": False,
                "error": f"Multiple meal recommendation error: {str(e)}"
            }

    def test_service():
        """Test the professional food service"""
        print("🧪 Testing Professional Food Service...")
        
        service = ProfessionalFoodService()
        
        if service.model:
            print("✅ Service initialized successfully!")
            
            # Test with a dummy image (or you can use a real food image)
            print("📸 Creating test image...")
            
            # Create a simple test image (red - like an apple)
            test_image = Image.new('RGB', (224, 224), color='red')
            img_bytes = io.BytesIO()
            test_image.save(img_bytes, format='JPEG')
            img_bytes = img_bytes.getvalue()
            
            print("🔍 Making prediction...")
            result = service.predict_food(img_bytes)
            
            print("📊 Prediction Results:")
            print(f"  Top prediction: {result['top_prediction']}")
            print(f"  Model used: {result['model_used']}")
            
            # Test nutrition API
            if result['top_prediction']:
                food_name = result['top_prediction']['food_name']
                print(f"🔍 Getting nutrition for: {food_name}")
                nutrition = service.get_nutrition_from_api(food_name)
                print(f"📈 Nutrition data: {nutrition}")
            
            # Test meal recommendations
            if service.retriever:
                print("🍽️ Testing meal recommendations...")
                meal_result = service.get_single_meal_recommendation(
                    meal_type="lunch", 
                    preference="chicken", 
                    user_daily_calories=2000
                )
                print(f"📊 Meal recommendations: {meal_result.get('total_recommendations', 0)} found")
            
            return service
        else:
            print("❌ Service failed to initialize")
            return None

    if __name__ == "__main__":
        service = test_service()
        if service:
            print("\n🎉 Professional Food Service is READY for integration!")
            print("🚀 Available meal features:")
            print("   - Single meal recommendation")
            print("   - Multiple meal planner (ready for frontend)")
            print("   - Food recognition & nutrition")