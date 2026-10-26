import { FunStyle } from './types';

// 'prompt' holds the effect id used by services/photoEffects.ts
export const FUN_STYLES: FunStyle[] = [
  { id: 'blocky', name: 'Blocky World', emoji: '🧱', prompt: 'blocky', color: 'bg-green-400', description: 'Turn into blocks!' },
  { id: 'comic', name: 'Super Hero', emoji: '🦸', prompt: 'comic', color: 'bg-red-400', description: 'Comic book KAPOW!' },
  { id: 'doodle', name: 'Notebook Doodle', emoji: '✏️', prompt: 'doodle', color: 'bg-indigo-300', description: 'Scribble time!' },
  { id: 'glitch', name: 'Glitch Gamer', emoji: '🎮', prompt: 'glitch', color: 'bg-purple-400', description: 'Cyber hacker vibes!' },
  { id: 'bubble', name: 'Funny Bubble', emoji: '🫧', prompt: 'bubble', color: 'bg-sky-400', description: 'Big bubble face!' },
  { id: 'swirl', name: 'Twisty Swirl', emoji: '🌀', prompt: 'swirl', color: 'bg-cyan-400', description: 'Round and round!' },
  { id: 'mirror', name: 'Magic Mirror', emoji: '🪞', prompt: 'mirror', color: 'bg-teal-400', description: 'Two of the same!' },
  { id: 'rainbow', name: 'Rainbow Pop', emoji: '🌈', prompt: 'rainbow', color: 'bg-orange-400', description: 'All the colors!' },
  { id: 'party', name: 'Party Time', emoji: '🥳', prompt: 'party', color: 'bg-pink-400', description: 'Party all day!' },
  { id: 'banana', name: 'Go Bananas', emoji: '🍌', prompt: 'banana', color: 'bg-yellow-400', description: 'So silly!' },
  { id: 'random', name: 'Mystery Box', emoji: '🎁', prompt: 'random', color: 'bg-fuchsia-500', description: 'A fun surprise!' }
];

export const LOADING_MESSAGES = [
  "Summoning the fun pixels...",
  "Consulting the Meme Wizards...",
  "Adding extra sprinkles...",
  "Inflating the balloons...",
  "Tickling the pixels...",
  "Spinning the color wheel..."
];