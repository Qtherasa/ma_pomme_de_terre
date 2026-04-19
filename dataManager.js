import { getSettings } from './settings.js';

let primaryVocab = [];

export function setPrimaryData(data){
    primaryVocab = data;
}

export function getFilteredData() {
    const settings = getSettings();
    return primaryVocab.filter(item => {
        const lvlMatch = settings.lvl === 'all' || item.lvl === settings.lvl;
        const catMatch = settings.category === 'all' || item.category === settings.category;
        return lvlMatch && catMatch;
    });
}

export function getFlashcardSet() {
    const filtered = getFilteredData();
    return filtered.sort(() => Math.random() - 0.5);

}