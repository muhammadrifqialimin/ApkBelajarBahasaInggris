# English Master AI

An interactive English learning application with:

- Translation quizzes
- Verb conjugation practice
- AI conversation partner
- Grammar correction
- Progress tracking

## Features

- Multiple quiz categories (General, Travel, Business, Food, Daily Life)
- Three difficulty levels
- Speech recognition for pronunciation practice
- Text-to-speech for listening practice
- Visual progress dashboard
- Weak word identification

## Setup

1. Clone this repository
2. Open `index.html` in a modern browser
3. Allow microphone access when prompted

## Requirements

- Modern browser with Web Speech API support
- Internet connection (for Gemini API)

# Your Progress

## 0

Questions Completed

## 0

Correct Answers

## 0%

Accuracy Rate

### Words to Improve

No weak words detected yet!

- [ ] Reset Progress

<div hidden id="confirmation">
  Are you sure? This cannot be undone!  
  - Yes, Reset  
  - Cancel  
</div>

<script>
  document.querySelector('[type="checkbox"]').addEventListener('change', function() {
    document.getElementById('confirmation').hidden = !this.checked;
  });
</script>
