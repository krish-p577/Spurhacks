import cv2
import mediapipe as mp
import numpy as np
import math
from pymongo import MongoClient
import google.generativeai as genai

mp_drawing = mp.solutions.drawing_utils
mp_pose = mp.solutions.pose



# Utility: Euclidean distance
def euclidean_distance(p1, p2):
    return math.sqrt((p1[0] - p2[0])**2 + (p1[1] - p2[1])**2)

# Core distance calculator
def calculate_key_distances(landmarks, frame_shape):
    h, w = frame_shape
    def get_coords(index):
        return (int(landmarks[index].x * w), int(landmarks[index].y * h))

    left_shoulder = get_coords(11)
    right_shoulder = get_coords(12)
    left_hand = get_coords(15)
    right_hand = get_coords(16)
    nose = get_coords(0)
    left_knee = get_coords(25)
    right_knee = get_coords(26)
    left_toes = get_coords(31)
    right_toes = get_coords(32)

    distances = {
        "left_hand_to_left_shoulder": euclidean_distance(left_hand, left_shoulder),
        "right_hand_to_right_shoulder": euclidean_distance(right_hand, right_shoulder),
        "left_hand_to_face_center": euclidean_distance(left_hand, nose),
        "right_hand_to_face_center": euclidean_distance(right_hand, nose),
        "knee_to_knee": euclidean_distance(left_knee, right_knee),
        "toe_to_toe": euclidean_distance(left_toes, right_toes)
    }
    return distances


def track_custom_points_from_video(video_path):
    cap = cv2.VideoCapture(video_path)
    file = open("log_sec.txt", "a")

    if not cap.isOpened():
        print(" Error: Cannot open video file.")
        return

    pose = mp_pose.Pose()
    frame_count = 0
    frame_pos = {}

    while True:
        ret, frame = cap.read()
        if not ret:
            print(" Finished processing video.")
            break

        frame_count += 1
        image = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        image.flags.writeable = False
        results = pose.process(image)
        image.flags.writeable = True
        frame = cv2.cvtColor(image, cv2.COLOR_RGB2BGR)

        if results.pose_landmarks:
            landmarks = results.pose_landmarks.landmark

            keypoints = {
                "face_center": landmarks[0],  # Nose
                "left_shoulder": landmarks[11],
                "right_shoulder": landmarks[12],
                "left_elbow": landmarks[13],
                "right_elbow": landmarks[14],
                "left_hand": landmarks[15],
                "right_hand": landmarks[16],
                "right_hip": landmarks[24],
                "left_hip": landmarks[23],
                "right_knee": landmarks[26],
                "left_knee": landmarks[25],
                "right_toes": landmarks[32],
                "left_toes": landmarks[31],
                "right_heel": landmarks[30],
                "left_heel": landmarks[29],
            }

            frame_pos["_id"] = frame_count

            # Draw and log keypoints
            for label, point in keypoints.items():
                h, w, _ = frame.shape
                cx, cy = int(point.x * w), int(point.y * h)
                #print(f"{label} position: ({cx}, {cy})")
                file.write(label + " (" +  str(cx) +" "+  str(cy) + ") ") 
                cv2.circle(frame, (cx, cy), 3, (0, 0, 255), cv2.FILLED)
                frame_pos[label] = [cx, cy]

                

            # --- Calculate and log key distances ---
            distances = calculate_key_distances(landmarks, frame.shape[:2])
            #print(f"Frame {frame_count} Distances: {distances}")
            file.write(f"\nFrame {frame_count} Distances: {distances}\n")     

            
            frame_pos["left_hand_to_left_shoulder"] = distances["left_hand_to_left_shoulder"]
            frame_pos["right_hand_to_right_shoulder"] = distances["right_hand_to_right_shoulder"]
            frame_pos["left_hand_to_face_center"] = distances["left_hand_to_face_center"]
            frame_pos["right_hand_to_face_center"] = distances["right_hand_to_face_center"]
            frame_pos["knee_to_knee"] = distances["knee_to_knee"]
            frame_pos["toe_to_toe"] = distances["toe_to_toe"]
            
                   
        try: 
            client = MongoClient("mongodb://localhost:27017/")
            db = client.get_database('corner_Coach')

            # Access a collection (will be created if it doesn't exist)
            pose_collection = db.get_collection('positions')

            # Insert the dictionary directly
            result = pose_collection.insert_one(frame_pos)

            print(f"Successfully inserted document with _id: {result.inserted_id}")

        except Exception as e:
            pass
            print(f"an error occoured {e}" )
            print()

        cv2.imshow('Video Keypoint Tracker', frame)
        if cv2.waitKey(1) & 0xFF == ord('q'):

            if 'client' in locals() and client:
                client.close()
            print(" Exiting playback.")
            break

    cap.release()
    cv2.destroyAllWindows()
# Run on selected video
if __name__ == '__main__':
    track_custom_points_from_video("video4.mp4")

