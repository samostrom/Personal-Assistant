# Product Requirements Document — Navi Capture

**This is currently a high level PRD that will be drilled down as I continue to develop this project**

## 1. Problem Statement
I have a lot of ideas, reminders, links and tasks that I store in todoist. When I'm on the go or not at my computer, its very cumbersome to open up my phone, type out my reminder, and store it in the correct folder on todoist. There exists a need for a fast, reliable, low-friction method to offload thoughts/reminders into todoist. 

## 2. Users
- Primary: Yourself (daily cognitive offloading)
- Secondary: Anyone needing frictionless voice-to-task capture for todoist

## 3. MVP Features
- Single big record button to start/stop capture
- Pause allowed naturally while speaking
- Audio sent to backend OpenAI whisper for transcription
- Task routed to Todoist based on prefix
- Live transcript display before sending

## 4. Out of Scope/Future Improvements (v1)
- Custom wake word (“Hey Navi”)
- AI auto-classification
- Wearable integration
- calendar integrations
- other integrations (NotebookLM, notion, etc)
- Background listening
- Multi-device sync

## 5. Success Metrics
- Time from thought → Todoist task < 10 seconds
- Daily usage by the creator
- Accurate transcription ≥ 90% (Whisper)

