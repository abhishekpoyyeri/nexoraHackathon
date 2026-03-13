const express = require('express');
const { spawn } = require('child_process');

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());

app.post('/predict', (req, res) => {
  const { month_index, income } = req.body;

  if (month_index === undefined || income === undefined) {
    return res.status(400).json({ error: 'month_index and income are required' });
  }

  const py = spawn('python', ['predict.py']);
  const input = JSON.stringify({ month_index, income });

  let data = '';
  let err = '';

  py.stdout.on('data', (chunk) => {
    data += chunk.toString();
  });

  py.stderr.on('data', (chunk) => {
    err += chunk.toString();
  });

  py.on('close', (code) => {
    if (code !== 0) {
      console.error('Python process error:', err);
      return res.status(500).json({ error: 'Python process failed', details: err });
    }

    try {
      const output = JSON.parse(data);
      return res.json(output);
    } catch (e) {
      return res.status(500).json({ error: 'Invalid JSON from Python', raw: data });
    }
  });

  py.stdin.write(input);
  py.stdin.end();
});

app.listen(port, () => {
  console.log(`Expense prediction API listening on port ${port}`);
});
