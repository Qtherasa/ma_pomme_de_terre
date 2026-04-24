import { getSettings } from './settings.js';

let primaryVocab = [];
const levelOrder = ['A0', 'A1', 'A2', 'B1', 'B2', 'C+'];

export function setPrimaryData(data){
    primaryVocab = data;
}

export function getFilteredData() {
    const settings = JSON.parse(localStorage.getItem('vocabSettings')) || { lvl: 'all', category: 'all', inclusiveLevel: false };
    return primaryVocab.filter(item => {
        // 1. Category Filter
        const catMatch = settings.category === 'all' || item.category === settings.category;

        // 2. Level Filter
        let lvlMatch = false;
        if (settings.lvl === 'all') {
            lvlMatch = true;
        } else if (settings.inclusiveLevel) {
            const userLvlIndex = levelOrder.indexOf(settings.lvl);
            const itemLvlIndex = levelOrder.indexOf(item.lvl);
            // Match if item level is less than or equal to selected level
            lvlMatch = itemLvlIndex <= userLvlIndex;
        } else {
            lvlMatch = item.lvl === settings.lvl;
        }

        return catMatch && lvlMatch;
    });
}
export function getAllData() {
    return primaryVocab;
}
export function getFlashcardSet() {
    const filtered = getFilteredData();
    return filtered.sort(() => Math.random() - 0.5);

}

export function getDataFilteredByLevel() {
    const settings = getSettings();
    const levelOrder = ['A0', 'A1', 'A2', 'B1', 'B2', 'C+'];

    return primaryVocab.filter(item => {
        if (settings.lvl === 'all') return true;
        
        if (settings.inclusiveLevel) {
            const userLvlIndex = levelOrder.indexOf(settings.lvl);
            const itemLvlIndex = levelOrder.indexOf(item.lvl);
            return itemLvlIndex <= userLvlIndex;
        }
        return item.lvl === settings.lvl;
    });
}