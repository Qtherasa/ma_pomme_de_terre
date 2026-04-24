// 1. Default configuration
const DEFAULT_SETTINGS = {
    lvl: 'A0',
    category: 'all',
    speechRate: 0.8,
    theme: 'light',
    dialect: 'fr-FR',
    showGenderColor: false
};

// 2. State (Initialized from LocalStorage or Defaults)
let currentSettings = { ...DEFAULT_SETTINGS };

export function initSettings() {
    const saved = localStorage.getItem('vocabSettings');
    if (saved) {
        currentSettings = { ...DEFAULT_SETTINGS, ...JSON.parse(saved)}
    }
    return currentSettings;
}

export function updateSetting(key, value) {
    const settings = getSettings();
    currentSettings[key] = value;
    localStorage.setItem('vocabSettings', JSON.stringify(currentSettings));
    // dispatch a custom event so other parts of app know the settings changed without a full refresh
    window.dispatchEvent(new CustomEvent('settingsChanged', {detail: currentSettings }));
}

export function getSettings() {
    return currentSettings;
}