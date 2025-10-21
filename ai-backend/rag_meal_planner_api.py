from flask import Flask, request, jsonify
from flask_cors import CORS
import json
from meal_system import MealPlanningSystem
from models import UserProfile
from setup_database import setup_vector_store

app = Flask(__name__)
CORS(app)

# Initialize the meal planning system
print("🔄 Initializing RAG Meal Planning System...")
db_location, embeddings = setup_vector_store()
meal_planner = MealPlanningSystem(db_location, embeddings)
print("✅ RAG Meal Planning System ready!")

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        "status": "healthy",
        "service": "RAG Meal Planner",
        "version": "1.0.0"
    })

@app.route('/api/meal-plan', methods=['POST'])
def create_meal_plan():
    """Create a meal plan based on user input"""
    try:
        data = request.get_json()

        if not data:
            return jsonify({
                "success": False,
                "message": "No data provided"
            }), 400

        user_input = data.get('user_input', '')
        user_profile_data = data.get('user_profile', {})

        if not user_input:
            return jsonify({
                "success": False,
                "message": "User input is required"
            }), 400

        # Create user profile
        user_profile = UserProfile(
            bmi=user_profile_data.get('bmi', 22.0),
            category=user_profile_data.get('category', 'Normal weight'),
            bmr=user_profile_data.get('bmr', 1800),
            tdee=user_profile_data.get('tdee', 2200),
            target_calories=user_profile_data.get('target_calories', 2000),
            goals=user_profile_data.get('goals', 'maintain weight')
        )

        print(f"🧠 Processing request: '{user_input}'")
        print(f"   Target calories: {user_profile.target_calories}")

        # Generate meal plan
        result = meal_planner.create_meal_plan(user_profile, user_input)

        # Format response
        response = {
            "success": True,
            "message": "Meal plan generated successfully",
            "data": {
                "parsed_input": {
                    "user_intent": result["parsed_input"].user_intent,
                    "meals_to_plan": result["parsed_input"].meals_to_plan,
                    "already_eaten": result["parsed_input"].already_eaten
                },
                "caloric_plan": {
                    "consumed_calories": result["caloric_plan"].consumed_calories,
                    "remaining_target": result["caloric_plan"].remaining_target,
                    "remaining_meals": result["caloric_plan"].remaining_meals,
                    "breakfast": result["caloric_plan"].breakfast,
                    "lunch": result["caloric_plan"].lunch,
                    "dinner": result["caloric_plan"].dinner,
                    "snacks": result["caloric_plan"].snacks
                },
                "meal_plan": result["final_plan"]
            }
        }

        print("✅ Meal plan generated successfully")
        return jsonify(response)

    except Exception as e:
        print(f"❌ Error generating meal plan: {e}")
        return jsonify({
            "success": False,
            "message": "Failed to generate meal plan",
            "error": str(e)
        }), 500

@app.route('/api/user-profile', methods=['POST'])
def create_user_profile():
    """Create or validate user profile"""
    try:
        data = request.get_json()

        if not data:
            return jsonify({
                "success": False,
                "message": "No data provided"
            }), 400

        # Validate required fields
        required_fields = ['target_calories']
        for field in required_fields:
            if field not in data:
                return jsonify({
                    "success": False,
                    "message": f"Missing required field: {field}"
                }), 400

        # Create user profile
        user_profile = UserProfile(
            bmi=data.get('bmi', 22.0),
            category=data.get('category', 'Normal weight'),
            bmr=data.get('bmr', 1800),
            tdee=data.get('tdee', 2200),
            target_calories=data['target_calories'],
            goals=data.get('goals', 'maintain weight')
        )

        return jsonify({
            "success": True,
            "message": "User profile validated",
            "data": {
                "bmi": user_profile.bmi,
                "category": user_profile.category,
                "bmr": user_profile.bmr,
                "tdee": user_profile.tdee,
                "target_calories": user_profile.target_calories,
                "goals": user_profile.goals
            }
        })

    except Exception as e:
        print(f"❌ Error creating user profile: {e}")
        return jsonify({
            "success": False,
            "message": "Failed to create user profile",
            "error": str(e)
        }), 500

if __name__ == '__main__':
    print("🚀 Starting RAG Meal Planner API server...")
    app.run(host='0.0.0.0', port=5001, debug=True)
