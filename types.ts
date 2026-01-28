
export interface Message {
  role: 'user' | 'model';
  content: string;
  image?: string;
  timestamp: Date;
  sources?: Array<{
    title: string;
    uri: string;
  }>;
}

export interface HealthMetric {
  date: string;
  value: number;
}

export interface HealthData {
  heartRate: HealthMetric[];
  sleep: HealthMetric[];
  steps: HealthMetric[];
}

export enum AppView {
  CHAT = 'CHAT',
  LIVE = 'LIVE',
  DASHBOARD = 'DASHBOARD',
  HISTORY = 'HISTORY'
}

export interface TranscriptionItem {
  text: string;
  role: 'user' | 'model';
}
