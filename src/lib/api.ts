import type { ScoreEntry, UserEntry } from '../types';
const API_BASE_URL = 'http://localhost:8000';
const TOKEN = 'b0eed3cb962ddf25349164ecb3b164805b896443';

export async function FetchScores(card_id?: string, date?: string) {
  const url = date ? `${API_BASE_URL}/scorecards/by_date/?card_id=${card_id}&date=${date}` : `${API_BASE_URL}/scorecards/?card_id=${card_id}`;
  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Token ${TOKEN}`,
    },
  });

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

export async function CreateUser(full_name: string, username: string, division: string, tag: number) {
  console.log("Creating user:", { full_name, username, division, tag });
  const response = await fetch(`${API_BASE_URL}/custom-users/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Token ${TOKEN}`,
    },
    body: JSON.stringify({ full_name, username, division, tag }),
  });
  if (!response.ok) {
    throw new Error('Failed to create user');
  }
  return response.json();
}

export async function CheckInUser(username: string, action: string, tag?: number) {
  const endpoint = action === 'check-in' ? '' : 'remove/';
  const url = `${API_BASE_URL}/checkins/${endpoint}`;
  const response = await fetch(url, {
    method: action === 'check-in' ? 'POST' : 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Token ${TOKEN}`,
    },
    body: JSON.stringify({ 
      username,
      date: new Date().toISOString().split('T')[0],
      tag
    }),
  });
  if (!response.ok) {
    throw new Error('Failed to check in user');
  }
  return response.json();
}

export async function FetchEventByDate(date: string) {
  const response = await fetch(`${API_BASE_URL}/event-setup/${date}`, {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Token ${TOKEN}`,
    },
  });
  if (!response.ok) {
    throw new Error('Failed to fetch event by date');
  }
  return response.json();
}