from flask import Flask, request, jsonify
from flask import render_template
#from dfg import track_custom_points_from_video

app = Flask(__name__)


@app.route('/')
def home():
    return render_template('index.html')


@app.route('/analyze')
def analyze():
    video = request.files['video']
    path = "input.mp4"
    video.save(path)

    #result = track_custom_points_from_video(path)

    result = "this route was hit"


    return jsonify(result)

if __name__ == '__main__':
    app.run(debug=True, port=5001)
