import type { ScoreEntry, UserEntry } from '../types';
const API_BASE_URL = 'http://localhost:8000';
const TOKEN = 'b0eed3cb962ddf25349164ecb3b164805b896443';

export async function FetchScores(card_id: string) {
  const response = await fetch(`${API_BASE_URL}/scorecards/?card_id=${card_id}`);
  if (!response.ok) {
    throw new Error('Failed to fetch scores');
  }
  return response.json();
}

export async function SubmitScores(data: ScoreEntry) {
    const response = await fetch(`${API_BASE_URL}/scorecards/`, {
        method: 'POST',
        headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Token ${TOKEN}`,
        },
        body: JSON.stringify(data),
    });
  if (!response.ok) {
    throw new Error('Failed to submit scores');
  }
  return response.json();
}

export async function FetchUsers(): Promise<UserEntry[]> {
  const response = await fetch(`${API_BASE_URL}/custom-users/`, {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Token ${TOKEN}`,
    },
  });
  if (!response.ok) {
    throw new Error('Failed to fetch users');
  }
  return response.json();
}