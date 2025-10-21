# ================================
# File: config.py
# Configuration and constants
# ================================


import os

class Config:
    """Configuration settings for the meal planning system"""

    # Model settings
    LLM_MODEL = "llama3.1"

    # Database settings
    COLLECTION_NAME = "meal_database"

    # Default calorie distribution
    CALORIE_DISTRIBUTION = {
        "breakfast": 0.20,  # 20%
        "lunch": 0.35,      # 35%
        "dinner": 0.35,     # 35%
        "snacks": 0.10      # 10%
    }

    # Meal type search terms for general meals
    MEAL_TYPE_TERMS = {
        "breakfast": ["breakfast", "morning", "eggs", "cereal", "toast", "coffee", "juice", "oatmeal", "yogurt", "fruit"],
        "lunch": ["lunch", "sandwich", "salad", "soup", "wrap", "pasta", "rice", "chicken", "beef", "fish", "vegetable"],
        "dinner": ["dinner", "evening", "meat", "chicken", "beef", "fish", "pasta", "rice", "vegetable", "stew", "grill"],
        "snacks": ["snack", "nuts", "fruit", "chips", "cookies", "yogurt", "cheese", "crackers", "popcorn", "candy"]
    }

    # Retrieval settings
    MAX_CANDIDATES_PER_MEAL = 6
    RETRIEVAL_K = 10
    CALORIE_FLEXIBILITY_FACTOR = 1.5  # Allow items up to 150% of target calories
