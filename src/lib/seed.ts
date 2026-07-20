import type { Behaviour, Reward } from '../types';
import { uid } from './id';

/** Default good behaviours from the brief, ready to use on first run. */
export function seedBehaviours(): Behaviour[] {
  const defs: Array<[string, string, string, number]> = [
    ['Brush teeth', '🪥', 'Brush teeth in the morning and at night', 1],
    ['Get dressed', '👕', 'Put on top and pants by myself', 1],
    ['Undress', '🩳', 'Take off top and pants by myself', 0.5],
    ['Go potty', '🚽', 'Use the toilet to pee or poo', 1],
    ['Eat by myself', '🍽️', 'Finish my meal without being fed', 1.5],
    ['Sleep early', '😴', 'In bed and asleep by 10pm', 1.5],
    ['Tidy toys', '🧸', 'Pack up toys after playing', 1],
    ['Laundry helper', '🧺', 'Bring dirty clothes to the wash', 0.5],
    ['Come-home routine', '🏠', 'Take off shoes and socks, then wash hands', 1],
  ];
  return defs.map(([name, icon, description, defaultStars]) => ({
    id: uid('beh_'),
    name,
    icon,
    description,
    defaultStars,
    active: true,
  }));
}

/** A couple of starter wishlist rewards so the page isn't empty. */
export function seedRewards(): Reward[] {
  const defs: Array<[string, string, string, number, number]> = [
    ['Extra story time', '📚', 'One extra bedtime story', 5, 99],
    ['Ice cream treat', '🍦', 'A yummy ice cream of your choice', 10, 10],
    ['Movie night pick', '🎬', 'You choose the family movie', 15, 5],
    ['Trip to the park', '🛝', 'A special visit to the playground', 20, 5],
  ];
  return defs.map(([name, icon, description, starCost, quantity]) => ({
    id: uid('rew_'),
    name,
    icon,
    description,
    starCost,
    quantity,
  }));
}
