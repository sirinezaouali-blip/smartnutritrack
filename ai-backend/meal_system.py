from langchain_community.vectorstores import Chroma
from models import UserProfile
from parsers import InputParser
from calorie_calculator import CalorieCalculator
from food_retriever import FoodRetriever
from meal_planner import MealPlanner
from config import Config

class MealPlanningSystem:
    """Main meal planning system orchestrator"""

    def __init__(self, db_location: str, embeddings, documents=None, ids=None, add_documents=False):
        # Initialize vector store
        self.vector_store = Chroma(
            collection_name=Config.COLLECTION_NAME,
            persist_directory=db_location,
            embedding_function=embeddings
        )

        if add_documents and documents:
            self.vector_store.add_documents(documents=documents, ids=ids)

        # Initialize components

        self.calorie_calculator = CalorieCalculator()
        self.food_retriever = FoodRetriever(self.vector_store)
        self.meal_planner = MealPlanner()

    def create_meal_plan(self, user_profile: UserProfile, user_input: str) -> dict:
        """Create a complete meal plan"""
        print("🧠 PARSING: Understanding your request...")
        self.parser = InputParser(user_profile)
        parsed_input = self.parser.parse(user_input)

        print(f"   Intent: {parsed_input.user_intent}")
        eaten_meals = [k for k, v in parsed_input.already_eaten.items()
                      if v and k != 'total_calories_consumed']
        print(f"   Already eaten: {eaten_meals}")
        print(f"   Meals to plan: {', '.join(parsed_input.meals_to_plan)}")

        print("\n🍽️  STAGE 1: Calculating caloric needs...")
        caloric_plan = self.calorie_calculator.calculate_remaining_calories(user_profile, parsed_input)

        print(f"   Already consumed: {caloric_plan.consumed_calories} kcal")
        print(f"   Remaining target: {caloric_plan.remaining_target} kcal")
        print(f"   Remaining meals: {', '.join(caloric_plan.remaining_meals)}")

        print("\n🔍 STAGE 2: Finding suitable meals...")
        candidates = self.food_retriever.retrieve_candidates(parsed_input, caloric_plan)

        total_candidates = sum(len(items) for items in candidates.values())
        print(f"   Found {total_candidates} suitable meal items")

        for meal_type, items in candidates.items():
            if items:
                print(f"     {meal_type.title()}: {len(items)} options")

        print("\n📋 STAGE 3: Building your meal plan...")
        final_plan = self.meal_planner.generate_plan(user_profile, parsed_input, caloric_plan, candidates)

        return {
            "parsed_input": parsed_input,
            "caloric_plan": caloric_plan,
            "candidates": candidates,
            "final_plan": final_plan
        }
