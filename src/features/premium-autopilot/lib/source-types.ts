export type SourceType =
  | "Forum"
  | "Social"
  | "Directory"
  | "Blog"
  | "Q&A"
  | "Classified"
  | "Video";

export type Difficulty = "Easy" | "Medium";

export interface TrafficSource {
  id: string;
  name: string;
  niche: string;
  type: SourceType;
  difficulty: Difficulty;
  traffic: string;
  time: string;
  url: string;
  description: string;
  instructions: readonly string[];
}
