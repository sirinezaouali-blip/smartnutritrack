# ================================
# File: food_retriever.py
# Food retrieval and search logic
# ================================

import re
from typing import Dict, List
from langchain_community.vectorstores import Chroma
from models import ParsedInput, CaloricPlan, FoodCandidate
from config import Config

class FoodRetriever:
    """Handles food retrieval from vector store"""

    def __init__(self, vector_store: Chroma):
        self.vector_store = vector_store
        self.retriever = vector_store.as_retriever()

    def retrieve_candidates(self, parsed_input: ParsedInput, caloric_plan: CaloricPlan) -> Dict[str, List[FoodCandidate]]:
        """Retrieve food candidates for each meal"""
        candidates = {}
        meal_requests = parsed_input.meal_requests

        for meal_type in ["breakfast", "lunch", "dinner", "snacks"]:
            meal_calories = getattr(caloric_plan, meal_type)["calories"]

            if meal_calories > 0:
                # Build search query
                if meal_requests.get(meal_type):
                    search_query = f"{meal_requests[meal_type]} {meal_type}"
                else:
                    terms = Config.MEAL_TYPE_TERMS[meal_type]
                    search_query = " ".join(terms[:3])

                print(f"   Searching for {meal_type}: '{search_query}'")

                # Retrieve documents
                docs = self.retriever.get_relevant_documents(search_query, k=Config.RETRIEVAL_K)

                # Process candidates
                suitable_items = self._process_candidates(docs, meal_type, meal_calories, search_query)
                candidates[meal_type] = suitable_items[:Config.MAX_CANDIDATES_PER_MEAL]

        return candidates

    def _process_candidates(self, docs, meal_type: str, meal_calories: int, search_query: str) -> List[FoodCandidate]:
        """Process retrieved documents into food candidates"""
        suitable_items = []

        for doc in docs:
            content = doc.page_content

            # Extract calories
            calories = self._extract_calories(content)

            if calories != "unknown":
                # Check if within acceptable range
                if calories <= meal_calories * Config.CALORIE_FLEXIBILITY_FACTOR:
                    suitable_items.append(FoodCandidate(
                        content=content,
                        calories=calories,
                        meal_type=meal_type,
                        search_query=search_query
                    ))
            else:
                # Include items without clear calorie info
                suitable_items.append(FoodCandidate(
                    content=content,
                    calories="unknown",
                    meal_type=meal_type,
                    search_query=search_query
                ))

        # Sort by calorie proximity to target
        def calorie_distance(item):
            if item.calories == "unknown":
                return 999999
            return abs(item.calories - meal_calories)

        suitable_items.sort(key=calorie_distance)
        return suitable_items

    def _extract_calories(self, content: str) -> any:
        """Extract calorie information from content"""
        # Look for explicit calorie mentions
        calorie_matches = re.findall(r'(\d+)\s*(?:kcal|cal|calories)', content.lower())
        if calorie_matches:
            return int(calorie_matches[0])

        # Look for standalone numbers that might be calories
        numbers = re.findall(r'\b(\d{2,4})\b', content)
        calorie_candidates = [int(n) for n in numbers if 50 <= int(n) <= 2000]

        if calorie_candidates:
            return calorie_candidates[0]

        return "unknown"
