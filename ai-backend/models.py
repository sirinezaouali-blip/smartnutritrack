# ================================
# File: models.py
# Data models and structures
# ================================

from dataclasses import dataclass
from typing import Dict, List, Optional, Any

@dataclass
class UserProfile:
    """User profile with nutritional information"""
    bmi: float
    category: str
    bmr: int
    tdee: int
    target_calories: int
    goals: str

    @classmethod
    def create_default(cls) -> 'UserProfile':
        """Create a default user profile for testing"""
        return cls(
            bmi=22.86,
            category="Normal weight",
            bmr=1724,
            tdee=2673,
            target_calories=2173,
            goals="maintain weight"
        )

@dataclass
class ParsedInput:
    """Parsed user input structure"""
    already_eaten: Dict[str, Any]
    meal_requests: Dict[str, Optional[str]]
    meals_to_plan: List[str]
    user_intent: str

@dataclass
class CaloricPlan:
    """Caloric distribution plan"""
    breakfast: Dict[str, int]
    lunch: Dict[str, int]
    dinner: Dict[str, int]
    snacks: Dict[str, int]
    consumed_calories: int
    remaining_target: int
    remaining_meals: List[str]

@dataclass
class FoodCandidate:
    """Food candidate item"""
    content: str
    calories: Any  # int or "unknown"
    meal_type: str
    search_query: str
