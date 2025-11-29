# Fix Fat Field Name Inconsistencies

## Tasks
- [x] Fix calculations in `userMealController.js`: Change `meal.fats` to `meal.fat` in totals and creation
- [ ] Fix calculations in `analyticsController.js`: Change `meal.fats` to `meal.fat` in all analytics functions
- [ ] Update response fields in `analyticsController.js`: Change `fat` to `fats` in data objects for consistency
- [ ] Test: Add a meal with fat and verify dashboard shows correct values

## Files to Edit
- backend/src/controllers/userMealController.js
- backend/src/controllers/analyticsController.js
