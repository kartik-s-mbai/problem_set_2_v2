import fs from 'fs';
import path from 'path';

let inMemoryComments = [];

const COMMENTS_FILE = path.join(process.cwd(), 'comments-data.json');

function loadComments() {
  try {
    if (fs.existsSync(COMMENTS_FILE)) {
      const data = fs.readFileSync(COMMENTS_FILE, 'utf8');
      inMemoryComments = JSON.parse(data);
    }
  } catch {
    // fallback to memory
  }
}

function saveComments() {
  try {
    fs.writeFileSync(COMMENTS_FILE, JSON.stringify(inMemoryComments, null, 2), 'utf8');
  } catch {
    // fallback
  }
}

loadComments();

export default async function handler(req, res) {
  if (typeof res.status !== 'function') {
    res.status = (code) => {
      res.statusCode = code;
      return res;
    };
  }
  if (typeof res.json !== 'function') {
    res.json = (data) => {
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify(data));
    };
  }

  if (req.method === 'GET') {
    loadComments();
    return res.status(200).json({ comments: inMemoryComments });
  }

  if (req.method === 'POST') {
    let body = req.body;
    if (typeof body === 'string') {
      try {
        body = JSON.parse(body);
      } catch {
        // ignore
      }
    }

    if (!body && req.on) {
      const buffers = [];
      for await (const chunk of req) {
        buffers.push(chunk);
      }
      const data = Buffer.concat(buffers).toString();
      try {
        body = JSON.parse(data);
      } catch {
        body = {};
      }
    }

    if (body && body.text) {
      const newComment = {
        id: body.id || 'cmt-' + Date.now(),
        name: (body.name || 'Anonymous Guest').trim(),
        text: body.text.trim(),
        timestamp: 'Just now',
        createdAt: Date.now(),
      };
      inMemoryComments = [newComment, ...inMemoryComments.filter((c) => c.id !== newComment.id)];
      saveComments();
      return res.status(200).json({ success: true, comment: newComment, comments: inMemoryComments });
    }

    return res.status(400).json({ error: 'Comment text is required' });
  }

  if (req.method === 'DELETE') {
    const url = new URL(req.url, 'http://localhost');
    const id = url.searchParams.get('id');
    if (id) {
      inMemoryComments = inMemoryComments.filter((c) => c.id !== id);
      saveComments();
      return res.status(200).json({ success: true, comments: inMemoryComments });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
