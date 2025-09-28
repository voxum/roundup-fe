interface ObjectEntry {
  _type: string;
  objectId: string;
  className: string;
}

interface HoleScores {
  strokes: number;
  penalty?: number;
}

interface ScoreEntry {
  card_id: string;
  start_date: string;
  end_date: string;
  layout_id: string;
  round_rating: string;
  hole_scores: HoleScores[];
  user: UserEntry | null;
}

interface UserEntry {
  _id: string;
  full_name: string;
  name: string;
  username: string;
  has_checkin_today: number;
  division: string;
}

export type { ObjectEntry, HoleScores, ScoreEntry, UserEntry };