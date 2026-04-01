export type TimelineEntry = {
  id: string;
  date: string;
  text: string;
  photoUrl?: string;
  tags: string[];
};

export type MedicalRecord = {
  id: string;
  date: string;
  weight: number; // kg
  height: number; // cm
  doctorNotes: string;
};

export type PendingQuestion = {
  id: string;
  text: string;
  isAnswered: boolean;
};
