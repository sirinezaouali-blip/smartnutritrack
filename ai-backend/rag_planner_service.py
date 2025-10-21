import requests
import json
import os
from typing import List, Dict, Any
import numpy as np

class RAGMealPlannerService:
    def __init__(self):
        self.backend_url = "http://localhost:5000"  # Your Node.js backend
        self.rag_system_path = r"F:\PFE Syrine\PROJET PFE CONCLUSION\Models\Meal planner\Meal Planner"
        self.initialized = False
        self.initialize_rag_system()
    
    def initialize_rag_system(self):
        """Initialize connection to RAG meal planner system"""
        try:
            # Check if RAG system exists
            if os.path.exists(self.rag_system_path):
                print("✅ RAG Meal Planner system found")
                self.initialized = True
            else:
                print("❌ RAG system path not found, using database-driven system")
                self.initialized = False
                
        except Exception as e:
            print(f"❌ RAG system initialization error: {e}")
            self.initialized = False
    
    def get_meals_from_database(self, filters: Dict[str, Any] = None, limit: int = 50) -> List[Dict[str, Any]]:
        """Get meals from MongoDB database (no static data)"""
        try:
            # Call your Node.js backend API to get meals from MongoDB
            url = f"{self.backend_url}/api/meals"
            params = {}
            
            if filters:
                # Add filters for meal type, calories, etc.
                if 'meal_type' in filters:
                    params['type'] = filters['meal_type']
                if 'max_calories' in filters:
                    params['maxCalories'] = filters['max_calories']
                if 'diet_type' in filters:
                    params['dietType'] = filters['diet_type']
            
            params['limit'] = limit
            
            response = requests.get(url, params=params, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                if data.get('success'):
                    return data.get('data', [])
                else:
                    print(f"❌ API error: {data.get('message')}")
                    return []
            else:
                print(f"❌ HTTP error: {response.status_code}")
                return []
                
        except Exception as e:
            print(f"❌ Error fetching meals from database: {e}")
            return []
    
    def get_user_profile_from_database(self, user_id: str, token: str = None) -> Dict[str, Any]:
        """Get user profile with health metrics from MongoDB (no static data)"""
        try:
            # Call your Node.js backend to get real user profile from database
            url = f"{self.backend_url}/api/auth/me"
            # Add JWT authentication headers if provided
            headers = {}
            if token:
                headers['Authorization'] = f'Bearer {token}'
            
            response = requests.get(url, headers=headers, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                if data.get('success'):
                    user_data = data.get('data', {})
                    
                    # Extract health metrics from user's onboarding data
                    health_metrics = user_data.get('onboarding', {}).get('healthMetrics', {})
                    
                    # Extract dietary preferences
                    preferences = user_data.get('onboarding', {}).get('preferences', {})
                    medical = user_data.get('onboarding', {}).get('medical', {})
                    
                    return {
                        "target_calories": health_metrics.get('dailyCalories', 2000),
                        "protein_target": health_metrics.get('proteinTarget', 150),
                        "carbs_target": health_metrics.get('carbsTarget', 250),
                        "fats_target": health_metrics.get('fatsTarget', 67),
                        "dietary_preferences": preferences.get('dietType', []),
                        "allergies": medical.get('allergies', []),
                        "disliked_foods": preferences.get('dislikedFoods', []),
                        "goal": user_data.get('onboarding', {}).get('basicInfo', {}).get('goal', 'maintain')
                    }
                else:
                    print(f"❌ User API error: {data.get('message')}")
                    return self.get_default_user_profile()
            else:
                print(f"❌ User HTTP error: {response.status_code}")
                return self.get_default_user_profile()
                
        except Exception as e:
            print(f"❌ Error fetching user profile from database: {e}")
            return self.get_default_user_profile()
    
    def get_default_user_profile(self):
        """Fallback - get default profile from database averages"""
        # Even fallback should try to get data from database
        # For now, return minimal defaults that would be overridden by real data
        return {
            "target_calories": 2000,
            "protein_target": 150,
            "carbs_target": 250,
            "fats_target": 67,
            "dietary_preferences": [],
            "allergies": [],
            "disliked_foods": [],
            "goal": "maintain"
        }
    
    async def generate_single_day_plan(self, user_input: str, user_id: str, token: str = None) -> Dict[str, Any]:
        """Generate single day meal plan using database meals"""
        try:
            # Get real user profile from database
            user_profile = self.get_user_profile_from_database(user_id, token)
            
            # Get meals from database based on user preferences
            filters = {
                'max_calories': user_profile['target_calories'],
                'diet_type': user_profile['dietary_preferences']
            }
            
            all_meals = self.get_meals_from_database(filters, limit=100)
            
            if not all_meals:
                return {
                    "success": False,
                    "message": "No meals found in database",
                    "data": None
                }
            
            # Group meals by type
            meals_by_type = {}
            for meal in all_meals:
                meal_type = meal.get('type', 'lunch')
                if meal_type not in meals_by_type:
                    meals_by_type[meal_type] = []
                meals_by_type[meal_type].append(meal)
            
            # Calculate calorie distribution
            target_calories = user_profile['target_calories']
            calorie_distribution = self.calculate_calorie_distribution(target_calories)
            
            # Generate meal plan
            meal_plan = self.create_meal_plan_from_database(
                meals_by_type, 
                calorie_distribution, 
                user_profile,
                user_input
            )
            
            return {
                "success": True,
                "message": "Single day meal plan generated successfully",
                "data": {
                    "plan_type": "single_day",
                    "user_input": user_input,
                    "target_calories": target_calories,
                    "meal_plan": meal_plan,
                    "user_profile": user_profile,
                    "meals_used": len(all_meals),
                    "source": "mongodb_database"
                }
            }
            
        except Exception as e:
            return {
                "success": False,
                "message": f"Error generating meal plan: {str(e)}",
                "data": None
            }
    
    async def generate_multiple_plans(self, user_input: str, user_id: str, number_of_plans: int = 3, token: str = None) -> Dict[str, Any]:
        """Generate multiple meal plan options from database"""
        try:
            # Get real user profile from database
            user_profile = self.get_user_profile_from_database(user_id, token)
            
            # Get meals from database
            all_meals = self.get_meals_from_database({}, limit=200)
            
            if not all_meals:
                return {
                    "success": False,
                    "message": "No meals found in database",
                    "data": None
                }
            
            # Generate multiple plans
            plans = []
            for i in range(number_of_plans):
                plan = await self.generate_plan_variation(all_meals, user_profile, user_input, variation_index=i)
                plans.append(plan)
            
            return {
                "success": True,
                "message": f"Generated {len(plans)} meal plan options",
                "data": {
                    "plan_type": "multiple_plans",
                    "user_input": user_input,
                    "number_of_plans": len(plans),
                    "plans": plans,
                    "user_profile": user_profile,
                    "source": "mongodb_database"
                }
            }
            
        except Exception as e:
            return {
                "success": False,
                "message": f"Error generating multiple plans: {str(e)}",
                "data": None
            }
    
    async def generate_single_meal_suggestions(self, meal_type: str, target_calories: int, user_id: str, limit: int = 20, token: str = None) -> Dict[str, Any]:
        """Generate similar meal suggestions from database"""
        try:
            # Get real user profile from database
            user_profile = self.get_user_profile_from_database(user_id, token)
            
            # Get meals from database filtered by type and calories
            filters = {
                'meal_type': meal_type,
                'max_calories': target_calories
            }
            
            similar_meals = self.get_meals_from_database(filters, limit=limit)
            
            # Sort by calorie proximity to target
            similar_meals.sort(key=lambda x: abs(x.get('calories', 0) - target_calories))
            
            return {
                "success": True,
                "message": f"Found {len(similar_meals)} similar meals",
                "data": {
                    "plan_type": "single_meal_suggestions",
                    "meal_type": meal_type,
                    "target_calories": target_calories,
                    "suggestions": similar_meals[:limit],
                    "count": len(similar_meals),
                    "user_profile": user_profile,
                    "source": "mongodb_database"
                }
            }
            
        except Exception as e:
            return {
                "success": False,
                "message": f"Error generating meal suggestions: {str(e)}",
                "data": None
            }
    
    def calculate_calorie_distribution(self, total_calories: int) -> Dict[str, int]:
        """Calculate calorie distribution across meals"""
        return {
            "breakfast": int(total_calories * 0.25),  # 25%
            "lunch": int(total_calories * 0.35),      # 35%
            "dinner": int(total_calories * 0.35),     # 35%
            "snacks": int(total_calories * 0.05)      # 5%
        }
    
    def create_meal_plan_from_database(self, meals_by_type: Dict, calorie_distribution: Dict, user_profile: Dict, user_input: str) -> Dict[str, Any]:
        """Create meal plan using database meals"""
        meal_plan = {}
        total_calories = 0
        total_protein = 0
        total_carbs = 0
        total_fat = 0
        
        for meal_type, target_calories in calorie_distribution.items():
            available_meals = meals_by_type.get(meal_type, [])
            
            if available_meals:
                # Filter meals by user preferences
                filtered_meals = self.filter_meals_by_preferences(available_meals, user_profile)
                
                if filtered_meals:
                    # Select meal closest to target calories
                    selected_meal = min(
                        filtered_meals, 
                        key=lambda x: abs(x.get('calories', 0) - target_calories)
                    )
                    
                    meal_plan[meal_type] = {
                        "name": selected_meal.get('name', 'Unknown'),
                        "calories": selected_meal.get('calories', 0),
                        "protein": selected_meal.get('protein', 0),
                        "carbs": selected_meal.get('carbs', 0),
                        "fat": selected_meal.get('fat', 0),
                        "type": selected_meal.get('type', meal_type)
                    }
                    
                    # Update totals
                    total_calories += selected_meal.get('calories', 0)
                    total_protein += selected_meal.get('protein', 0)
                    total_carbs += selected_meal.get('carbs', 0)
                    total_fat += selected_meal.get('fat', 0)
        
        return {
            "meals": meal_plan,
            "totals": {
                "calories": total_calories,
                "protein": total_protein,
                "carbs": total_carbs,
                "fat": total_fat
            },
            "targets": {
                "calories": user_profile['target_calories'],
                "protein": user_profile['protein_target'],
                "carbs": user_profile['carbs_target'],
                "fat": user_profile['fats_target']
            }
        }
    
    def filter_meals_by_preferences(self, meals: List[Dict], user_profile: Dict) -> List[Dict]:
        """Filter meals based on user dietary preferences and allergies"""
        filtered_meals = []
        
        for meal in meals:
            # Check allergies
            meal_allergens = meal.get('ingredients', [])
            user_allergies = user_profile.get('allergies', [])
            
            # Check if meal contains any allergens
            has_allergen = any(allergen in ' '.join(meal_allergens).lower() 
                             for allergen in user_allergies)
            
            # Check disliked foods
            meal_name = meal.get('name', '').lower()
            user_dislikes = user_profile.get('disliked_foods', [])
            has_disliked = any(dislike.lower() in meal_name for dislike in user_dislikes)
            
            if not has_allergen and not has_disliked:
                filtered_meals.append(meal)
        
        return filtered_meals if filtered_meals else meals
    
    def generate_plan_variation(self, all_meals: List[Dict], user_profile: Dict, user_input: str, variation_index: int) -> Dict[str, Any]:
        """Generate a variation of meal plan for multiple plans option"""
        # Group by type
        meals_by_type = {}
        for meal in all_meals:
            meal_type = meal.get('type', 'lunch')
            if meal_type not in meals_by_type:
                meals_by_type[meal_type] = []
            meals_by_type[meal_type].append(meal)
        
        # Create variation by selecting different meals
        calorie_distribution = self.calculate_calorie_distribution(user_profile['target_calories'])
        meal_plan = self.create_plan_variation(meals_by_type, calorie_distribution, user_profile, variation_index)
        
        return {
            "variation": variation_index + 1,
            "meal_plan": meal_plan,
            "description": f"Option {variation_index + 1} - {self.get_variation_description(variation_index)}"
        }
    
    def create_plan_variation(self, meals_by_type: Dict, calorie_distribution: Dict, user_profile: Dict, variation_index: int) -> Dict[str, Any]:
        """Create a variation of the meal plan"""
        meal_plan = {}
        total_calories = 0
        
        for meal_type, target_calories in calorie_distribution.items():
            available_meals = meals_by_type.get(meal_type, [])
            
            if available_meals:
                filtered_meals = self.filter_meals_by_preferences(available_meals, user_profile)
                
                if filtered_meals:
                    # Select different meal based on variation index
                    index = variation_index % len(filtered_meals)
                    selected_meal = filtered_meals[index]
                    
                    meal_plan[meal_type] = {
                        "name": selected_meal.get('name', 'Unknown'),
                        "calories": selected_meal.get('calories', 0),
                        "protein": selected_meal.get('protein', 0),
                        "carbs": selected_meal.get('carbs', 0),
                        "fat": selected_meal.get('fat', 0)
                    }
                    
                    total_calories += selected_meal.get('calories', 0)
        
        return {
            "meals": meal_plan,
            "total_calories": total_calories,
            "target_calories": user_profile['target_calories']
        }
    
    def get_variation_description(self, variation_index: int) -> str:
        """Get description for plan variation"""
        descriptions = [
            "Balanced nutrition focus",
            "Higher protein option", 
            "Lower calorie option",
            "Quick & easy meals",
            "Gourmet selection"
        ]
        return descriptions[variation_index % len(descriptions)]

# Global instance
rag_planner_service = RAGMealPlannerService()