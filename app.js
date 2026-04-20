import { initSettings, updateSetting, getSettings } from "./settings.js";
import { setPrimaryData, getFilteredData } from "./dataManager.js";
import { renderVocabCard } from "./modules/vocabCard.js";

// Global State
let vocabData = [];

// Global variable to hold our preferred voice
let frenchFemaleVoice = null;

// 1. Fetch the Data
async function init() {
    const settings = initSettings();
    //tray logic
    const tray = document.getElementById('filter-tray');
    const toggleBtn = document.getElementById('tray-toggle');
    let lastScrollTop = 0;
    let isTrayManuallyOpened = false;
    toggleBtn.addEventListener('click', () => {
        const isOpening= !tray.classList.contains('tray-open');
        tray.classList.toggle('tray-open');

        if (isOpening) {
            isTrayManuallyOpened = true;
            setTimeout(() => { isTrayManuallyOpened = false; }, 500); // reset after 3 seconds
        }
    });

    window.addEventListener('scroll', () => {
        const tray = document.getElementById('filter-tray');
        const currentScroll = window.scrollY || document.documentElement.scrollTop;
        const header = document.querySelector('header');
        
        //hide the title
        if (currentScroll > 100) {
            header.classList.add('scrolled');
        } else if (currentScroll < 10) {
            header.classList.remove('scrolled');
        }

        if (!isTrayManuallyOpened && currentScroll > lastScrollTop && currentScroll > 200){
            if (tray.classList.contains('tray-open')) {
                tray.classList.remove('tray-open');
            }
        }
        lastScrollTop = currentScroll <= 0 ? 0 : currentScroll; // For Mobile or negative scrolling
    }, { passive: true });

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
    const settings = getSettings();
    const navContainer = document.getElementById('jump-nav-container');
    const container = document.getElementById('app');
    
    if (data.length === 0) {
        container.innerHTML = `<div class="empty-state"><p>Aucun mot trouvé. (No words found.)</p></div>`
        navContainer.innerHTML = '';
        return;
    }

    // Nav Bar logic
    let navHtml = '';
    if (settings.category === 'all') {
        //group settings by category
        const categories = [...new Set(data.map(item => item.category))];
        navHtml = categories.map(cat => {
            const subs = [...new Set(data.filter(item => item.category === cat).map(i => i.subcategory))];
            return `<div><strong>${cat.toUpperCase()}:</strong> ${subs.map(sub => `<a href="#jump-${sub}">${sub}</a>`).join(' | ')}</div>`;
        }).join('');
    } else {
        //just show subcategories
        const subs = [...new Set(data.map(i => i.subcategory))];
        navHtml = `<div>${subs.map(sub => `<a href="#jump-${sub}">${sub}</a>`).join(' | ')}</div>`;
    }
    navContainer.innerHTML = `<nav class="jump-nav">${navHtml}</nav>`;

   
    
    //sort the data
    const sortedData = [...data].sort((a,b) => {
        return a.category.localeCompare(b.category) ||
        a.subcategory.localeCompare(b.subcategory) ||
        a.lvl.localeCompare(b.lvl);
    });

    // group data
    let currentCat = '';
    let currentSub = '';
    let html = '';

    sortedData.forEach(item=>{
        if (item.category !== currentCat){
            currentCat = item.category;
            html += `<h2 class="category-header">${currentCat.toUpperCase()}</h2>`;

        }
        if (item.subcategory !== currentSub){
            currentSub = item.subcategory;
            html += `<h3 class="subcategory-header" id="jump-${currentSub}">${currentSub}</h3>`;         
            html += `<div class="vocab-grid">`; // open group div
        }
        html += renderVocabCard(item);

        // Peek ahead to see if next item is different category or subcategory, if so close the group div
        const nextItem = sortedData[sortedData.indexOf(item)+1];
        if (!nextItem || nextItem.subcategory !== currentSub ) {
            html += `</div>`; // close vocabgrid div
        }
    });

    container.innerHTML =  html;
   
    container.querySelectorAll('.audio-btn').forEach(btn=>{
        btn.addEventListener('click', () => {
            speakFrench(btn.dataset.speech);
        });
    });
}    


// pull the list of vocab
function renderApp(){
    const filtered = getFilteredData();
    renderVocabList(filtered);
}


init();