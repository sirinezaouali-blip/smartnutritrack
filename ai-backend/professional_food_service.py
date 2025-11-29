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
from dish_service import DishRecognitionService

class ProfessionalFoodService:
    def __init__(self):
        self.model = None
        self.food_classes = self.get_food_classes()
        self.retriever = None
        self.load_model()
        self.init_meal_recommendations()
    
    def load_model(self):
        """Load your fine-tuned VGG16 model for 34 fruit/vegetable classes"""
        try:
            print("🔄 Loading your fine-tuned VGG16 model...")
            
            # First, let's check what's in the model file
            import h5py
            with h5py.File('best_model.h5', 'r') as f:
                print("📁 Model file structure:")
                def print_attrs(name, obj):
                    print(f"   {name}: {list(obj.attrs.keys())}")
                f.visititems(print_attrs)
            
            # Try different loading methods
            try:
                # Method 1: Load as complete model
                self.model = tf.keras.models.load_model('best_model.h5')
                print("✅ Model loaded with tf.keras.models.load_model")
            except:
                # Method 2: Load with custom objects
                self.model = tf.keras.models.load_model(
                    'best_model.h5', 
                    custom_objects={},
                    compile=False
                )
                print("✅ Model loaded with custom objects")
            
            print("📊 Model summary:")
            self.model.summary()
            
            # Define your 34 specific classes
            self.food_classes = [
                "Apple", "Avocado", "Banana", "Blackberry", "Blueberry", "Broccoli",
                "Cabbage", "Capsicum", "Carrot", "Corn", "Cucumber", "Dates",
                "Eggplant", "Fig", "Garlic", "Grapes", "Kiwi", "Lemon", "Lettuce",
                "Mango", "Mushroom", "Olive", "Onion", "Orange", "Pear", "Peas",
                "Pineapple", "Pomegranate", "Potato", "Pumpkin", "Raddish", "Strawberry",
                "Tomato", "Watermelon"
            ]
            
            print(f"📊 Number of classes: {len(self.food_classes)} (fruits & vegetables)")
            
        except Exception as e:
            print(f"❌ Error loading your VGG16 model: {e}")
            print("🔄 Attempting to build model from scratch with loaded weights...")
            self._build_model_from_scratch()
    
    def _build_model_from_scratch(self):
        """Build the EXACT model architecture from your notebook"""
        try:
            IMG_HEIGHT = 224
            IMG_WIDTH = 224
            BATCH_SIZE = 32
            
            print("🔄 Building EXACT model architecture from your notebook...")
            
            # =====================
            # EXACTLY from your notebook - Build Model
            # =====================
            base_model = tf.keras.applications.VGG16(
                weights='imagenet', 
                include_top=False, 
                input_shape=(IMG_HEIGHT, IMG_WIDTH, 3)
            )
            
            # =====================
            # EXACTLY from your notebook - Apply fine-tuning
            # =====================
            base_model.trainable = True
            # Freeze first few layers to avoid overfitting - EXACT from notebook
            for layer in base_model.layers[:-4]:
                layer.trainable = False

            # =====================
            # EXACTLY from your notebook - Model Architecture
            # =====================
            self.model = tf.keras.Sequential([
                base_model,
                tf.keras.layers.GlobalAveragePooling2D(),
                tf.keras.layers.Dense(512, activation='relu'),
                tf.keras.layers.Dropout(0.5),
                tf.keras.layers.Dense(34, activation='softmax')  # 34 classes EXACT
            ])

            # =====================
            # EXACTLY from your notebook - Compile with same settings
            # =====================
            self.model.compile(
                optimizer=tf.keras.optimizers.Adam(1e-5),  # Lower learning rate for fine-tuning
                loss='categorical_crossentropy',
                metrics=['accuracy']
            )

            print("✅ EXACT model architecture built from notebook!")
            print("📊 Loading your trained weights...")
            
            # Load the weights - this should work now with exact architecture
            self.model.load_weights('best_model.h5')
            
            print("🎯 YOUR FINE-TUNED VGG16 MODEL LOADED SUCCESSFULLY!")
            print("📊 Model summary:")
            self.model.summary()
            
        except Exception as e:
            print(f"❌ Failed to build exact model: {e}")
            print("🔍 Let's try diagnostic loading...")
            self._diagnostic_model_loading()

    def _diagnostic_model_loading(self):
        """Diagnostic approach to load your model"""
        try:
            print("🔍 Running diagnostic model loading...")
            
            # Try loading with different approaches
            import h5py
            
            # Check model file integrity
            with h5py.File('best_model.h5', 'r') as f:
                print("📁 Model file analysis:")
                if 'model_weights' in f:
                    print("   - Contains model weights")
                if 'model_config' in f:
                    print("   - Contains model configuration")
                if 'training_config' in f:
                    print("   - Contains training configuration")
            
            # Try legacy Keras loading
            try:
                import keras
                self.model = keras.models.load_model('best_model.h5')
                print("✅ Loaded with legacy Keras!")
            except:
                # Try TensorFlow with custom objects
                self.model = tf.keras.models.load_model(
                    'best_model.h5',
                    custom_objects={
                        'Adam': tf.keras.optimizers.Adam,
                        'categorical_crossentropy': tf.keras.losses.categorical_crossentropy
                    },
                    compile=False
                )
                print("✅ Loaded with TensorFlow custom objects!")
                
        except Exception as e:
            print(f"❌ Diagnostic loading failed: {e}")
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
        """Your 34 specific fruit and vegetable classes"""
        return [
            "Apple", "Avocado", "Banana", "Blackberry", "Blueberry", "Broccoli",
            "Cabbage", "Capsicum", "Carrot", "Corn", "Cucumber", "Dates",
            "Eggplant", "Fig", "Garlic", "Grapes", "Kiwi", "Lemon", "Lettuce",
            "Mango", "Mushroom", "Olive", "Onion", "Orange", "Pear", "Peas",
            "Pineapple", "Pomegranate", "Potato", "Pumpkin", "Raddish", "Strawberry",
            "Tomato", "Watermelon"
        ]
    
    def preprocess_image(self, image_data):
        """Preprocess image EXACTLY as in training"""
        try:
            # Load image from bytes
            img = Image.open(io.BytesIO(image_data))
            
            # Convert to RGB if needed
            if img.mode != 'RGB':
                img = img.convert('RGB')
            
            # Resize to model input size (same as training)
            img = img.resize((224, 224))
            
            # Convert to numpy array
            img_array = np.array(img)
            
            # ✅ CRITICAL: Use SAME preprocessing as training (rescale 1./255)
            img_array = img_array / 255.0  # Same as rescale=1./255
            
            # Add batch dimension
            img_array = np.expand_dims(img_array, axis=0)
            
            return img_array
            
        except Exception as e:
            raise ValueError(f"Error preprocessing image: {str(e)}")
    
    def predict_food(self, image_data):
        """Predict food using your fine-tuned VGG16 model"""
        if self.model is None:
            raise RuntimeError("Your VGG16 model not loaded")
        
        try:
            print(f"🔍 Image data size: {len(image_data)} bytes")
            
            # Preprocess image
            processed_image = self.preprocess_image(image_data)
            print(f"📐 Preprocessed image shape: {processed_image.shape}")
            print(f"📐 Image min/max values: {processed_image.min():.3f} / {processed_image.max():.3f}")
            
            # Make prediction
            predictions = self.model.predict(processed_image, verbose=0)
            print(f"🎯 Raw predictions shape: {predictions.shape}")
            print(f"🎯 Sum of all predictions: {predictions[0].sum():.3f}")
            
            # Print ALL 34 class predictions
            print("📊 All 34 class predictions:")
            for i, (class_name, prob) in enumerate(zip(self.food_classes, predictions[0])):
                if prob > 0.01:  # Only print if > 1%
                    print(f"   {i:2d}. {class_name:15s}: {prob:.4f} ({prob*100:.2f}%)")
            
            # Get results
            predicted_class_idx = np.argmax(predictions[0])
            confidence = predictions[0][predicted_class_idx]
            predicted_class = self.food_classes[predicted_class_idx]
            
            print(f"\n🎯 FINAL PREDICTION:")
            print(f"   Index: {predicted_class_idx}")
            print(f"   Class: {predicted_class}")
            print(f"   Confidence: {confidence:.4f} ({confidence*100:.2f}%)")
            
            # Get top 5 predictions
            top_5_indices = np.argsort(predictions[0])[-5:][::-1]
            print(f"\n🔝 Top 5 predictions:")
            
            all_predictions = []
            
            for i, idx in enumerate(top_5_indices):
                prediction_item = {
                    "food_name": self.food_classes[idx],
                    "confidence": float(predictions[0][idx]),
                    "category": "fruit" if self.food_classes[idx] in ["Apple", "Banana", "Orange", "Grapes", "Strawberry", "Blueberry", "Blackberry", "Kiwi", "Lemon", "Mango", "Pineapple", "Watermelon", "Pear", "Fig", "Pomegranate", "Dates"] else "vegetable"
                }
                all_predictions.append(prediction_item)
                print(f"   {i+1}. {prediction_item['food_name']:15s}: {prediction_item['confidence']:.4f} ({prediction_item['confidence']*100:.2f}%)")
            
            return {
                "top_prediction": all_predictions[0],
                "all_predictions": all_predictions,
                "model_used": "vgg16_fine_tuned_fruits_vegetables",
                "total_predictions": len(all_predictions)
            }
            
        except Exception as e:
            print(f"❌ Prediction error details: {str(e)}")
            import traceback
            traceback.print_exc()
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
            
            # Try USDA API first with better query
            usda_url = "https://api.nal.usda.gov/fdc/v1/foods/search"
            
            # Add "raw" or "fresh" to get unprocessed food results
            search_terms = f"{clean_name} raw fresh"
            
            params = {
                'query': search_terms,
                'api_key': 'DEMO_KEY',
                'pageSize': 5,
                'dataType': ['Survey (FNDDS)', 'SR Legacy']
            }
            
            response = requests.get(usda_url, params=params, timeout=10)
            if response.status_code == 200:
                data = response.json()
                if data['foods']:
                    # Filter for raw/fresh foods
                    best_match = None
                    for food in data['foods']:
                        description = food.get('description', '').lower()
                        if ('raw' in description or 'fresh' in description or 
                            description.startswith(clean_name)):
                            best_match = food
                            break
                    
                    if not best_match:
                        best_match = data['foods'][0]
                    
                    print(f"✅ Found: {best_match.get('description', '')}")
                    
                    # FIX: Extract nutrition values properly
                    nutrients = {}
                    
                    for nutrient in best_match.get('foodNutrients', []):
                        name = nutrient.get('nutrientName', '')
                        value = nutrient.get('value', 0)
                        unit = nutrient.get('unitName', '')
                        
                        # FIX: Properly extract and convert values
                        if 'Energy' in name and ('kcal' in unit.lower() or 'calorie' in name.lower()):
                            nutrients['calories'] = float(value) if value else 0
                        elif 'Protein' in name:
                            nutrients['protein'] = float(value) if value else 0
                        elif 'Total lipid' in name or 'Fat' in name or 'Fatty acids' in name:
                            nutrients['fats'] = float(value) if value else 0
                        elif 'Carbohydrate' in name:
                            nutrients['carbs'] = float(value) if value else 0
                        elif 'Fiber' in name:
                            nutrients['fiber'] = float(value) if value else 0
                        elif 'Sugar' in name:
                            nutrients['sugar'] = float(value) if value else 0
                    
                    # FIX: Add fallback values if fats is 0
                    if nutrients.get('fats', 0) == 0:
                        # Use known fat values for common foods
                        known_fat_values = {
                            'avocado': 14.7, 'pizza': 8.0, 'cheese': 9.0, 'chicken': 3.6,
                            'beef': 15.0, 'pork': 20.0, 'salmon': 13.0, 'egg': 5.0,
                            'milk': 3.6, 'yogurt': 3.3, 'butter': 81.0, 'oil': 100.0,
                            'nuts': 50.0, 'seeds': 45.0, 'chocolate': 30.0, 'bread': 1.0
                        }
                        
                        for food, fat_value in known_fat_values.items():
                            if food in clean_name:
                                nutrients['fats'] = fat_value
                                print(f"🔄 Using known fat value for {clean_name}: {fat_value}g")
                                break
                    
                    if nutrients:
                        return {
                            'success': True,
                            'food_name': best_match.get('description', food_name),
                            'data': {
                                'nutrients': nutrients,
                                'source': 'USDA FoodData Central',
                                'serving_size': best_match.get('servingSize', 'N/A'),
                                'serving_unit': best_match.get('servingSizeUnit', 'N/A'),
                                'success': True
                            }
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
                         nutrition_data['fats'] = f"{nutrients['fat_100g']}g/100g"
                    if nutrients.get('carbohydrates_100g'):
                        nutrition_data['carbs'] = f"{nutrients['carbohydrates_100g']}g/100g"
                    if nutrients.get('fiber_100g'):
                        nutrition_data['fiber'] = f"{nutrients['fiber_100g']}g/100g"
                    if nutrients.get('sugars_100g'):
                        nutrition_data['sugar'] = f"{nutrients['sugars_100g']}g/100g"
                    
                    if 'fats' not in nutrition_data:
                        print(f"🔄 Open Food Facts missing fats for {clean_name}, adding fallback")
                        known_fat_values = {
                            'apple': 0.2, 'avocado': 14.7, 'banana': 0.3, 'blackberry': 0.4,
                            'blueberry': 0.3, 'broccoli': 0.4, 'cabbage': 0.1, 'capsicum': 0.2,
                            'carrot': 0.2, 'corn': 1.2, 'cucumber': 0.1, 'dates': 0.4,
                            'eggplant': 0.2, 'fig': 0.3, 'garlic': 0.5, 'grapes': 0.4,
                            'kiwi': 0.5, 'lemon': 0.3, 'lettuce': 0.2, 'mango': 0.4,
                            'mushroom': 0.3, 'olive': 11.0, 'onion': 0.1, 'orange': 0.1,
                            'pear': 0.1, 'peas': 0.4, 'pineapple': 0.1, 'pomegranate': 0.3,
                            'potato': 0.1, 'pumpkin': 0.1, 'raddish': 0.1, 'strawberry': 0.3,
                            'tomato': 0.2, 'watermelon': 0.2
                        }
                        
                        for food, fat_value in known_fat_values.items():
                            if food in clean_name:
                                nutrition_data['fats'] = f"{fat_value}g/100g"
                                print(f"✅ Added fat value for {clean_name}: {fat_value}g")
                                break
                    
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