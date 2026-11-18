// Route table: hash path → view function. Views return HTML strings; the renderer decides how to paint them.
import { viewBible } from '../features/bible/bible.js';
import { viewCalendar } from '../features/calendar/calendar.js';
import { viewDays } from '../features/checkin/days.js';
import { viewFinance } from '../features/finance/finance.js';
import { viewHabits } from '../features/habits/habits.js';
import { viewHome } from '../features/home/home.js';
import { viewAbout } from '../features/about/about.js';
import { viewJournal } from '../features/journal/journal.js';
import { viewMilestones } from '../features/milestones/milestones.js';
import { viewNutrition } from '../features/nutrition/nutrition.js';
import { viewOnboarding } from '../features/onboarding/onboarding.js';
import { viewProfile } from '../features/profile/profile.js';
import { viewBody } from '../features/progress/body.js';
import { viewCompare, viewPhotos } from '../features/progress/photos.js';
import { viewProgress } from '../features/progress/progress.js';
import { viewReminders } from '../features/reminders/reminders.js';
import { viewReports } from '../features/reports/reports.js';
import { viewScore } from '../features/score/score.js';
import { viewExercises, viewHistory } from '../features/training/history.js';
import { viewSession } from '../features/training/session.js';
import { viewTraining } from '../features/training/training.js';

export const TABS = [['home', 'Inicio', 'home'], ['nutrition', 'Nutrición', 'fork'], ['training', 'Entrenar', 'dumbbell'], ['progress', 'Progreso', 'chart'], ['finance', 'Finanzas', 'wallet'], ['profile', 'Perfil', 'user']];

export const ROUTES = {
  'home': viewHome, 'home/habits': viewHabits, 'home/bible': viewBible, 'home/journal': viewJournal, 'home/about': viewAbout, 'home/milestones': viewMilestones, 'home/score': viewScore, 'home/calendar': viewCalendar, 'home/days': viewDays, 'home/reports': viewReports, 'profile/reminders': viewReminders, 'finance': viewFinance,
  'nutrition': viewNutrition, 'training': viewTraining, 'training/session': viewSession, 'training/history': viewHistory, 'training/exercises': viewExercises,
  'progress': viewProgress, 'progress/body': viewBody, 'progress/photos': viewPhotos, 'progress/compare': viewCompare, 'profile': viewProfile
};

export const ONBOARDING = viewOnboarding;
