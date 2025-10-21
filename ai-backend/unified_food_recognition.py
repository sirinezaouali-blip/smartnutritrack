import asyncio
from typing import Dict, Any, List
from dish_service import vit_dish_classifier
from cnn_service import cnn_service
from barcode_service import barcode_scanner_service
import numpy as np
from PIL import Image
import io

class UnifiedFoodRecognitionSystem:
    def __init__(self):
        self.dish_classifier = vit_dish_classifier
        self.fruit_veg_classifier = cnn_service
        self.barcode_scanner = barcode_scanner_service

    async def recognize_food(self, image_data: bytes, recognition_type: str = "auto") -> Dict[str, Any]:
        """
        Unified food recognition system that intelligently combines multiple models

        Args:
            image_data: Raw image bytes
            recognition_type: "auto", "dish", "fruit_veg", "barcode"
        """
        try:
            results = {
                "success": True,
                "recognition_type": recognition_type,
                "results": {},
                "final_prediction": None,
                "confidence_analysis": {},
                "processing_time": {}
            }

            # Run all recognition types in parallel for auto mode
            if recognition_type == "auto":
                tasks = [
                    self._recognize_dish(image_data),
                    self._recognize_fruits_vegetables(image_data),
                    self._recognize_barcode(image_data)
                ]

                dish_result, fruit_veg_result, barcode_result = await asyncio.gather(*tasks, return_exceptions=True)

                # Handle exceptions
                dish_result = dish_result if not isinstance(dish_result, Exception) else None
                fruit_veg_result = fruit_veg_result if not isinstance(fruit_veg_result, Exception) else None
                barcode_result = barcode_result if not isinstance(barcode_result, Exception) else None

                results["results"] = {
                    "dish": dish_result,
                    "fruit_vegetable": fruit_veg_result,
                    "barcode": barcode_result
                }

                # Determine best prediction based on confidence and context
                final_prediction = self._select_best_prediction(
                    dish_result, fruit_veg_result, barcode_result
                )

            else:
                # Single recognition type
                if recognition_type == "dish":
                    result = await self._recognize_dish(image_data)
                elif recognition_type == "fruit_veg":
                    result = await self._recognize_fruits_vegetables(image_data)
                elif recognition_type == "barcode":
                    result = await self._recognize_barcode(image_data)
                else:
                    return {"success": False, "error": f"Unknown recognition type: {recognition_type}"}

                results["results"] = {recognition_type: result}
                final_prediction = result

            results["final_prediction"] = final_prediction

            # Add confidence analysis
            if final_prediction:
                results["confidence_analysis"] = self._analyze_confidence(final_prediction)

            return results

        except Exception as e:
            return {
                "success": False,
                "error": f"Unified recognition error: {str(e)}",
                "recognition_type": recognition_type
            }

    async def _recognize_dish(self, image_data: bytes) -> Dict[str, Any]:
        """Recognize dish using ViT model"""
        try:
            result = self.dish_classifier.predict_dish(image_data)
            result["recognition_type"] = "dish"
            return result
        except Exception as e:
            return {"error": f"Dish recognition failed: {str(e)}", "recognition_type": "dish"}

    async def _recognize_fruits_vegetables(self, image_data: bytes) -> Dict[str, Any]:
        """Recognize fruits and vegetables using CNN"""
        try:
            result = self.fruit_veg_classifier.predict_fruits_vegetables(image_data)
            result["recognition_type"] = "fruit_vegetable"
            return result
        except Exception as e:
            return {"error": f"Fruit/veg recognition failed: {str(e)}", "recognition_type": "fruit_vegetable"}

    async def _recognize_barcode(self, image_data: bytes) -> Dict[str, Any]:
        """Recognize barcode"""
        try:
            result = await self.barcode_scanner.scan_barcode(image_data)
            result["recognition_type"] = "barcode"
            return result
        except Exception as e:
            return {"error": f"Barcode recognition failed: {str(e)}", "recognition_type": "barcode"}

    def _select_best_prediction(self, dish_result: Dict, fruit_veg_result: Dict, barcode_result: Dict) -> Dict[str, Any]:
        """
        Select the best prediction based on confidence scores and context analysis
        """
        candidates = []

        # Add dish prediction if available and successful
        if dish_result and "top_prediction" in dish_result:
            dish_conf = dish_result["top_prediction"]["confidence"]
            candidates.append({
                "type": "dish",
                "data": dish_result,
                "confidence": dish_conf,
                "weight": self._calculate_dish_weight(dish_result)
            })

        # Add fruit/veg prediction if available and successful
        if fruit_veg_result and "top_prediction" in fruit_veg_result:
            fv_conf = fruit_veg_result["top_prediction"]["confidence"]
            candidates.append({
                "type": "fruit_vegetable",
                "data": fruit_veg_result,
                "confidence": fv_conf,
                "weight": self._calculate_fruit_veg_weight(fruit_veg_result)
            })

        # Add barcode prediction if available and successful
        if barcode_result and barcode_result.get("success"):
            candidates.append({
                "type": "barcode",
                "data": barcode_result,
                "confidence": 0.95,  # Barcodes are highly reliable when detected
                "weight": 1.0
            })

        if not candidates:
            return None

        # Sort by weighted confidence
        candidates.sort(key=lambda x: x["confidence"] * x["weight"], reverse=True)

        best_candidate = candidates[0]
        result = best_candidate["data"].copy()
        result["selected_reason"] = f"Best {best_candidate['type']} prediction with weighted confidence {best_candidate['confidence'] * best_candidate['weight']:.3f}"
        result["all_candidates"] = [
            {
                "type": c["type"],
                "confidence": c["confidence"],
                "weighted_confidence": c["confidence"] * c["weight"]
            } for c in candidates
        ]

        return result

    def _calculate_dish_weight(self, dish_result: Dict) -> float:
        """Calculate weight for dish predictions based on context"""
        if not dish_result or "top_prediction" not in dish_result:
            return 0.5

        dish_name = dish_result["top_prediction"]["dish_name"].lower()

        # Higher weight for complete meals/dishes
        meal_keywords = ["pizza", "pasta", "curry", "stir fry", "salad", "sandwich", "burger"]
        if any(keyword in dish_name for keyword in meal_keywords):
            return 1.2

        # Lower weight for desserts or single items
        dessert_keywords = ["cake", "pie", "ice cream", "cookie", "mousse"]
        if any(keyword in dish_name for keyword in dessert_keywords):
            return 0.8

        return 1.0

    def _calculate_fruit_veg_weight(self, fruit_veg_result: Dict) -> float:
        """Calculate weight for fruit/vegetable predictions"""
        if not fruit_veg_result or "top_prediction" not in fruit_veg_result:
            return 0.5

        # Fruits and vegetables are often single items, so slightly lower weight for dishes
        # but higher weight for fresh produce recognition
        return 0.9

    def _analyze_confidence(self, prediction: Dict) -> Dict[str, Any]:
        """Analyze confidence levels and provide recommendations"""
        analysis = {
            "overall_confidence": 0.0,
            "confidence_level": "low",
            "recommendations": []
        }

        if "top_prediction" in prediction:
            conf = prediction["top_prediction"]["confidence"]
            analysis["overall_confidence"] = conf

            if conf >= 0.8:
                analysis["confidence_level"] = "high"
                analysis["recommendations"].append("High confidence prediction - likely accurate")
            elif conf >= 0.6:
                analysis["confidence_level"] = "medium"
                analysis["recommendations"].append("Medium confidence - consider verifying")
                analysis["recommendations"].append("Try different angle or lighting")
            else:
                analysis["confidence_level"] = "low"
                analysis["recommendations"].append("Low confidence - try again with clearer image")
                analysis["recommendations"].append("Ensure food is well-lit and in focus")

        # Add nutrition data quality analysis
        if prediction.get("nutrition") and prediction["nutrition"].get("success"):
            analysis["nutrition_quality"] = "good"
        else:
            analysis["nutrition_quality"] = "estimated"
            analysis["recommendations"].append("Nutrition data is estimated - verify with known values")

        return analysis

    async def get_nutrition_comparison(self, predictions: List[Dict]) -> Dict[str, Any]:
        """Compare nutrition data across different predictions"""
        comparison = {
            "predictions": predictions,
            "nutrition_comparison": {},
            "recommendations": []
        }

        # Extract nutrition data
        nutrition_data = {}
        for pred in predictions:
            if pred.get("nutrition") and pred["nutrition"].get("success"):
                key = pred["recognition_type"]
                nutrition_data[key] = pred["nutrition"]

        if len(nutrition_data) > 1:
            comparison["nutrition_comparison"] = self._compare_nutrition_values(nutrition_data)
            comparison["recommendations"].append("Multiple nutrition sources available - compare values")

        return comparison

    def _compare_nutrition_values(self, nutrition_data: Dict) -> Dict[str, Any]:
        """Compare nutrition values across different sources"""
        comparison = {}

        # Compare calories
        calories = {}
        for source, data in nutrition_data.items():
            if "nutrients" in data and "calories" in data["nutrients"]:
                cal_str = data["nutrients"]["calories"]
                # Extract numeric value
                try:
                    cal_value = float(cal_str.split()[0])
                    calories[source] = cal_value
                except:
                    continue

        if len(calories) > 1:
            min_cal = min(calories.values())
            max_cal = max(calories.values())
            comparison["calories"] = {
                "range": f"{min_cal} - {max_cal}",
                "difference": max_cal - min_cal,
                "sources": calories
            }

        return comparison

# Global instance
unified_food_system = UnifiedFoodRecognitionSystem()
