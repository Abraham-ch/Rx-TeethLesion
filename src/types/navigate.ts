export type AppSection = 'home' | 'detection' | 'results' | 'settings';

export type NavigationFunction = (section: AppSection) => void;