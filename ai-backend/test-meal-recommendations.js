const AIService = require('../backend/src/utils/aiService');

async function testMealRecommendations() {
    try {
        console.log('🧪 Testing meal recommendations...');
        
        // Test 1: Lunch with chicken preference
        const result = await AIService.getMealRecommendations(
            'lunch', 
            'chicken', 
            5
        );
        
        console.log('✅ Test successful!');
        console.log(`Meal Type: ${result.meal_type}`);
        console.log(`Target Calories: ${result.target_calories}`);
        console.log(`Found ${result.items.length} items:`);
        
        result.items.forEach((item, index) => {
            console.log(`${index + 1}. ${item.food_name} - ${item.calories} kcal`);
        });
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
    }
}

// Run the test
testMealRecommendations();