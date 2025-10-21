import os
import tensorflow as tf
from tensorflow import keras

def check_dish_model():
    print("🔍 Checking Dish Model...")
    
    # Check the dish model directory
    dish_path = r"F:\PFE Syrine\PROJET PFE CONCLUSION\Models\CNN\Dishs"
    
    print(f"📁 Dish model directory: {dish_path}")
    print(f"📁 Directory exists: {os.path.exists(dish_path)}")
    
    if os.path.exists(dish_path):
        print("📋 Contents of Dish directory:")
        for item in os.listdir(dish_path):
            item_path = os.path.join(dish_path, item)
            if os.path.isfile(item_path):
                size = os.path.getsize(item_path) / (1024*1024)
                print(f"  📄 {item} ({size:.1f} MB)")
            else:
                print(f"  📁 {item}/")
    
    # Look for model files
    model_extensions = ['.h5', '.hdf5', '.keras', '.pb', '.tflite']
    model_files = []
    
    for root, dirs, files in os.walk(dish_path):
        for file in files:
            if any(file.endswith(ext) for ext in model_extensions):
                full_path = os.path.join(root, file)
                size = os.path.getsize(full_path) / (1024*1024)
                model_files.append((file, full_path, size))
    
    if model_files:
        print("\n🎯 Found model files:")
        for file, path, size in model_files:
            print(f"  ✅ {file}")
            print(f"     Path: {path}")
            print(f"     Size: {size:.1f} MB")
            
            # Try to load it
            try:
                model = keras.models.load_model(path)
                print(f"     🟢 LOAD SUCCESSFUL!")
                print(f"     Input shape: {model.input_shape}")
                print(f"     Output shape: {model.output_shape}")
                return model, path
            except Exception as e:
                print(f"     🔴 Load failed: {str(e)[:100]}...")
    else:
        print("❌ No model files found in dish directory")
    
    return None, None

if __name__ == "__main__":
    model, path = check_dish_model()
    if model:
        print(f"\n🎉 Dish model ready to use: {path}")
    else:
        print("\n❌ No working dish model found")