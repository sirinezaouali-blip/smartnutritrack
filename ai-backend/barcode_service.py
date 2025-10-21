import requests
import cv2
import numpy as np
from pyzbar.pyzbar import decode
from PIL import Image
import io
import json
from typing import Dict, Any

class BarcodeScannerService:
    def __init__(self):
        self.backend_url = "http://localhost:5000"
    
    async def scan_barcode(self, image_data: bytes) -> Dict[str, Any]:
        """Scan barcode from image and get product info from database"""
        try:
            # Decode barcode from image
            barcode_data = self.decode_barcode_from_image(image_data)
            
            if not barcode_data:
                return {
                    "success": False,
                    "message": "No barcode detected in image",
                    "suggestions": [
                        "Ensure barcode is clearly visible",
                        "Try better lighting conditions",
                        "Make sure barcode is not blurry"
                    ]
                }
            
            # Get product information from database
            product_info = await self.get_product_from_database(barcode_data)
            
            return {
                "success": True,
                "message": f"Barcode scanned successfully: {barcode_data}",
                "data": {
                    "barcode": barcode_data,
                    "product": product_info,
                    "scan_type": "barcode"
                }
            }
            
        except Exception as e:
            return {
                "success": False,
                "message": f"Barcode scanning error: {str(e)}",
                "data": None
            }
    
    def decode_barcode_from_image(self, image_data: bytes) -> str:
        """Decode barcode from image using OpenCV and pyzbar"""
        try:
            # Convert bytes to numpy array
            nparr = np.frombuffer(image_data, np.uint8)
            img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
            
            if img is None:
                raise ValueError("Could not decode image")
            
            # Decode barcodes
            barcodes = decode(img)
            
            if not barcodes:
                return None
            
            # Return the first barcode data
            return barcodes[0].data.decode('utf-8')
            
        except Exception as e:
            print(f"Barcode decoding error: {e}")
            return None
    
    async def get_product_from_database(self, barcode: str) -> Dict[str, Any]:
        """Get product information from database using barcode"""
        try:
            # First, try to find exact match in our meals database
            url = f"{self.backend_url}/api/meals/search"
            params = {'q': barcode}
            
            response = requests.get(url, params=params, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                if data.get('success') and data.get('data'):
                    # Found matching product in our database
                    product = data['data'][0]
                    return {
                        "name": product.get('name', 'Unknown Product'),
                        "calories": product.get('calories', 0),
                        "protein": product.get('protein', 0),
                        "carbs": product.get('carbs', 0),
                        "fat": product.get('fat', 0),
                        "source": "smart_nutritrack_database",
                        "barcode_match": "exact"
                    }
            
            # If not found in our database, try Open Food Facts (FREE API)
            return await self.get_product_from_open_food_facts(barcode)
            
        except Exception as e:
            print(f"Database lookup error: {e}")
            return await self.get_product_from_open_food_facts(barcode)
    
    async def get_product_from_open_food_facts(self, barcode: str) -> Dict[str, Any]:
        """Get product information from Open Food Facts API (FREE)"""
        try:
            url = f"https://world.openfoodfacts.org/api/v0/product/{barcode}.json"
            response = requests.get(url, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                if data.get("status") == 1:
                    product = data.get("product", {})
                    
                    # Extract nutritional information
                    nutriments = product.get("nutriments", {})
                    nutrition = {
                        "calories": nutriments.get("energy-kcal_100g"),
                        "protein": nutriments.get("proteins_100g"),
                        "carbs": nutriments.get("carbohydrates_100g"),
                        "fat": nutriments.get("fat_100g"),
                        "sugar": nutriments.get("sugars_100g"),
                        "fiber": nutriments.get("fiber_100g")
                    }
                    
                    # Clean nutrition data (remove None values)
                    nutrition = {k: v for k, v in nutrition.items() if v is not None}
                    
                    return {
                        "name": product.get("product_name", "Unknown Product"),
                        "brand": product.get("brands", ""),
                        "categories": product.get("categories", ""),
                        "ingredients": product.get("ingredients_text", ""),
                        "nutrition": nutrition,
                        "image_url": product.get("image_url", ""),
                        "source": "open_food_facts",
                        "barcode_match": "external_api"
                    }
            
            return {
                "name": "Product not found in database",
                "barcode": barcode,
                "source": "not_found",
                "note": "Product not found in Open Food Facts database"
            }
            
        except Exception as e:
            return {
                "name": "Error fetching product info",
                "barcode": barcode,
                "source": "error",
                "error": str(e)
            }
    
    async def search_product_manual(self, product_name: str) -> Dict[str, Any]:
        """Manual product search as fallback"""
        try:
            # Search in our database
            url = f"{self.backend_url}/api/meals/search"
            params = {'q': product_name}
            
            response = requests.get(url, params=params, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                if data.get('success') and data.get('data'):
                    products = data['data']
                    return {
                        "success": True,
                        "message": f"Found {len(products)} matching products",
                        "data": {
                            "products": products,
                            "search_term": product_name,
                            "source": "smart_nutritrack_database"
                        }
                    }
            
            return {
                "success": False,
                "message": "No products found matching your search",
                "data": None
            }
            
        except Exception as e:
            return {
                "success": False,
                "message": f"Search error: {str(e)}",
                "data": None
            }

# Global instance
barcode_scanner_service = BarcodeScannerService()