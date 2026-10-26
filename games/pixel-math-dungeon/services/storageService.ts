import { PlayerStats, SessionStats } from "../types";

const STORAGE_KEY = 'pixel_math_game_data';

const getInitialStats = (name: string): PlayerStats => ({
  name,
  totalSessions: 0,
  totalCorrect: 0,
  totalAttempts: 0,
  monstersDefeated: 0,
  deaths: 0,
  rangeStats: {}
});

export const loadStats = (): PlayerStats | null => {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : null;
  } catch (e) {
    console.error("Failed to load stats", e);
    return null;
  }
};

export const saveSession = (playerName: string, session: SessionStats, monstersDefeated: number) => {
  let stats = loadStats();
  
  if (!stats || stats.name !== playerName) {
    stats = getInitialStats(playerName);
  }

  // Update Global
  stats.totalSessions += 1;
  stats.totalCorrect += session.doorsOpened;
  stats.totalAttempts += (session.doorsOpened + session.mistakes);
  stats.monstersDefeated += monstersDefeated;
  if (!session.won && session.livesRemaining <= 0) {
    stats.deaths += 1;
  }

  // Update Range Specific
  const rangeKey = `${session.operation}_${session.difficulty}`;
  if (!stats.rangeStats[rangeKey]) {
    stats.rangeStats[rangeKey] = {
      correct: 0,
      attempts: 0,
      bestSessionOpenDoors: 0,
      totalTimeSeconds: 0
    };
  }

  const rStat = stats.rangeStats[rangeKey];
  rStat.correct += session.doorsOpened;
  rStat.attempts += (session.doorsOpened + session.mistakes);
  rStat.totalTimeSeconds += session.durationSeconds;
  if (session.doorsOpened > rStat.bestSessionOpenDoors) {
    rStat.bestSessionOpenDoors = session.doorsOpened;
  }

  localStorage.setItem(STORAGE_KEY, JSON.stringify(stats));
  return stats;
};
