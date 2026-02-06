import { Topic } from './useTopics';

const OFFLINE_TOPICS_KEY = 'offline-topics-cache';
const OFFLINE_TOPICS_TIMESTAMP_KEY = 'offline-topics-timestamp';

interface OfflineCache {
  topics: Topic[];
  timestamp: number;
}

export function saveTopicsToCache(topics: Topic[]) {
  try {
    const cache: OfflineCache = {
      topics,
      timestamp: Date.now(),
    };
    localStorage.setItem(OFFLINE_TOPICS_KEY, JSON.stringify(cache));
  } catch (error) {
    console.warn('Failed to cache topics for offline:', error);
  }
}

export function saveTopicToCache(topic: Topic) {
  try {
    const existing = getTopicsFromCache();
    const topics = existing.filter(t => t.id !== topic.id);
    topics.push(topic);
    saveTopicsToCache(topics);
  } catch (error) {
    console.warn('Failed to cache topic for offline:', error);
  }
}

export function getTopicsFromCache(): Topic[] {
  try {
    const cached = localStorage.getItem(OFFLINE_TOPICS_KEY);
    if (!cached) return [];
    const data: OfflineCache = JSON.parse(cached);
    return data.topics;
  } catch {
    return [];
  }
}

export function getTopicFromCache(topicId: string): Topic | null {
  const topics = getTopicsFromCache();
  return topics.find(t => t.id === topicId) || null;
}

export function isOffline(): boolean {
  return !navigator.onLine;
}
