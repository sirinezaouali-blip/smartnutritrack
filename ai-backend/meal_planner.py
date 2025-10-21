# ================================
# File: meal_planner.py
# Meal plan generation logic
# ==============================
import re
from typing import Dict, List
from langchain.prompts import ChatPromptTemplate
from langchain_ollama.llms import OllamaLLM
from models import UserProfile, ParsedInput, CaloricPlan, FoodCandidate
from config import Config


class MealPlanner:
    """Generates final meal plans with calculated totals"""

    def __init__(self):
        self.model = OllamaLLM(model=Config.LLM_MODEL)
        self._setup_templates()

    def _setup_templates(self):
        """Setup prompt templates"""
        self.meal_plan_template = """
        You are creating a meal plan. Use ONLY the provided meal items.

        USER PROFILE:
        - Target Calories: {target_calories} kcal/day
        - Already consumed: {consumed_calories} kcal
        - Remaining target: {remaining_calories} kcal

        CONTEXT:
        User request: {user_intent}
        Meals already eaten: {meals_eaten}
        Meals to plan: {meals_to_plan}

        CALORIC TARGETS FOR REMAINING MEALS:
        {caloric_targets}

        AVAILABLE MEAL ITEMS:
        {candidates}

        INSTRUCTIONS:
        1. Create a meal plan using ONLY the provided meal items
        2. Focus on the meals that need to be planned (ignore already eaten meals)
        3. Try to match the caloric targets as closely as possible
        4. If user requested specific items, prioritize those
        5. Provide realistic portion sizes
        6. Calculate subtotals for each meal

        OUTPUT FORMAT:
        **MEAL PLAN FOR TODAY**

        {consumed_section}

        {meal_sections}

        **NOTES:**
        [Brief explanation of choices made]

        DO NOT include daily totals or grand totals - these will be calculated automatically.
        """

    def generate_plan(self, user_profile: UserProfile, parsed_input: ParsedInput,
                     caloric_plan: CaloricPlan, candidates: Dict[str, List[FoodCandidate]]) -> str:
        """Generate the final meal plan with calculated totals"""

        # Format candidates for template
        candidates_text = self._format_candidates(candidates, caloric_plan)

        # Format caloric targets
        caloric_targets = self._format_caloric_targets(caloric_plan)

        # Format meals eaten
        meals_eaten_str = self._format_meals_eaten(parsed_input)

        # Format meals to plan
        meals_to_plan_str = ", ".join([m.title() for m in caloric_plan.remaining_meals])

        # Create consumed section
        consumed_section = ""
        if caloric_plan.consumed_calories > 0:
            consumed_section = f"✅ **Already Consumed: {caloric_plan.consumed_calories} kcal**\n{self._format_consumed_meals(parsed_input)}"

        # Create meal sections template
        meal_sections = self._create_meal_sections_template(caloric_plan)

        # Create prompt and generate
        meal_plan_prompt = ChatPromptTemplate.from_template(self.meal_plan_template)
        meal_plan_chain = meal_plan_prompt | self.model

        response = meal_plan_chain.invoke({
            "target_calories": user_profile.target_calories,
            "consumed_calories": caloric_plan.consumed_calories,
            "remaining_calories": caloric_plan.remaining_target,
            "user_intent": parsed_input.user_intent,
            "meals_eaten": meals_eaten_str,
            "meals_to_plan": meals_to_plan_str,
            "caloric_targets": caloric_targets,
            "candidates": candidates_text,
            "consumed_section": consumed_section,
            "meal_sections": meal_sections
        })

        # Parse and calculate totals
        final_plan = self._add_calculated_totals(response, caloric_plan, user_profile)

        return final_plan

    def _create_meal_sections_template(self, caloric_plan: CaloricPlan) -> str:
        """Create template sections for remaining meals"""
        sections = []

        meal_order = ["breakfast", "lunch", "dinner", "snacks"]

        for meal_type in meal_order:
            calories = getattr(caloric_plan, meal_type)["calories"]
            if calories and calories > 0:
                section = f"""**{meal_type.upper()} ({calories} kcal target):**
                            • [List items with calories]
                            Subtotal: [Calculate subtotal] kcal"""
                sections.append(section)

        return "\n\n".join(sections)

    def _add_calculated_totals(self, response: str, caloric_plan: CaloricPlan, user_profile: UserProfile) -> str:
        """Parse the response and add calculated totals"""

        # Extract calorie values from the response
        meal_calories = self._extract_meal_calories(response)

        # Calculate totals
        total_remaining = sum(meal_calories.values())
        grand_total = caloric_plan.consumed_calories + total_remaining
        target_calories = user_profile.target_calories

        # Calculate difference from target
        calorie_difference = grand_total - target_calories
        difference_text = ""
        if calorie_difference > 0:
            difference_text = f" (+{calorie_difference} over target)"
        elif calorie_difference < 0:
            difference_text = f" ({abs(calorie_difference)} under target)"
        else:
            difference_text = " (exactly on target)"

        # Add calculated totals section
        totals_section = f"""
        **DAILY TOTALS:**
        • Total of the suggestion: {total_remaining} kcal
        • Grand Total : {grand_total} kcal{difference_text}
        • Target: {target_calories} kcal
        • Difference: {calorie_difference:} kcal"""

        return response + totals_section

    def _extract_meal_calories(self, response: str) -> Dict[str, int]:
        """Extract calorie values from meal plan response"""
        meal_calories = {"breakfast": 0, "lunch": 0, "dinner": 0, "snacks": 0}

        # Look for subtotal patterns
        subtotal_pattern = r'Subtotal:\s*(\d+)\s*kcal'
        subtotals = re.findall(subtotal_pattern, response)

        # Match subtotals to meal sections
        meal_sections = re.split(r'\*\*(BREAKFAST|LUNCH|DINNER|SNACKS)', response)

        current_meal = None
        subtotal_index = 0

        for i, section in enumerate(meal_sections):
            if section in ["BREAKFAST", "LUNCH", "DINNER", "SNACKS"]:
                current_meal = section.lower()
            elif current_meal and "Subtotal:" in section and subtotal_index < len(subtotals):
                meal_calories[current_meal] = int(subtotals[subtotal_index])
                subtotal_index += 1

        return meal_calories

    def _format_candidates(self, candidates: Dict[str, List[FoodCandidate]], caloric_plan: CaloricPlan) -> str:
        """Format candidates for the template"""
        candidates_text = ""

        for meal_type in ["breakfast", "lunch", "dinner", "snacks"]:
            meal_calories = getattr(caloric_plan, meal_type)["calories"]
            if meal_calories and meal_calories > 0 and meal_type in candidates:
                candidates_text += f"\n{meal_type.upper()} OPTIONS:\n"
                for i, item in enumerate(candidates[meal_type][:4]):
                    candidates_text += f"{i+1}. {item.content}\n"

        return candidates_text

    def _format_caloric_targets(self, caloric_plan: CaloricPlan) -> str:
        """Format caloric targets for display"""
        targets = []
        for meal_type in ["breakfast", "lunch", "dinner", "snacks"]:
            calories = getattr(caloric_plan, meal_type)["calories"]
            if calories and calories > 0:
                targets.append(f"{meal_type.title()}: {calories} kcal")

        return "\n".join(targets)

    def _format_meals_eaten(self, parsed_input: ParsedInput) -> str:
        """Format already eaten meals"""
        meals_eaten = []
        for meal, items in parsed_input.already_eaten.items():
            if items and meal != "total_calories_consumed":
                meals_eaten.append(meal.title())

        return ", ".join(meals_eaten) if meals_eaten else "None"

    def _format_consumed_meals(self, parsed_input: ParsedInput) -> str:
        """Format consumed meals for display"""
        consumed_meals = []
        for meal, items in parsed_input.already_eaten.items():
            if items and meal != "total_calories_consumed":
                consumed_meals.append(f"• {meal.title()}: {', '.join(items) if isinstance(items, list) else items}")

        return "\n".join(consumed_meals) if consumed_meals else "• No meals consumed yet"
