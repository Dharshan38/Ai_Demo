from flask import Flask, request, jsonify
from flask_cors import CORS
import threading
import time
from system_control import SystemController
import pyttsx3

app = Flask(__name__)
CORS(app)  # Allow frontend to communicate

# Initialize TTS Engine (server-side backup)
def speak_server_side(text):
    def _speak():
        engine = pyttsx3.init()
        engine.say(text)
        engine.runAndWait()
    threading.Thread(target=_speak).start()

@app.route('/health', methods=['GET'])
def health():
    return jsonify({"status": "online", "system": SystemController.get_system_status()})

@app.route('/process_command', methods=['POST'])
def process_command():
    data = request.json
    command = data.get('command', '').lower()
    
    response_text = ""
    action_performed = None

    # Logic Router
    if "time" in command:
        status = SystemController.get_system_status()
        response_text = f"The time is {status['time']}"
        
    elif "date" in command:
        status = SystemController.get_system_status()
        response_text = f"Today is {status['date']}"
        
    elif "battery" in command:
        status = SystemController.get_system_status()
        response_text = f"Battery is at {status['battery']}%"
        
    elif "volume" in command:
        if "up" in command or "increase" in command:
            SystemController.set_volume("up")
            response_text = "Volume increased"
        elif "down" in command or "decrease" in command:
            SystemController.set_volume("down")
            response_text = "Volume decreased"
        elif "mute" in command:
            SystemController.set_volume("mute")
            response_text = "Muted"
            
    elif "open" in command or "start" in command:
        app_name = command.replace("open", "").replace("start", "").strip()
        response_text = SystemController.open_app(app_name)
        
    elif "joke" in command:
        response_text = SystemController.get_joke()
        
    elif "screenshot" in command:
        path = SystemController.take_screenshot()
        response_text = f"Screenshot saved to Pictures"
        
    else:
        # Fallback conversation
        response_text = "I'm not sure how to do that yet, but I'm learning."

    return jsonify({
        "response": response_text,
        "action": action_performed,
        "status": SystemController.get_system_status()
    })

if __name__ == '__main__':
    app.run(debug=True, port=5000)
