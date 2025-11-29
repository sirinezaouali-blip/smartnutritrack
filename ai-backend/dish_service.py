import tensorflow as tf
import numpy as np
from PIL import Image
import io
import requests
from typing import List, Dict, Any

class DishRecognitionService:
    def __init__(self):
        self.model = None
        self.load_model()
    
    def load_model(self):
        """Load MobileNetV2 for general dish recognition"""
        try:
            print("🍽️ Loading MobileNetV2 for dish recognition...")
            self.model = tf.keras.applications.MobileNetV2(
                weights='imagenet',
                input_shape=(224, 224, 3)
            )
            print("✅ MobileNetV2 loaded successfully for dish recognition!")
        except Exception as e:
            print(f"❌ Error loading MobileNetV2: {e}")
            self.model = None
    
    def preprocess_image(self, image_data: bytes) -> np.ndarray:
        """Preprocess image for MobileNetV2"""
        try:
            # Load image from bytes
            img = Image.open(io.BytesIO(image_data))
            
            # Convert to RGB if needed
            if img.mode != 'RGB':
                img = img.convert('RGB')
            
            # Resize to model input size
            img = img.resize((224, 224))
            
            # Convert to numpy array
            img_array = np.array(img)
            
            # Preprocess for MobileNetV2
            img_array = tf.keras.applications.mobilenet_v2.preprocess_input(img_array)
            
            # Add batch dimension
            img_array = np.expand_dims(img_array, axis=0)
            
            return img_array
            
        except Exception as e:
            raise ValueError(f"Error preprocessing image: {str(e)}")
    
    def recognize_dish(self, image_data: bytes) -> Dict[str, Any]:
        """Recognize general dishes using MobileNetV2"""
        if self.model is None:
            raise RuntimeError("MobileNetV2 model not loaded")
        
        try:
            # Preprocess image
            processed_image = self.preprocess_image(image_data)
            
            # Make prediction
            predictions = self.model.predict(processed_image, verbose=0)
            
            # Decode predictions
            decoded = tf.keras.applications.mobilenet_v2.decode_predictions(predictions, top=10)[0]
            
            # Filter for food-related predictions
            food_results = []
            food_keywords = [
                'food', 'dish', 'meal', 'cuisine', 'pizza', 'burger', 'sushi', 
                'pasta', 'rice', 'bread', 'sandwich', 'soup', 'salad', 'cake',
                'pie', 'ice cream', 'steak', 'chicken', 'fish', 'seafood',
                'taco', 'burrito', 'curry', 'noodle', 'pancake', 'waffle',
                'cheese', 'egg', 'coffee', 'tea', 'wine', 'beer'
            ]
            
            for _, label, confidence in decoded:
                label_lower = label.lower()
                
                # Check if it's food-related
                if any(keyword in label_lower for keyword in food_keywords) or confidence > 0.1:
                    food_results.append({
                        'food_name': label,
                        'confidence': float(confidence),
                        'category': self._categorize_dish(label),
                        'source': 'MobileNetV2_ImageNet'
                    })
                
                if len(food_results) >= 5:
                    break
            
            return {
                'success': True,
                'predictions': food_results,
                'model_used': 'mobilenet_v2_imagenet',
                'total_predictions': len(food_results)
            }
            
        except Exception as e:
            raise RuntimeError(f"Dish recognition error: {str(e)}")
    
    def _categorize_dish(self, dish_name: str) -> str:
        """Categorize dish type"""
        dish_lower = dish_name.lower()
        
        categories = {
            'pizza': ['pizza'],
            'burger': ['burger', 'hamburger'],
            'pasta': ['pasta', 'spaghetti', 'lasagna', 'ravioli'],
            'asian': ['sushi', 'ramen', 'noodle', 'curry', 'taco', 'burrito'],
            'sandwich': ['sandwich', 'hotdog', 'burrito'],
            'soup': ['soup', 'stew', 'broth'],
            'salad': ['salad'],
            'dessert': ['cake', 'pie', 'ice cream', 'chocolate', 'cookie', 'pastry'],
            'breakfast': ['pancake', 'waffle', 'omelette', 'breakfast'],
            'meat': ['steak', 'chicken', 'pork', 'rib', 'bacon'],
            'seafood': ['fish', 'shrimp', 'salmon', 'tuna', 'crab', 'lobster'],
            'beverage': ['coffee', 'tea', 'wine', 'beer', 'juice']
        }
        
        for category, keywords in categories.items():
            if any(keyword in dish_lower for keyword in keywords):
                return category
        
        return 'other'
    
    def get_nutrition_for_dish(self, dish_name: str) -> Dict[str, Any]:
        """Get nutrition data for dishes"""
        try:
            # Clean dish name for API search
            clean_name = dish_name.lower().strip()
            print(f"🔍 Getting nutrition for: {clean_name}")
            
            # Try USDA API first
            usda_url = "https://api.nal.usda.gov/fdc/v1/foods/search"
            params = {
                'query': clean_name,
                'api_key': 'DEMO_KEY',
                'pageSize': 3
            }
            
            print("🌐 Trying USDA API...")
            response = requests.get(usda_url, params=params, timeout=10)
            if response.status_code == 200:
                data = response.json()
                if data['foods']:
                    print(f"✅ USDA API found {len(data['foods'])} foods")
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
                        elif 'Total lipid' in name or 'Fat' in name or 'Fatty acids' in name:
                            nutrients['fats'] = float(value) if value else 0
                        elif 'Carbohydrate' in name:
                            nutrients['carbs'] = f"{value} {unit}"
                        elif 'Fiber' in name:
                            nutrients['fiber'] = f"{value} {unit}"

                    # FIX: Ensure we have fats value
                    print(f"🔍 Checking fats value for {clean_name}: {nutrients.get('fats', 'not set')}")
                    if nutrients.get('fats', 0) == 0:
                        print(f"🔄 Fat fallback triggered for {clean_name}")
                        # Use known fat values for common foods
                        known_fat_values = {
                            'pizza': 8.0, 'burger': 12.0, 'pasta': 2.0, 'sandwich': 10.0,
                            'chicken': 3.6, 'beef': 15.0, 'fish': 5.0, 'rice': 0.3,
                            'salad': 1.0, 'soup': 3.0, 'bread': 1.0, 'cheese': 9.0
                        }
                        
                        for food, fat_value in known_fat_values.items():
                            if food in clean_name:
                                nutrients['fats'] = fat_value
                                print(f"✅ Using known fat value for {clean_name}: {fat_value}g")
                                break
                    
                    if nutrients:
                        print(f"📊 USDA returning nutrients: {nutrients}")
                        return {
                            'success': True,
                            'food_name': best_match.get('description', dish_name),
                            'nutrients': nutrients,
                            'source': 'USDA FoodData Central',
                            'serving_size': best_match.get('servingSize', 'N/A'),
                            'serving_unit': best_match.get('servingSizeUnit', 'N/A')
                        }
                    
                    else:
                       print("❌ USDA API found no foods")
            else:
                print(f"❌ USDA API failed: {response.status_code}")   
            
            print("🌐 Trying Open Food Facts API...")
            # Fallback to Open Food Facts for packaged foods
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
                    print(f"✅ Open Food Facts found {len(data['products'])} products")
                    product = data['products'][0]
                    nutrients = product.get('nutriments', {})
                    print(f"📊 Open Food Facts nutrients: {nutrients}")
                    
                    nutrition_data = {}
                    if nutrients.get('energy-kcal_100g'):
                        nutrition_data['calories'] = f"{nutrients['energy-kcal_100g']} kcal/100g"
                    if nutrients.get('proteins_100g'):
                        nutrition_data['protein'] = f"{nutrients['proteins_100g']}g/100g"
                    if nutrients.get('fats_100g'):
                        nutrition_data['fats'] = f"{nutrients['fats_100g']}g/100g"
                    if nutrients.get('carbohydrates_100g'):
                        nutrition_data['carbs'] = f"{nutrients['carbohydrates_100g']}g/100g"
                    
                    print(f"📋 Nutrition data before fallback: {nutrition_data}")


                    if 'fats' not in nutrition_data:
                        print(f"🔄 Open Food Facts missing fats for {clean_name}, adding fallback")
                        known_fat_values = {
                            'pizza': 8.0, 'burger': 12.0, 'pasta': 2.0, 'sandwich': 10.0,
                            'chicken': 3.6, 'beef': 15.0, 'fish': 5.0, 'rice': 0.3,
                            'salad': 1.0, 'soup': 3.0, 'bread': 1.0, 'cheese': 9.0
                        }
                        
                        for food, fat_value in known_fat_values.items():
                            if food in clean_name:
                                nutrition_data['fats'] = f"{fat_value}g/100g"
                                print(f"✅ Added fat value for {clean_name}: {fat_value}g")
                                break
                    
                    print(f"📋 Nutrition data after fallback: {nutrition_data}")
                    
                    if nutrition_data:
                        return {
                            'success': True,
                            'food_name': product.get('product_name', dish_name),
                            'nutrients': nutrition_data,
                            'source': 'Open Food Facts',
                            'serving_size': '100g',
                            'serving_unit': 'g'
                        }
                else:
                    print("❌ Open Food Facts found no products")
            else:
                print(f"❌ Open Food Facts API failed: {response.status_code}")    
            
            return {
                'success': False, 
                'error': 'No nutrition data found for this dish',
                'suggestion': 'Try searching with more specific dish name'
            }
            
        except Exception as e:
            return {
                'success': False, 
                'error': f'Nutrition API error: {str(e)}'
            }

# Test the service
if __name__ == "__main__":
    print("🧪 Testing Dish Recognition Service...")
    service = DishRecognitionService()
    
    if service.model:
        print("✅ Dish service initialized successfully!")
        print("🍽️ Ready for general dish recognition (pizza, burger, pasta, etc.)")
    else:
        print("❌ Dish service failed to initialize")