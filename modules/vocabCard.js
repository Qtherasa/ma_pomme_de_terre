import { getSettings } from '../settings.js';

export function renderVocabCard(item) {
    
    const displayWord = getDisplayName(item);
    const speechText = getSpeechText(item);
    const genderClass = getGenderClass(item);

    return `
        <div class="vocab-card ${genderClass}">
            <div class="card-row-top">
                <span class="fr-text">${displayWord}</span>
            </div>
            <div class="card-row-mid">
                <span class="emoji">${item.emoji}</span>
                <span class="en-text">${item.en}</span>
            </div>
            <div class="card-row-bot">
                <span class="ph-text">/${item.ph}/</span>
                <button class="audio-btn" data-id="${item.id}" data-speech="${speechText}">🔊</button>
            </div>
            ${item.note ? `<span class="note-indicator">📝</span>` : ''}
            ${item.note ? `<div class="card-note">${item.note}</div>` : ''}
         </div>
    `;
}

// helper function to deal with articles and spacing for display and speech
function getDisplayName(item) {
    const art = item.articles?.def;
    if (!art) return item.fr;

    // If the article ends in an apostrophe, no space. Otherwise, add a space
    const separator = art.endsWith("'") ? "" : " ";
    return `${art}${separator}${item.fr}`;
}

// Helper to prepare the string for the robot voice
function getSpeechText(item) {
    const art = item.articles?.def || "";
    const word = item.speech_alt || item.fr;
    const separator = art.endsWith("'") ? "" : " ";
    return `${art}${separator}${word}`;
}

function getGenderClass(item){
    const settings = getSettings();
    const isGenderEnabled = settings.showGenderColor && item.gender;
    return isGenderEnabled ? `gender-${item.gender} active` : "";
}