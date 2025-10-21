import os
import pandas as pd
from langchain_community.vectorstores import Chroma
from langchain_community.embeddings import SentenceTransformerEmbeddings
from langchain.schema import Document

def setup_vector_store():
    """Run this ONCE to create the vector store"""

    # 1️⃣ Prepare CSV and DataFrame
    csv_path = "./meal_data.csv"
    # Create sample meal data if CSV doesn't exist
    if not os.path.exists(csv_path):
        print("🔄 Creating sample meal data CSV...")
        sample_data = [
            ["Breakfast", "Scrambled Eggs", "2 eggs", 140],
            ["Breakfast", "Oatmeal", "1 cup cooked", 150],
            ["Breakfast", "Greek Yogurt", "1 cup", 100],
            ["Breakfast", "Whole Grain Toast", "2 slices", 160],
            ["Breakfast", "Banana", "1 medium", 105],
            ["Breakfast", "Orange Juice", "8 oz", 110],
            ["Breakfast", "Coffee with Milk", "12 oz", 80],
            ["Lunch", "Grilled Chicken Salad", "6 oz chicken, mixed greens", 350],
            ["Lunch", "Turkey Sandwich", "whole grain bread, 4 oz turkey", 320],
            ["Lunch", "Quinoa Bowl", "1 cup quinoa, vegetables", 400],
            ["Lunch", "Vegetable Stir Fry", "mixed vegetables, tofu", 280],
            ["Lunch", "Pasta Primavera", "whole wheat pasta, vegetables", 380],
            ["Lunch", "Chicken Wrap", "whole wheat tortilla, chicken", 360],
            ["Lunch", "Lentil Soup", "1.5 cups", 220],
            ["Dinner", "Grilled Salmon", "6 oz salmon", 350],
            ["Dinner", "Beef Stir Fry", "6 oz beef, vegetables", 420],
            ["Dinner", "Chicken Parmesan", "6 oz chicken, pasta", 480],
            ["Dinner", "Vegetable Curry", "rice, mixed vegetables", 380],
            ["Dinner", "Pork Tenderloin", "6 oz pork", 340],
            ["Dinner", "Shrimp Scampi", "6 oz shrimp, pasta", 360],
            ["Dinner", "Lamb Chops", "6 oz lamb", 400],
            ["Dinner", "Tuna Steak", "6 oz tuna", 320],
            ["Snacks", "Apple", "1 medium", 95],
            ["Snacks", "Almonds", "1 oz (23 almonds)", 160],
            ["Snacks", "Greek Yogurt", "6 oz", 100],
            ["Snacks", "Carrot Sticks", "1 cup", 50],
            ["Snacks", "Protein Bar", "1 bar", 200],
            ["Snacks", "Trail Mix", "1/4 cup", 150],
            ["Snacks", "Cheese Stick", "1 oz", 110],
            ["Snacks", "Rice Cakes", "2 cakes", 70]
        ]

        df = pd.DataFrame(sample_data, columns=['Category', 'Item', 'Serving Size', 'Calories'])
        df.to_csv(csv_path, index=False)
        print(f"✅ Created {csv_path} with {len(sample_data)} meal items")

    new_header = ['Category', 'Item', 'Serving Size', 'Calories']
    matrix = []

    with open(csv_path, 'r', encoding='utf-8') as f:
        lines = f.readlines()

    for line in lines[1:]:
        parts = line.strip().split(',')
        row = parts[:4]
        matrix.append(row)

    df = pd.DataFrame(matrix, columns=new_header)
    df["Category"] = df["Category"].str.strip().str.replace('"', '')

    # Category remapping
    category_map = {
        "Breakfast": "breakfast",
        "Lunch": "lunch",
        "Dinner": "dinner",
        "Snacks": "snacks"
    }

    df["Category"] = df["Category"].map(category_map).fillna("other")

    # 2️⃣ Setup vector store
    db_location = "./chroma_db"
    os.makedirs(db_location, exist_ok=True)

    embeddings = SentenceTransformerEmbeddings(model_name="all-MiniLM-L6-v2")

    # 3️⃣ Create vector store (only if it doesn't exist)
    if not os.path.exists(os.path.join(db_location, "chroma.sqlite3")):
        print("🔄 Creating new vector store...")

        vector_store = Chroma(
            collection_name="meal_database",
            persist_directory=db_location,
            embedding_function=embeddings
        )

        # Convert to documents
        documents = []
        for _, row in df.iterrows():
            content = f"{row['Item']} - Category: {row['Category']}, Serving: {row['Serving Size']}, Calories: {row['Calories']} kcal"
            documents.append(Document(page_content=content))

        # Add documents
        vector_store.add_documents(documents)
        print(f"✅ Added {len(documents)} documents to vector store")

    else:
        print("✅ Vector store already exists, skipping creation")

    return db_location, embeddings

if __name__ == "__main__":
    setup_vector_store()
