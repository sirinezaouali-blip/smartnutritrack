# ================================
# File: calorie_calculator.py
# Calorie calculation logic
# ================================

from models import UserProfile, ParsedInput, CaloricPlan
from config import Config

class CalorieCalculator:
    """Handles calorie calculations and meal planning"""

    def calculate_base_allocation(self, user_profile: UserProfile) -> dict:
        """Calculate base caloric allocation across meals"""
        target = user_profile.target_calories

        return {
            "breakfast": {
                "calories": int(target * Config.CALORIE_DISTRIBUTION["breakfast"]),
                "percentage": Config.CALORIE_DISTRIBUTION["breakfast"] * 100
            },
            "lunch": {
                "calories": int(target * Config.CALORIE_DISTRIBUTION["lunch"]),
                "percentage": Config.CALORIE_DISTRIBUTION["lunch"] * 100
            },
            "dinner": {
                "calories": int(target * Config.CALORIE_DISTRIBUTION["dinner"]),
                "percentage": Config.CALORIE_DISTRIBUTION["dinner"] * 100
            },
            "snacks": {
                "calories": int(target * Config.CALORIE_DISTRIBUTION["snacks"]),
                "percentage": Config.CALORIE_DISTRIBUTION["snacks"] * 100
            },
            "total_allocated": target,
            "reasoning": "Standard distribution: 20% breakfast, 35% lunch, 35% dinner, 10% snacks"
        }

    def calculate_remaining_calories(self, user_profile: UserProfile, parsed_input: ParsedInput) -> CaloricPlan:
        """Calculate remaining caloric needs based on already consumed meals"""
        already_eaten = parsed_input.already_eaten
        DEFAULT_MEAL_CALORIES = {
        "breakfast": 0.20,  # 20%
        "lunch": 0.35,      # 35%
        "dinner": 0.35,     # 35%
        "snacks": 0.10      # 10%
          }
        # Calculate consumed calories
        consumed_calories = 0

        target = user_profile.target_calories
        # Estimate if no specific calories provided

        print("already_eaten:", already_eaten)
        if consumed_calories == 0:
            for meal in ["breakfast", "lunch", "dinner", "snacks"]:
                if already_eaten.get(meal):
                    consumed_calories += int(target * DEFAULT_MEAL_CALORIES[meal])
        print("consumed_calories:", consumed_calories)
        # Calculate remaining target
        remaining_target = max(0, user_profile.target_calories - consumed_calories)

        # Get base allocation
        base_allocation = self.calculate_base_allocation(user_profile)

        # Determine remaining meals
        remaining_meals = []
        adjusted_allocation = {}

        for meal in ["breakfast", "lunch", "dinner", "snacks"]:
            if already_eaten.get(meal):
                # Already consumed
                adjusted_allocation[meal] = {"calories": 0, "percentage": 0}
            else:
                # Still needs planning
                remaining_meals.append(meal)
                adjusted_allocation[meal] = base_allocation[meal].copy()


        # Redistribute calories among remaining meals PROPORTIONALLY
        if remaining_meals and remaining_target > 0:
            # Calculate total percentage for remaining meals
            total_remaining_percentage = sum(
                Config.CALORIE_DISTRIBUTION[meal] for meal in remaining_meals
            )

            # Redistribute proportionally based on original percentages
            for meal in remaining_meals:
                meal_proportion = Config.CALORIE_DISTRIBUTION[meal] / total_remaining_percentage
                adjusted_allocation[meal]["calories"] = int(remaining_target * meal_proportion)
                adjusted_allocation[meal]["percentage"] = (
                    adjusted_allocation[meal]["calories"] / user_profile.target_calories
                ) * 100
        caloric_plan = CaloricPlan(
            breakfast=adjusted_allocation["breakfast"],
            lunch=adjusted_allocation["lunch"],
            dinner=adjusted_allocation["dinner"],
            snacks=adjusted_allocation["snacks"],
            consumed_calories=consumed_calories,
            remaining_target=remaining_target,
            remaining_meals=remaining_meals
        )

        print("CaloricPlan:", caloric_plan)
        return caloric_plan
