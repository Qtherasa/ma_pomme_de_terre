import { initSettings, updateSetting, getSettings } from "./settings.js";
import { setPrimaryData, getFilteredData, getDataFilteredByLevel, getAllData } from "./dataManager.js";
import { renderVocabCard } from "./modules/vocabCard.js";

const levelAliases = {
    'A0': 'Intro',
    'A1': 'Foundation',
    'A2': 'Growing',
    'B1': 'Independent',
    'B2': 'Confident',
    'C+': 'Fluent'
};

// Global State
let vocabData = [];

// Global variable to hold our preferred voice
let frenchFemaleVoice = null;

window.handleUpdateSetting = (key, value) => {
    updateSetting(key, value);
};

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

    // Tab Switching Logic
    const tabs = document.querySelectorAll('.tab-btn');
    const contents = document.querySelectorAll('.tab-content');

    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(t => t.classList.remove('active'));
            contents.forEach(c => c.classList.remove('active'));

            tab.classList.add('active');
            const targetId = tab.getAttribute('data-tab');
            const targetContent = document.getElementById(targetId);
            
            if (targetContent) {
                targetContent.classList.add('active');
                targetContent.scrollTop = 0; // NEW: Snaps tab content back to top
            }
        });
    });

    // Inclusive Level Toggle Listener
    document.getElementById('level-inclusive-toggle').addEventListener('change', (e) => {
        updateSetting('inclusiveLevel', e.target.checked);
    });

    
    // Listen for the custom event to re-render the UI
    window.addEventListener('settingsChanged',() => {
        console.log("Settings updated, re-rendering...");
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
function renderApp() {
    const filtered = getFilteredData();
    const allData = getAllData(); // Make sure this is exported from dataManager.js
    const settings = getSettings();

// 1. Levels (Using Friendly Aliases)
    const levels = ['all', 'A0', 'A1', 'A2', 'B1', 'B2', 'C+'];
    const levelList = document.getElementById('level-list');
    if (levelList) {
        levelList.innerHTML = levels.map(l => `
            <div class="list-item ${settings.lvl === l ? 'selected' : ''}" 
                 onclick="handleUpdateSetting('lvl', '${l}')">
                 ${levelAliases[l] || (l === 'all' ? 'All' : l)}
            </div>
        `).join('');
    }

    // 2. Categories (Reactive Counts)
    const catList = document.getElementById('category-list');
    if (catList) {
        // Get data that is ONLY filtered by the current level selection
        const dataByLevel = getDataFilteredByLevel(); 
        const allData = getAllData();
        
        // Get unique categories from the total dataset (so the buttons don't disappear)
        const categories = [...new Set(allData.map(item => item.category))];
        
        // Total count for the "All" bubble based on current level
        let catHtml = `<div class="list-item ${settings.category === 'all' ? 'selected' : ''}" 
                            onclick="handleUpdateSetting('category', 'all')">
                            All <span>(${dataByLevel.length})</span>
                    </div>`;
        
        catHtml += categories.map(cat => {
            // Count items in this category that also match the current level
            const count = dataByLevel.filter(i => i.category === cat).length;
            
            // Use a class to dim categories with 0 results for the current level
            const isEmpty = count === 0 ? 'is-empty' : '';
            
            return `
                <div class="list-item ${settings.category === cat ? 'selected' : ''} ${isEmpty}" 
                    onclick="handleUpdateSetting('category', '${cat}')">
                    ${cat.charAt(0).toUpperCase() + cat.slice(1)} <span>(${count})</span>
                </div>
            `;
        }).join('');
        catList.innerHTML = catHtml;
    }

    // 3. Topics (Jump Links)
    const topicContainer = document.getElementById('jump-nav-container');
    if (topicContainer) {
        const categories = [...new Set(filtered.map(i => i.category))];
        
        topicContainer.innerHTML = categories.map(cat => {
            const subs = [...new Set(filtered.filter(i => i.category === cat).map(i => i.subcategory))];
            return `
                <div class="topic-group" style="width: 100%; margin-bottom: 15px;">
                    <div style="font-size: 0.7rem; font-weight: bold; color: #999; text-transform: uppercase; margin-bottom: 5px; width: 100%;">
                        ${cat}
                    </div>
                    <div class="action-list">
                        ${subs.map(sub => `
                            <a href="#jump-${sub}" class="list-item" onclick="document.getElementById('filter-tray').classList.remove('tray-open')">
                                ${sub}
                            </a>
                        `).join('')}
                    </div>
                </div>
            `;
        }).join('');
    }

    // 4. CRITICAL: Re-render the main list with filtered data
    renderVocabList(filtered);

    // Fill the tray UI (Level, Categories, Topics)
    //updateTrayUI(filtered, allData);
    
    
}



init();