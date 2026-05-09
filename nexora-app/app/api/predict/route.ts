import { NextRequest, NextResponse } from 'next/server';
import { spawn } from 'child_process';
import path from 'path';

export async function POST(request: NextRequest) {
  try {
    const { month_index, income } = await request.json();

    if (month_index === undefined || income === undefined) {
      return NextResponse.json({ error: 'month_index and income are required' }, { status: 400 });
    }

    const scriptPath = path.join(process.cwd(), 'lib', 'ml', 'predict.py');
    const modelPath = path.join(process.cwd(), 'lib', 'ml');

    return new Promise<Response>((resolve, reject) => {
      const py = spawn('python', [scriptPath], { cwd: modelPath });
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
          reject(new Error(`Python process failed: ${err}`));
          return;
        }

        try {
          const output = JSON.parse(data);
          resolve(NextResponse.json(output));
        } catch (e) {
          reject(new Error(`Invalid JSON from Python: ${data}`));
        }
      });

      py.on('error', (error) => {
        reject(error);
      });

      py.stdin.write(input);
      py.stdin.end();
    });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}