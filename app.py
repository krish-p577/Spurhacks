from flask import Flask, request, jsonify
from flask import render_template
#from dfg import track_custom_points_from_video
from dfg import track_custom_points_from_video
from analyze_with_gemini import gemini_analysis

app = Flask(__name__)


@app.route('/')
def home():
    return render_template('index.html')


@app.route('/analyze')
def analyze():
    #video = request.files['video']
    path = "video4.mp4"
    #video.save(path)

    track_custom_points_from_video(path)

    result = gemini_analysis()
    return render_template('index.html')

if __name__ == '__main__':
    app.run(debug=True, port=5001)
