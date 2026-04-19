import { initSettings, updateSetting } from "./settings.js";
import { setPrimaryData, getFilteredData } from "./dataManager.js";


// Global State
let vocabData = [];

// Global variable to hold our preferred voice
let frenchFemaleVoice = null;

// 1. Fetch the Data
async function init() {
    const settings = initSettings();
    // UI Sync
    document.getElementById('lvl-select').value = settings.lvl;
    document.getElementById('cat-select').value = settings.category;

    // Listener
    document.querySelector('#filters').addEventListener('change',(e) => {
        if (e.target.id === 'lvl-select') updateSetting('lvl', e.target.value);
        if (e.target.id === 'cat-select') updateSetting('category', e.target.value);
    });

    // Listen for the custom event to re-render the UI
    window.addEventListener('settingsChanged',() => {
        renderApp();
    });

    try {
        const response = await fetch('./data/vocab.json');
        const data = await response.json();

        // send data to manager first!
        setPrimaryData(data);

        console.log("Data Loaded and Managed");
       
        // Initial render
        renderApp();
    } catch (error) {
        console.error("Error loading JSON:", error);
        document.getElementById('app').innerHTML = "Failed to load data.";
    }
}

// 2. The Universal Speech Engine

function loadVoices(){
    const voices = window.speechSynthesis.getVoices();

    // Look for a French voice that sounds female
    frenchFemaleVoice = voices.find(voice=>
        voice.lang.includes('fr') &&
        (voice.name.includes('Vivienne') || voice.name.includes('Google') || voice.name.includes('Female'))
    ) || voices.find(voice => voice.lang.includes('fr')); // fallback to any French voice
}

// ensure voice are loaded (Chrome needs this event)
window.speechSynthesis.onvoiceschanged = loadVoices;

export function speakFrench(text) {
    // if voices haven't loaded yet, try one more time
    if (!frenchFemaleVoice) loadVoices();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.voice = frenchFemaleVoice;
    utterance.lang = 'fr-FR'; // Standard French
    utterance.rate = 0.8; // Slightly slower for learners
    utterance.pitch = 1.0;
    
    window.speechSynthesis.speak(utterance);
}

// 3. Simple Render Function (Placeholder for Module 1)
function renderVocabList(data) {
    const container = document.getElementById('app');
    
    //check for empty string
    if (data.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <p>Aucun mot trouvé. (No words found.)</p>
                <button onclick="resetFilters()">Clear Filters</button>
            </div>`
        return;
    }
   
    container.innerHTML = `
        <ul class="vocab-list">
            ${data.map(item=> `
                <li>
                    <strong>${getDisplayName(item)}</strong>
                    <span class="translation">(${item.en})</span>
                    <button class="audio-btn" data-id="${item.id}">🔊</button>
                </li>
                `).join('')}
        </ul>
    `;
    
    // Attach audio events
    document.querySelectorAll('.audio-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const item = data.find(i => i.id === btn.dataset.id);
            speakFrench(getSpeechText(item));
        });
    });
}


// Helper to handle the l'aword vs le_word spacing
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

// pull the list of vocab
function renderApp(){
    const filtered = getFilteredData();
    renderVocabList(filtered);
}



init();