from pymongo import MongoClient
import google.generativeai as genai
from dotenv import load_dotenv
import os

# Load environment variables
def gemini_analysis():
    load_dotenv()
    api_key = os.environ.get("gemini_api")
    print("Gemini API Key Loaded:", bool(api_key))

    # Configure Gemini
    genai.configure(api_key=api_key)
    model = genai.GenerativeModel('gemini-2.5-flash')

    # Connect to MongoDB
    client = MongoClient("mongodb://localhost:27017/")
    db = client['corner_Coach']
    pose_collection = db['positions']

    # Retrieve all frames and format as a string
    frames = list(pose_collection.find().sort("_id", 1))
    frame_data_str = "\n".join(
        f"Frame {f['_id']}: LH–LS: {f.get('left_hand_to_left_shoulder')}, RH–RS: {f.get('right_hand_to_right_shoulder')}, LH–Face: {f.get('left_hand_to_face_center')}, RH–Face: {f.get('right_hand_to_face_center')}, Knees: {f.get('knee_to_knee')}, Toes: {f.get('toe_to_toe')}"
        for f in frames if "left_hand_to_left_shoulder" in f
    )

    # Optional: Limit prompt length
    frame_data_str = "\n".join(frame_data_str.splitlines()[:200])  # Limit to first 200 lines

    # Prompt
    prompt = f"""
    You are analyzing boxing performance using key point distance data from a shadowboxing video (30 FPS).
    Each frame gives:
    - LH–LS: Left hand to left shoulder
    - RH–RS: Right hand to right shoulder
    - LH–Face, RH–Face: hand to face distances
    - Knees: knee-to-knee distance
    - Toes: toe-to-toe distance

    Analyze the data below and provide:
    1. Number of left and right punches thrown.
    2. Whether they are jabs or hooks.
    3. Stance or balance issues from toe/knee data.
    4. 2–3 coaching tips on improving form.

    Provide the response in the markdown file format

    Data:
    {frame_data_str}
    """

    # Generate response
    try:
        print("Sending data to Gemini...")
        response = model.generate_content(prompt)
        print("\n Analysis Response:\n")
        print(response.text)


        file = open('static\stat1.md', 'w')
        file.write(response.text)
        file.close
        return response

    except Exception as e:
        print(" Gemini error:", e)



if __name__ == '__main__':
    gemini_analysis()
