#!/usr/bin/env python3
"""
Test script for the RAG meal planning system
"""

from models import UserProfile
from meal_system import MealPlanningSystem
from setup_database import setup_vector_store

def test_rag_system():
    """Test the RAG meal planning system"""
    print("🧪 Testing RAG Meal Planning System...")

    # Setup vector store
    print("🔄 Setting up vector store...")
    db_location, embeddings = setup_vector_store()

    # Create meal planning system
    print("🔄 Initializing meal planning system...")
    meal_planner = MealPlanningSystem(db_location, embeddings)

    # Create test user profile
    user_profile = UserProfile.create_default()
    print(f"👤 Test user profile: {user_profile.target_calories} kcal target")

    # Test cases
    test_inputs = [
        "I want chicken for lunch and salad for dinner",
        "already had breakfast, need lunch and dinner ideas",
        "want something healthy for dinner",
        "need high protein meals today"
    ]

    for i, user_input in enumerate(test_inputs, 1):
        print(f"\n{'='*50}")
        print(f"🧪 TEST {i}: '{user_input}'")
        print(f"{'='*50}")

        try:
            result = meal_planner.create_meal_plan(user_profile, user_input)
            print("✅ SUCCESS!")
            print(f"📝 Intent: {result['parsed_input'].user_intent}")
            print(f"🍽️  Meals to plan: {result['parsed_input'].meals_to_plan}")
            print(f"📊 Remaining calories: {result['caloric_plan'].remaining_target}")
            print(f"📋 Plan preview:")
            print(result['final_plan'][:500] + "..." if len(result['final_plan']) > 500 else result['final_plan'])

        except Exception as e:
            print(f"❌ FAILED: {e}")
            import traceback
            traceback.print_exc()

if __name__ == "__main__":
    test_rag_system()
