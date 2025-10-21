# ================================
# File: parsers.py
# Input parsing logic
# ================================

from langchain_ollama.llms import OllamaLLM
from models import ParsedInput ,UserProfile
from config import Config

import json
import re
import numpy as np
from typing import Dict, List, Optional
from langchain.prompts import ChatPromptTemplate
from langchain_ollama.llms import OllamaLLM

try:
    from sentence_transformers import SentenceTransformer
    from sklearn.metrics.pairwise import cosine_similarity
    SEMANTIC_AVAILABLE = True
except ImportError:
    SEMANTIC_AVAILABLE = False
    print("⚠️  Warning: sentence-transformers or scikit-learn not available. Install with:")
    print("   pip install sentence-transformers scikit-learn")




class InputParser:
    """Parses user meal requests with optional semantic validation"""

    def __init__(self, user_profile: UserProfile):
        self.model = OllamaLLM(model=Config.LLM_MODEL)
        self._setup_templates()
        self.target_calories = user_profile.target_calories

        # Initialize embedding model and patterns if available
        if SEMANTIC_AVAILABLE:
            try:
                self._setup_semantic_validation()
                self.semantic_enabled = True
            except Exception as e:
                print(f"⚠️  Semantic validation failed to initialize: {e}")
                self.semantic_enabled = False
        else:
            self.semantic_enabled = False
            print("   📝 Using rule-based parsing only")

    def _setup_templates(self):
            """Setup prompt templates"""
            self.parsing_template = """
            You are an AI that parses meal requests. Analyze the user input and extract:
            1. What they want to eat for specific meals
            2. What they have already eaten
            3. Which meals they're planning for

            Important: If user says "already had breakfast" or similar, mark that meal as consumed!

            USER INPUT: "{user_input}"

            EXAMPLES:
            Input: "already had breakfast, need lunch and dinner ideas"
            Output: {{"already_eaten": {{"breakfast": ["breakfast items"], "lunch": null, "dinner": null, "snacks": null, "total_calories_consumed": 380}}, "meal_requests": {{"breakfast": null, "lunch": null, "dinner": null, "snacks": null}}, "meals_to_plan": ["lunch", "dinner"], "user_intent": "need lunch and dinner ideas after having breakfast"}}

            Input: "I want chicken for lunch, egg and coffee for breakfast"
            Output: {{"already_eaten": {{"breakfast": null, "lunch": null, "dinner": null, "snacks": null, "total_calories_consumed": 0}}, "meal_requests": {{"breakfast": "egg and coffee", "lunch": "chicken", "dinner": null, "snacks": null}}, "meals_to_plan": ["breakfast", "lunch"], "user_intent": "wants specific items for breakfast and lunch"}}

            Input: "want nuggets and fries for lunch"
            Output: {{"already_eaten": {{"breakfast": null, "lunch": null, "dinner": null, "snacks": null, "total_calories_consumed": 0}}, "meal_requests": {{"breakfast": null, "lunch": "nuggets and fries", "dinner": null, "snacks": null}}, "meals_to_plan": ["lunch"], "user_intent": "wants nuggets and fries for lunch"}}

            OUTPUT FORMAT (JSON only, no other text):
            {{
                "already_eaten": {{
                    "breakfast": ["item1", "item2"] or null,
                    "lunch": ["item1"] or null,
                    "dinner": ["item1"] or null,
                    "snacks": ["item1"] or null,
                    "total_calories_consumed": estimated_calories_number
                }},
                "meal_requests": {{
                    "breakfast": null,
                    "lunch": null,
                    "dinner": null,
                    "snacks": null
                }},
                "meals_to_plan": ["list of meals to plan"],
                "user_intent": "brief summary of what user wants"
            }}
            """

    def _setup_semantic_validation(self):
        """Initialize embedding model and semantic patterns"""
        print("   🧠 Loading semantic validation model...")

        # Use a more lightweight model for faster loading
        try:
            self.embedding_model = SentenceTransformer('all-MiniLM-L6-v2')
        except Exception as e:
            print(f"   Failed to load SentenceTransformer: {e}")
            raise

        # Consumption patterns for each meal
        self.consumption_patterns = {
            "breakfast": [
                "already had breakfast", "finished breakfast", "ate breakfast",
                "done with breakfast", "breakfast is complete", "had morning meal",
                "consumed breakfast", "breakfast already eaten", "morning food done",
                "breakfast finished", "completed breakfast", "had my breakfast"
            ],
            "lunch": [
                "already had lunch", "finished lunch", "ate lunch",
                "done with lunch", "lunch is complete", "had midday meal",
                "consumed lunch", "lunch already eaten", "afternoon food done",
                "lunch finished", "completed lunch", "had my lunch"
            ],
            "dinner": [
                "already had dinner", "finished dinner", "ate dinner",
                "done with dinner", "dinner is complete", "had evening meal",
                "consumed dinner", "dinner already eaten", "night food done",
                "dinner finished", "completed dinner", "had my dinner"
            ],
            "snacks": [
                "already had snacks", "finished snacking", "ate snacks",
                "done snacking", "had some snacks", "consumed snacks",
                "snacked already", "had a snack", "snack time done"
            ]
        }

        # General meal items with semantic descriptions
        self.meal_items = {
            "chicken": [
                "chicken", "grilled chicken", "fried chicken", "chicken breast", "chicken thigh",
                "roasted chicken", "baked chicken", "chicken salad", "chicken sandwich"
            ],
            "beef": [
                "beef", "steak", "hamburger", "ground beef", "roast beef", "beef stew",
                "beef burger", "beef sandwich", "beef tacos"
            ],
            "fish": [
                "fish", "salmon", "tuna", "cod", "tilapia", "seafood", "grilled fish",
                "baked fish", "fish tacos", "fish sandwich"
            ],
            "pasta": [
                "pasta", "spaghetti", "macaroni", "noodles", "lasagna", "ravioli",
                "pasta salad", "pasta primavera", "carbonara"
            ],
            "rice": [
                "rice", "brown rice", "white rice", "fried rice", "rice pilaf",
                "rice bowl", "rice salad", "jasmine rice"
            ],
            "salad": [
                "salad", "green salad", "caesar salad", "garden salad", "fruit salad",
                "potato salad", "pasta salad", "chicken salad"
            ],
            "eggs": [
                "eggs", "scrambled eggs", "boiled eggs", "fried eggs", "omelette",
                "egg salad", "deviled eggs", "egg sandwich"
            ],
            "sandwich": [
                "sandwich", "ham sandwich", "turkey sandwich", "club sandwich",
                "grilled cheese", "BLT", "sub sandwich", "panini"
            ]
        }

        # Pre-compute embeddings for all patterns
        self._precompute_embeddings()
        print("   ✅ Semantic validation ready!")

    def _precompute_embeddings(self):
        """Pre-compute embeddings for better performance"""
        self.consumption_embeddings = {}
        self.item_embeddings = {}

        # Compute consumption pattern embeddings
        for meal_type, patterns in self.consumption_patterns.items():
            embeddings = self.embedding_model.encode(patterns)
            self.consumption_embeddings[meal_type] = embeddings

        # Compute item embeddings
        for item_name, descriptions in self.meal_items.items():
            embeddings = self.embedding_model.encode(descriptions)
            self.item_embeddings[item_name] = embeddings

    def parse(self, user_input: str) -> ParsedInput:
        """Parse user input into structured format"""
        parsing_prompt = ChatPromptTemplate.from_template(self.parsing_template)
        parsing_chain = parsing_prompt | self.model

        response = parsing_chain.invoke({"user_input": user_input})

        print("response:", response)
        # Extract JSON from response
        json_match = re.search(r'\{.*\}', response, re.DOTALL)
        if json_match:
            json_str = json_match.group()
        else:
            json_str = response.strip()

        try:
            parsed_data = json.loads(json_str)

            # Apply validation based on available methods
            if self.semantic_enabled:
                self._validate_parsed_data_semantic(parsed_data, user_input)
            else:
                self._validate_parsed_data_rules(parsed_data, user_input)

            return ParsedInput(
                already_eaten=parsed_data["already_eaten"],
                meal_requests=parsed_data["meal_requests"],
                meals_to_plan=parsed_data["meals_to_plan"],
                user_intent=parsed_data["user_intent"]
            )

        except json.JSONDecodeError as e:
            print(f"JSON parsing error: {e}")
            return self._fallback_parsing(user_input)

    def _validate_parsed_data_rules(self, parsed_data: dict, user_input: str):
        """Rule-based validation fallback"""
        user_input_lower = user_input.lower()

        # Simple pattern matching for meal consumption
        meal_patterns = {
            "breakfast": [r'already.*breakfast', r'had.*breakfast', r'done.*breakfast'],
            "lunch": [r'already.*lunch', r'had.*lunch', r'done.*lunch'],
            "dinner": [r'already.*dinner', r'had.*dinner', r'done.*dinner'],
            "snacks": [r'already.*snack', r'had.*snack', r'done.*snack']
        }

        for meal_type, patterns in meal_patterns.items():
            for pattern in patterns:
                if re.search(pattern, user_input_lower):
                    if not parsed_data["already_eaten"][meal_type]:
                        meal_calories = int(self.target_calories * Config.CALORIE_DISTRIBUTION[meal_type])
                        parsed_data["already_eaten"][meal_type] = [f"{meal_type} items"]

                        current_consumed = parsed_data["already_eaten"].get("total_calories_consumed", 0)
                        parsed_data["already_eaten"]["total_calories_consumed"] = current_consumed + meal_calories

                        if meal_type in parsed_data["meals_to_plan"]:
                            parsed_data["meals_to_plan"].remove(meal_type)

                        print(f"   ✓ Rule-based detection - consumed {meal_type}: +{meal_calories} kcal")
                        break

    def _validate_parsed_data_semantic(self, parsed_data: dict, user_input: str):
        """Validate and correct parsed data using semantic similarity"""
        user_input_lower = user_input.lower()

        # Check each meal type for consumption using embeddings
        for meal_type in ["breakfast", "lunch", "dinner", "snacks"]:
            if self._check_meal_consumed_semantic(user_input_lower, meal_type):
                if not parsed_data["already_eaten"][meal_type]:
                    # Calculate calories for this meal
                    meal_calories = int(self.target_calories * Config.CALORIE_DISTRIBUTION[meal_type])
                    parsed_data["already_eaten"][meal_type] = [f"{meal_type} items"]

                    # Update total calories consumed
                    current_consumed = parsed_data["already_eaten"].get("total_calories_consumed", 0)
                    parsed_data["already_eaten"]["total_calories_consumed"] = current_consumed + meal_calories

                    # Remove from meals to plan
                    if meal_type in parsed_data["meals_to_plan"]:
                        parsed_data["meals_to_plan"].remove(meal_type)

                    print(f"   ✓ Semantic detection - consumed {meal_type}: +{meal_calories} kcal")

        # Validate meal requests using semantic similarity
        self._validate_meal_requests_semantic(parsed_data, user_input_lower)

        # Ensure at least one meal needs planning
        if not parsed_data["meals_to_plan"]:
            remaining_meals = [meal for meal in ["breakfast", "lunch", "dinner", "snacks"]
                              if not parsed_data["already_eaten"][meal]]
            if remaining_meals:
                parsed_data["meals_to_plan"] = remaining_meals[:2]
                print(f"   ✓ Auto-added meals to plan: {parsed_data['meals_to_plan']}")

        # Validate calorie totals
        self._validate_calorie_totals(parsed_data)

    def _check_meal_consumed_semantic(self, user_input: str, meal_type: str, threshold: float = 0.85) -> bool:
        """Check if meal consumption is mentioned using semantic similarity"""
        if not self.semantic_enabled:
            return False

        try:
            # First check for explicit negation patterns
            negation_patterns = [
                f"need {meal_type}", f"want {meal_type}", f"ideas for {meal_type}",
                f"planning {meal_type}", f"suggest {meal_type}", f"{meal_type} ideas"
            ]

            for pattern in negation_patterns:
                if pattern in user_input.lower():
                    print(f"   🚫 Negation detected for {meal_type}: '{pattern}' - not consumed")
                    return False

            # Get user input embedding
            user_embedding = self.embedding_model.encode([user_input])

            # Get consumption patterns for this meal type
            pattern_embeddings = self.consumption_embeddings[meal_type]

            # Calculate similarities
            similarities = cosine_similarity(user_embedding, pattern_embeddings)[0]
            max_similarity = np.max(similarities)

            if max_similarity > threshold:
                best_match_idx = np.argmax(similarities)
                best_match = self.consumption_patterns[meal_type][best_match_idx]
                print(f"   🎯 Semantic match for {meal_type}: '{best_match}' (similarity: {max_similarity:.3f})")
                return True

        except Exception as e:
            print(f"   ⚠️  Semantic check failed for {meal_type}: {e}")

        return False

    def _validate_meal_requests_semantic(self, parsed_data: dict, user_input: str, threshold: float = 0.6):
        """Validate and enhance meal requests using semantic similarity"""
        if not self.semantic_enabled:
            return

        try:
            # Get user input embedding
            user_embedding = self.embedding_model.encode([user_input])

            # Check for meal items
            detected_items = {}

            for item_name, descriptions in self.meal_items.items():
                item_embeddings = self.item_embeddings[item_name]
                similarities = cosine_similarity(user_embedding, item_embeddings)[0]
                max_similarity = np.max(similarities)

                if max_similarity > threshold:
                    best_match_idx = np.argmax(similarities)
                    best_match = descriptions[best_match_idx]
                    detected_items[item_name] = {
                        'similarity': max_similarity,
                        'matched_phrase': best_match
                    }

            # Sort by similarity and assign to appropriate meals
            sorted_items = sorted(detected_items.items(), key=lambda x: x[1]['similarity'], reverse=True)

            for item_name, item_info in sorted_items[:3]:  # Limit to top 3 matches
                # Determine best meal type for this item
                best_meal_type = self._get_best_meal_type_for_item(item_name)

                # Add to meal requests if not already specified
                current_request = parsed_data["meal_requests"].get(best_meal_type, "")
                if not current_request:
                    parsed_data["meal_requests"][best_meal_type] = item_name
                    print(f"   🎯 Semantic item detection: {item_name} for {best_meal_type} "
                          f"(similarity: {item_info['similarity']:.3f})")
                elif item_name not in current_request:
                    parsed_data["meal_requests"][best_meal_type] += f", {item_name}"

        except Exception as e:
            print(f"   ⚠️  Semantic meal request validation failed: {e}")

    def _get_best_meal_type_for_item(self, item_name: str) -> str:
        """Determine the most appropriate meal type for a meal item"""

        # Rule-based mapping (more reliable than pure semantic for this case)
        meal_mapping = {
            "eggs": "breakfast",
            "sandwich": "lunch",
            "chicken": "lunch",
            "beef": "dinner",
            "fish": "dinner",
            "pasta": "dinner",
            "rice": "lunch",
            "salad": "lunch"
        }

        return meal_mapping.get(item_name, "lunch")  # Default to lunch

    def _validate_calorie_totals(self, parsed_data: dict):
        """Validate and adjust calorie totals"""
        consumed_calories = parsed_data["already_eaten"].get("total_calories_consumed", 0)

        # Check if consumed calories seem reasonable
        if consumed_calories > self.target_calories:
            print(f"   ⚠️  Warning: Consumed calories ({consumed_calories}) exceed daily target ({self.target_calories})")
        elif consumed_calories < 0:
            parsed_data["already_eaten"]["total_calories_consumed"] = 0
            print("   ✓ Fixed negative calorie count")

        # Ensure remaining meals can fit within calorie budget
        remaining_budget = max(0, self.target_calories - consumed_calories)
        remaining_meals = len(parsed_data["meals_to_plan"])

        if remaining_meals > 0:
            avg_calories_per_meal = remaining_budget / remaining_meals
            if avg_calories_per_meal < 100:
                print(f"   ⚠️  Warning: Very low calories remaining per meal ({avg_calories_per_meal:.0f} kcal)")
            elif avg_calories_per_meal > 1000:
                print(f"   ⚠️  Warning: Very high calories remaining per meal ({avg_calories_per_meal:.0f} kcal)")

    def _fallback_parsing(self, user_input: str) -> ParsedInput:
        """Enhanced fallback parsing with semantic support"""
        already_eaten = {
            "breakfast": None, "lunch": None, "dinner": None,
            "snacks": None, "total_calories_consumed": 0
        }
        meal_requests = {
            "breakfast": None, "lunch": None, "dinner": None, "snacks": None
        }
        meals_to_plan = ["lunch", "dinner"]

        # Try semantic validation even in fallback
        if self.semantic_enabled:
            try:
                user_input_lower = user_input.lower()

                # Check for meal consumption semantically with stricter validation
                for meal_type in ["breakfast", "lunch", "dinner", "snacks"]:
                    if self._check_meal_consumed_semantic(user_input_lower, meal_type, threshold=0.85):
                        already_eaten[meal_type] = [f"{meal_type} items"]
                        meal_calories = int(self.target_calories * Config.CALORIE_DISTRIBUTION[meal_type])
                        already_eaten["total_calories_consumed"] += meal_calories

                        if meal_type in meals_to_plan:
                            meals_to_plan.remove(meal_type)
            except Exception as e:
                print(f"   ⚠️  Fallback semantic parsing failed: {e}")

        # Fall back to regex if semantic fails or unavailable
        if not any(already_eaten[meal] for meal in ["breakfast", "lunch", "dinner", "snacks"]):
            if re.search(r'already.*breakfast|had.*breakfast', user_input.lower()):
                already_eaten["breakfast"] = ["breakfast items"]
                breakfast_calories = int(self.target_calories * Config.CALORIE_DISTRIBUTION["breakfast"])
                already_eaten["total_calories_consumed"] = breakfast_calories
                meals_to_plan = ["lunch", "dinner", "snacks"]

        return ParsedInput(
            already_eaten=already_eaten,
            meal_requests=meal_requests,
            meals_to_plan=meals_to_plan,
            user_intent=f"User wants: {user_input}"
        )
