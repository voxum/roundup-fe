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
  cardId: string;
  startDate: string;
  endDate: string;
  layoutId: string;
  roundRating: string;
  holeScores: HoleScores[];
  user: UserEntry | null;
}

interface UserEntry{
  _id: string;
  fullName: string;
  name: string;
  username: string;
}

export type { ObjectEntry, HoleScores, ScoreEntry, UserEntry };