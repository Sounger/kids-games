import { WordCategory } from './types';

export const CATEGORIES: WordCategory[] = [
  {
    id: 'animals',
    label: 'Animals',
    emoji: '🦁',
    color: 'bg-orange-400',
    words: ['cat', 'dog', 'fox', 'lion', 'bear', 'wolf', 'frog', 'duck', 'bird', 'fish', 'tiger', 'zebra', 'mouse', 'horse', 'panda']
  },
  {
    id: 'colors',
    label: 'Colors',
    emoji: '🎨',
    color: 'bg-blue-400',
    words: ['red', 'blue', 'pink', 'gold', 'gray', 'green', 'black', 'white', 'brown', 'purple', 'silver', 'yellow', 'orange', 'violet', 'indigo']
  },
  {
    id: 'fruits',
    label: 'Food',
    emoji: '🍎',
    color: 'bg-red-400',
    words: ['apple', 'pear', 'plum', 'kiwi', 'lime', 'corn', 'cake', 'milk', 'egg', 'meat', 'rice', 'soup', 'bread', 'grape', 'lemon']
  },
  {
    id: 'family',
    label: 'Family',
    emoji: '👨‍👩‍👧',
    color: 'bg-green-400',
    words: ['mom', 'dad', 'son', 'baby', 'boy', 'girl', 'man', 'wife', 'aunt', 'kids', 'love', 'home', 'sister', 'brother', 'family']
  },
  {
    id: 'school',
    label: 'School',
    emoji: '📚',
    color: 'bg-yellow-400',
    words: ['pen', 'bag', 'book', 'desk', 'map', 'art', 'bus', 'gym', 'glue', 'math', 'exam', 'paper', 'ruler', 'pencil', 'school']
  },
  {
    id: 'body',
    label: 'Body',
    emoji: '👀',
    color: 'bg-pink-400',
    words: ['eye', 'ear', 'nose', 'lip', 'arm', 'leg', 'toe', 'hand', 'foot', 'hair', 'face', 'neck', 'knee', 'chin', 'head']
  }
];

export const WORDS_PER_GAME = 10;
export const SPEED_BONUS_THRESHOLD_MS = 7000; // 7 seconds