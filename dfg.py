import cv2
import mediapipe as mp
import numpy as np
import math

mp_drawing = mp.solutions.drawing_utils
mp_pose = mp.solutions.pose

def track_custom_points(video_path):
    cap = cv2.VideoCapture(video_path)
    pose = mp_pose.Pose()
    frame_count = 0
    
    while cap.isOpened():
        ret, frame = cap.read()
        if not ret:
            break

        frame_count += 1
        image = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        results = pose.process(image)

        if results.pose_landmarks:
            landmarks = results.pose_landmarks.landmark

            # Extract custom key points
            keypoints = {
                "face_center": landmarks[0],  # Nose (approx. face center)
                "left_shoulder": landmarks[11],
                "right_shoulder": landmarks[12],
                "left_elbow": landmarks[13],
                "right_elbow": landmarks[14],
                "left_hand": landmarks[15],
                "right_hand": landmarks[16],
            }

            # Draw custom key points on the frame
            for label, point in keypoints.items():
                h, w, _ = frame.shape
                cx, cy = int(point.x * w), int(point.y * h)
                cv2.circle(frame, (cx, cy), 5, (0, 255, 0), cv2.FILLED)
                cv2.putText(frame, label, (cx, cy - 10), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 0, 0), 1)

        cv2.imshow('Custom Keypoint Tracker', frame)

        if cv2.waitKey(1) & 0xFF == ord('q'):
            break

    cap.release()
    cv2.destroyAllWindows()

# Example usage
# track_custom_points("your_boxing_clip.mp4")
