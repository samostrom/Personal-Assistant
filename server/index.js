import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import multer from 'multer';
import OpenAI, { toFile } from 'openai';
import { TodoistApi } from '@doist/todoist-api-typescript';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const isProd = process.env.NODE_ENV === 'production';

const app = express();
const upload = multer({ storage: multer.memoryStorage() });
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const todoist = new TodoistApi(process.env.TODOIST_API_TOKEN);

if (!isProd) {
  app.use(cors({ origin: 'http://localhost:3000' }));
}
app.use(express.json());

app.post('/api/transcribe', upload.single('audio'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No audio file provided' });
    }

    const file = await toFile(req.file.buffer, 'recording.webm', { type: req.file.mimetype });

    const transcription = await openai.audio.transcriptions.create({
      file,
      model: 'whisper-1',
    });

    res.json({ transcript: transcription.text });
  } catch (error) {
    console.error('Transcription error:', error);
    res.status(500).json({ error: 'Transcription failed', details: error.message });
  }
});

app.post('/api/create-task', async (req, res) => {
  try {
    const { transcript } = req.body;
    if (!transcript) {
      return res.status(400).json({ error: 'No transcript provided' });
    }

    // Parse project from transcript:
    // - Spoken: "buy milk hashtag Personal Finance" — captures all words after "hashtag" to end
    // - Typed:  "buy milk #Work" or "buy milk #Personal_Finance" (underscores become spaces)
    const spokenMatch = transcript.match(/hashtag\s+([\w][\w\s]*)$/i);
    const typedMatch = transcript.match(/#([\w]+)/);

    let taskContent = transcript;
    let projectName = null;

    if (spokenMatch) {
      projectName = spokenMatch[1].trim().toLowerCase();
      taskContent = transcript.replace(/\s*hashtag\s+[\w][\w\s]*$/i, '').trim();
    } else if (typedMatch) {
      projectName = typedMatch[1].replace(/_/g, ' ').toLowerCase();
      taskContent = transcript.replace(/#[\w]+/g, '').trim();
    }

    let projectId = undefined;
    if (projectName) {
      const { results: projects } = await todoist.getProjects();
      const match = projects.find(p => p.name.toLowerCase() === projectName);
      if (match) {
        projectId = match.id;
      }
    }

    const task = await todoist.addTask({ content: taskContent, projectId });
    res.json({ task });
  } catch (error) {
    console.error('Todoist error:', error);
    res.status(500).json({ error: 'Failed to create task', details: error.message });
  }
});

if (isProd) {
  const distPath = path.join(__dirname, '../dist');
  app.use(express.static(distPath));
  app.get('*', (_req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
