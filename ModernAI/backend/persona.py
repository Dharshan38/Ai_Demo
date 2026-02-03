import random

class BellPersona:
    @staticmethod
    def get_sentiment(text):
        text = text.lower()
        
        # Simple Keyword Heuristics for Demo (Robust & Fast)
        negatives = ["sad", "angry", "hate", "stupid", "worst", "bad", "kill", "die", "useless", "annoying"]
        positives = ["happy", "good", "love", "great", "excellent", "best", "thanks", "thank you", "wonderful", "cool"]
        urgent = ["fast", "quick", "now", "hurry"]
        
        score = 0
        for w in positives: 
            if w in text: score += 1
        for w in negatives: 
            if w in text: score -= 1
            
        if "bit" in text or "little" in text: score = score / 2 # Modifier
        
        if score > 0: return "positive"
        if score < 0: return "negative"
        return "neutral"

    @staticmethod
    def enrich_response(base_response, sentiment):
        if sentiment == "positive":
            prefixes = ["Gladly! ", "You got it! ", "Happy to help! ", "Awesome, "]
            return random.choice(prefixes) + base_response
        elif sentiment == "negative":
            prefixes = ["I'm sorry if I upset you, ", "Apologies, ", "I'll try to do better, ", "Keep calm, "]
            return random.choice(prefixes) + base_response
        return base_response

    @staticmethod
    def get_response(text):
        text = text.lower()
        sentiment = BellPersona.get_sentiment(text)
        
        # Greetings with sentiment awareness
        if any(w in text for w in ["hello", "hi", "hey", "good morning"]):
            if sentiment == "negative":
                return "Hello. You sound upset, how can I help?"
            elif sentiment == "positive":
                return "Hello! You seem in a good mood!"
            return "Hello! I am Bell, ready to help."
            
        # Gratitude
        if "thank" in text:
            return random.choice([
                "You are very welcome.",
                "Anytime!",
                "Happy to help."
            ])
            
        # Identity
        if "who are you" in text:
            return "I am Bell, your advanced voice assistant. I can control your PC, play music, and answer questions."
            
        # Status
        if "how are you" in text:
            return "I am functioning within normal parameters. Thanks for asking!"
            
        # Fallback
        return "I didn't quite catch that. Try saying 'Open Notepad' or 'Who is Elon Musk'."
