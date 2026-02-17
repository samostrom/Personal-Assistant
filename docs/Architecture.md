# Architecture Overview — Navi Capture

## 1. High-Level Flow
[Android PWA / Widget]
↓
[Node.js + Express Backend]
↓
[OpenAI Whisper API]
↓
[Todoist REST API]



## 2. Component Details

- **Front-End (PWA):**
  - MediaRecorder API for audio capture
  - Big record button
  - Live transcript display
- **Backend:**
  - Receives audio via POST
  - Sends to Whisper API
  - Parses prefix for Todoist project
  - Creates task using Todoist REST API
- **Todoist Integration:**
  - Uses API token and project IDs
  - Simple prefix-based routing

## 3. Design Tradeoffs/Decisions

- **PWA over native app:** Rapid MVP, no Android SDK knowledge required
- **Manual toggle instead of silence detection:** Reduces complexity, friction, and errors
- **No Trigger phrases:** Reduces costs
- **Prefix routing over AI classification:** Deterministic behavior, faster, reliable
