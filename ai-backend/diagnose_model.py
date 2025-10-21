import tensorflow as tf
from tensorflow import keras
import numpy as np
import os

def diagnose_cnn_model():
    model_path = r"F:\PFE Syrine\PROJET PFE CONCLUSION\Models\CNN\Fruits&vegetables\best_model.h5"
    
    print("🔍 Diagnosing CNN Model...")
    print(f"Model path: {model_path}")
    print(f"File exists: {os.path.exists(model_path)}")
    
    if os.path.exists(model_path):
        try:
            # Try to load the model
            model = keras.models.load_model(model_path)
            print("✅ Model loaded successfully!")
            
            # Get model details
            print(f"📊 Model Input Shape: {model.input_shape}")
            print(f"📊 Model Output Shape: {model.output_shape}")
            print(f"📊 Number of Layers: {len(model.layers)}")
            print(f"📊 Model Summary:")
            model.summary()
            
            # Test prediction with dummy data
            if model.input_shape[1] is not None:
                input_shape = model.input_shape[1:]
                dummy_input = np.random.random((1, *input_shape))
                prediction = model.predict(dummy_input)
                print(f"✅ Test prediction successful! Output shape: {prediction.shape}")
                
                # Try to determine number of classes
                if len(prediction.shape) == 2:
                    num_classes = prediction.shape[1]
                    print(f"🎯 Number of classes (output neurons): {num_classes}")
                else:
                    print("⚠️ Unexpected output shape, cannot determine number of classes")
            
        except Exception as e:
            print(f"❌ Error loading model: {e}")
    else:
        print("❌ Model file not found!")

if __name__ == "__main__":
    diagnose_cnn_model()