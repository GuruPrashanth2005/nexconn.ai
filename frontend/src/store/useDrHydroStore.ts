/* eslint-disable @typescript-eslint/no-explicit-any */
import { create } from 'zustand';

interface DrHydroState {
  topic: string;
  curriculumLevel: string;
  documentType: string;
  engine: string;
  labData: any;
  setTopic: (topic: string) => void;
  setCurriculumLevel: (level: string) => void;
  setDocumentType: (type: string) => void;
  setEngine: (engine: string) => void;
  setLabData: (data: any) => void;
}

export const useDrHydroStore = create<DrHydroState>((set) => ({
  topic: '',
  curriculumLevel: 'High School (9-10)',
  documentType: 'Worksheet (Fillable)',
  engine: 'groq', // Default to fast Groq
  labData: null,
  setTopic: (topic) => set({ topic }),
  setCurriculumLevel: (curriculumLevel) => set({ curriculumLevel }),
  setDocumentType: (documentType) => set({ documentType }),
  setEngine: (engine) => set({ engine }),
  setLabData: (labData) => set({ labData }),
}));
