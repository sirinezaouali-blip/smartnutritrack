import torch
from transformers import ViTImageProcessor, ViTForImageClassification
from PIL import Image
import io
import numpy as np
import requests
import json
import os
from typing import Dict, Any, List

class ViTDishClassifier:
    def __init__(self):
        self.model = None
        self.processor = None
        self.model_loaded = False
        self.class_names = self._load_food101_classes()
        self.load_model()

    def _load_food101_classes(self) -> List[str]:
        """Load Food-101 class names"""
        # Food-101 classes (101 food categories)
        return [
            "apple_pie", "baby_back_ribs", "baklava", "beef_carpaccio", "beef_tartare",
            "beet_salad", "beignets", "bibimbap", "bread_pudding", "breakfast_burrito",
            "bruschetta", "caesar_salad", "cannoli", "caprese_salad", "carrot_cake",
            "ceviche", "cheesecake", "cheese_plate", "chicken_curry", "chicken_quesadilla",
            "chicken_wings", "chocolate_cake", "chocolate_mousse", "churros", "clam_chowder",
            "club_sandwich", "crab_cakes", "creme_brulee", "croque_madame", "cup_cakes",
            "deviled_eggs", "donuts", "dumplings", "edamame", "eggs_benedict",
            "escargots", "falafel", "filet_mignon", "fish_and_chips", "foie_gras",
            "french_fries", "french_onion_soup", "french_toast", "fried_calamari",
            "fried_rice", "frozen_yogurt", "garlic_bread", "gnocchi", "greek_salad",
            "grilled_cheese_sandwich", "grilled_salmon", "guacamole", "gyoza", "hamburger",
            "hot_and_sour_soup", "hot_dog", "huevos_rancheros", "hummus", "ice_cream",
            "lasagna", "lobster_bisque", "lobster_roll_sandwich", "macaroni_and_cheese",
            "macarons", "miso_soup", "mussels", "nachos", "omelette", "onion_rings",
            "oysters", "pad_thai", "paella", "pancakes", "panna_cotta", "peking_duck",
            "pho", "pizza", "pork_chop", "poutine", "prime_rib", "pulled_pork_sandwich",
            "ramen", "ravioli", "red_velvet_cake", "risotto", "samosa", "sashimi",
            "scallops", "seaweed_salad", "shrimp_and_grits", "spaghetti_bolognese",
            "spaghetti_carbonara", "spring_rolls", "steak", "strawberry_shortcake",
            "sushi", "tacos", "takoyaki", "tiramisu", "tuna_tartare", "waffles"
        ]

    def load_model(self):
        """Load the ViT model for dish classification"""
        try:
            # Get model path from environment variable or use default
            model_path = os.getenv(
                'VIT_MODEL_PATH',
                r"F:\PFE Syrine\PROJET PFE CONCLUSION\Models\CNN\Dishs\food"
            )

            print(f"🔍 Loading ViT dish recognition model: {model_path}")

            # Load processor and model
            self.processor = ViTImageProcessor.from_pretrained(model_path)
            self.model = ViTForImageClassification.from_pretrained(model_path)

            # Set model to evaluation mode
            self.model.eval()

            # Move to GPU if available
            self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
            self.model.to(self.device)

            self.model_loaded = True
            print("✅ ViT dish recognition model loaded successfully!")
            print(f"📊 Model loaded on device: {self.device}")
            print(f"🍽️ Number of dish classes: {len(self.class_names)}")

        except Exception as e:
            print(f"❌ ViT model loading failed: {e}")
            self.model_loaded = False

    def preprocess_image(self, image_data: bytes) -> torch.Tensor:
        """Preprocess image for ViT model"""
        try:
            # Convert bytes to PIL Image
            image = Image.open(io.BytesIO(image_data))

            # Convert to RGB if needed
            if image.mode != 'RGB':
                image = image.convert('RGB')

            # Process image using ViT processor
            inputs = self.processor(images=image, return_tensors="pt")

            # Move to device
            inputs = {k: v.to(self.device) for k, v in inputs.items()}

            return inputs

        except Exception as e:
            raise ValueError(f"Error preprocessing image: {str(e)}")

    def predict_dish(self, image_data: bytes) -> Dict[str, Any]:
        """Predict dish using ViT model"""
        try:
            if not self.model_loaded:
                return self._fallback_prediction()

            # Preprocess image
            inputs = self.preprocess_image(image_data)

            # Run inference
            with torch.no_grad():
                outputs = self.model(**inputs)
                logits = outputs.logits

                # Get probabilities
                probabilities = torch.nn.functional.softmax(logits, dim=-1)[0]

                # Get top 5 predictions
                top5_prob, top5_indices = torch.topk(probabilities, 5)

                predictions = []
                for i in range(5):
                    class_idx = top5_indices[i].item()
                    confidence = top5_prob[i].item()
                    dish_name = self.class_names[class_idx]

                    predictions.append({
                        "dish_name": dish_name.replace('_', ' ').title(),
                        "confidence": float(confidence),
                        "category": "dish"
                    })

            # Get nutrition data for top prediction
            nutrition_data = self.get_nutrition_data(predictions[0]["dish_name"])

            return {
                "top_prediction": predictions[0],
                "all_predictions": predictions,
                "model_used": "ViT_Food101",
                "image_processed": True,
                "nutrition": nutrition_data if nutrition_data["success"] else None
            }

        except Exception as e:
            raise RuntimeError(f"Dish prediction error: {str(e)}")

    def _fallback_prediction(self) -> Dict[str, Any]:
        """Fallback prediction when model fails to load"""
        import random
        selected_dishes = random.sample(self.class_names, 5)
        predictions = []

        for i, dish in enumerate(selected_dishes):
            confidence = 0.8 - (i * 0.15) + random.uniform(-0.05, 0.05)
            confidence = max(0.1, min(0.95, confidence))

            predictions.append({
                "dish_name": dish.replace('_', ' ').title(),
                "confidence": round(confidence, 3),
                "category": "dish"
            })

        nutrition_data = self.get_nutrition_data(predictions[0]["dish_name"])

        return {
            "top_prediction": predictions[0],
            "all_predictions": predictions,
            "model_used": "FALLBACK_NOT_VIT_MODEL",
            "image_processed": True,
            "nutrition": nutrition_data if nutrition_data["success"] else None,
            "warning": "Using fallback - ViT model not loaded"
        }

    def get_nutrition_data(self, dish_name: str) -> Dict[str, Any]:
        """Get nutrition data for dish from APIs"""
        try:
            print(f"🔍 Fetching nutrition data for dish: {dish_name}")

            # Try USDA API first
            nutrition_data = self.try_usda_api(dish_name)
            if nutrition_data["success"]:
                return nutrition_data

            # Try Open Food Facts
            nutrition_data = self.try_open_food_facts(dish_name)
            if nutrition_data["success"]:
                return nutrition_data

            # Estimate based on dish type
            return self.estimate_dish_nutrition(dish_name)

        except Exception as e:
            return {
                "success": False,
                "error": f"Nutrition API error: {str(e)}",
                "source": "api_error"
            }

    def try_usda_api(self, dish_name: str) -> Dict[str, Any]:
        """Try USDA FoodData Central API"""
        try:
            url = "https://api.nal.usda.gov/fdc/v1/foods/search"
            params = {
                'query': dish_name,
                'api_key': 'DEMO_KEY',
                'pageSize': 1
            }

            response = requests.get(url, params=params, timeout=10)
            if response.status_code == 200:
                data = response.json()
                if data.get('foods') and len(data['foods']) > 0:
                    food = data['foods'][0]
                    nutrients = self.extract_usda_nutrients(food)

                    if nutrients:
                        return {
                            "success": True,
                            "food_name": food.get('description', dish_name),
                            "nutrients": nutrients,
                            "source": "USDA FoodData Central",
                            "serving_size": food.get('servingSize', 'N/A'),
                            "serving_unit": food.get('servingSizeUnit', 'N/A')
                        }

            return {"success": False, "error": "No USDA data available"}

        except Exception as e:
            return {"success": False, "error": f"USDA API error: {str(e)}"}

    def try_open_food_facts(self, dish_name: str) -> Dict[str, Any]:
        """Try Open Food Facts API"""
        try:
            url = "https://world.openfoodfacts.org/cgi/search.pl"
            params = {
                'search_terms': dish_name,
                'json': 1,
                'page_size': 1,
                'sort_by': 'unique_scans_n'
            }

            response = requests.get(url, params=params, timeout=10)
            if response.status_code == 200:
                data = response.json()
                if data.get('products') and len(data['products']) > 0:
                    product = data['products'][0]
                    nutrients = self.extract_off_nutrients(product)

                    if nutrients:
                        return {
                            "success": True,
                            "food_name": product.get('product_name', dish_name),
                            "nutrients": nutrients,
                            "source": "Open Food Facts",
                            "brand": product.get('brands', ''),
                            "ingredients": product.get('ingredients_text', '')
                        }

            return {"success": False, "error": "No Open Food Facts data"}

        except Exception as e:
            return {"success": False, "error": f"Open Food Facts error: {str(e)}"}

    def estimate_dish_nutrition(self, dish_name: str) -> Dict[str, Any]:
        """Estimate nutrition for common dishes"""
        dish_nutrition_estimates = {
            # Breakfast items
            "pancakes": {"calories": "250 kcal", "protein": "6g", "carbs": "35g", "fat": "8g"},
            "french toast": {"calories": "300 kcal", "protein": "10g", "carbs": "40g", "fat": "12g"},
            "eggs benedict": {"calories": "400 kcal", "protein": "20g", "carbs": "25g", "fat": "25g"},
            "breakfast burrito": {"calories": "350 kcal", "protein": "18g", "carbs": "35g", "fat": "15g"},

            # Main dishes
            "pizza": {"calories": "285 kcal/slice", "protein": "12g", "carbs": "36g", "fat": "10g"},
            "hamburger": {"calories": "500 kcal", "protein": "25g", "carbs": "30g", "fat": "25g"},
            "chicken curry": {"calories": "350 kcal", "protein": "30g", "carbs": "20g", "fat": "15g"},
            "spaghetti bolognese": {"calories": "400 kcal", "protein": "20g", "carbs": "50g", "fat": "12g"},
            "grilled salmon": {"calories": "350 kcal", "protein": "35g", "carbs": "0g", "fat": "20g"},
            "steak": {"calories": "450 kcal", "protein": "40g", "carbs": "0g", "fat": "30g"},

            # Default for unknown dishes
            "default": {"calories": "300 kcal", "protein": "20g", "carbs": "30g", "fat": "15g"}
        }

        # Normalize dish name for matching
        normalized_name = dish_name.lower().replace(' ', '_')
        nutrition = dish_nutrition_estimates.get(normalized_name, dish_nutrition_estimates["default"])

        return {
            "success": True,
            "food_name": dish_name,
            "nutrients": nutrition,
            "source": "Estimated (Dish Category Averages)",
            "note": "Based on typical dish composition - verify with APIs for accuracy"
        }

    def extract_usda_nutrients(self, food: Dict) -> Dict[str, str]:
        """Extract nutrients from USDA API response"""
        nutrients = {}
        for nutrient in food.get('foodNutrients', []):
            name = nutrient.get('nutrientName', '')
            value = nutrient.get('value', 0)
            unit = nutrient.get('unitName', '')

            if 'Energy' in name and 'kcal' in unit.lower():
                nutrients['calories'] = f"{value} {unit}"
            elif 'Protein' in name:
                nutrients['protein'] = f"{value} {unit}"
            elif 'Total lipid' in name or 'Fat' in name:
                nutrients['fat'] = f"{value} {unit}"
            elif 'Carbohydrate' in name:
                nutrients['carbs'] = f"{value} {unit}"

        return nutrients

    def extract_off_nutrients(self, product: Dict) -> Dict[str, str]:
        """Extract nutrients from Open Food Facts response"""
        nutriments = product.get('nutriments', {})
        nutrients = {}

        if nutriments.get('energy-kcal_100g'):
            nutrients['calories'] = f"{nutriments['energy-kcal_100g']} kcal/100g"
        if nutriments.get('proteins_100g'):
            nutrients['protein'] = f"{nutriments['proteins_100g']}g/100g"
        if nutriments.get('fat_100g'):
            nutrients['fat'] = f"{nutriments['fat_100g']}g/100g"
        if nutriments.get('carbohydrates_100g'):
            nutrients['carbs'] = f"{nutriments['carbohydrates_100g']}g/100g"

        return nutrients

# Global instance
vit_dish_classifier = ViTDishClassifier()
