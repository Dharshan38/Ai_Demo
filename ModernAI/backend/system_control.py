import os
import subprocess
import pyautogui
import psutil
import datetime
import pyjokes
import pywhatkit
import webbrowser

# Disable PyAutoGUI fail-safe for smoother operation (optional, use with care)
pyautogui.FAILSAFE = False

class SystemController:
    @staticmethod
    def get_system_status():
        battery = psutil.sensors_battery()
        percent = battery.percent if battery else 100
        plugged = battery.power_plugged if battery else True
        
        return {
            "time": datetime.datetime.now().strftime("%H:%M"),
            "date": datetime.date.today().strftime("%B %d, %Y"),
            "battery": percent,
            "charging": plugged
        }

    @staticmethod
    def set_volume(action):
        if action == "up":
            pyautogui.press("volumeup")
            pyautogui.press("volumeup")
        elif action == "down":
            pyautogui.press("volumedown")
            pyautogui.press("volumedown")
        elif action == "mute":
            pyautogui.press("volumemute")
            
    @staticmethod
    def _run_with_delay(func, *args, delay=2.0):
        import threading
        import time
        def wrapper():
            time.sleep(delay)
            func(*args)
        threading.Thread(target=wrapper).start()

    @staticmethod
    def open_app(app_name):
        app_name = app_name.lower()
        
        # Helper to simplify calls
        def launch(target):
            if target.startswith("http"):
                webbrowser.open(target)
            elif target == "start spotify:":
                os.system(target)
            elif target == "explorer":
                subprocess.Popen("explorer")
            elif target == "win_search":
                pyautogui.press("win")
                pyautogui.write(app_name)
                pyautogui.press("enter")
            else:
                 try: os.startfile(target)
                 except: subprocess.Popen(target)

        # Web Apps
        if "youtube" in app_name:
            SystemController._run_with_delay(launch, "https://www.youtube.com")
            return "Opening YouTube"
        elif "google" in app_name:
            SystemController._run_with_delay(launch, "https://www.google.com")
            return "Opening Google"
        elif "spotify" in app_name:
            SystemController._run_with_delay(launch, "start spotify:") 
            return "Opening Spotify"
            
        # Desktop Apps
        try:
            target = None
            if "notepad" in app_name: target = "notepad.exe"
            elif "calc" in app_name: target = "calc.exe"
            elif "paint" in app_name: target = "mspaint.exe"
            elif "explorer" in app_name: target = "explorer"
            elif "chrome" in app_name: target = "chrome.exe"
            else: target = "win_search"
            
            if target:
                SystemController._run_with_delay(launch, target)
                return f"Opening {app_name}"
                
        except Exception as e:
            return f"Failed to open {app_name}: {str(e)}"

    @staticmethod
    def system_power(action):
        if action == "shutdown":
            os.system("shutdown /s /t 1")
            return "Shutting down"
        elif action == "restart":
            os.system("shutdown /r /t 1")
            return "Restarting"
        elif action == "lock":
            os.system("rundll32.exe user32.dll,LockWorkStation")
            return "Locking workstation"
            
    @staticmethod
    def take_screenshot():
        timestamp = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"screenshot_{timestamp}.png"
        save_path = os.path.join(os.path.expanduser("~"), "Pictures", filename)
        pyautogui.screenshot(save_path)
        return save_path

    @staticmethod
    def get_joke():
        return pyjokes.get_joke()
