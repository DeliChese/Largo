export interface Lesson {
  title: string;
  nativeTitle: string;
  topic: string;
  terms: string[];
  description?: string;
}

export function lesson(title: string, nativeTitle: string, topic: string, terms: string, description?: string): Lesson {
  return { title, nativeTitle, topic, terms: terms.split(' '), description };
}
