// WhatAp Agent Settings Popup Logic

// Default configuration
const DEFAULT_CONFIG = {
  enableAgent: true,
  projectAccessKey: "x43e420hjvmv6-z5qbtlae2q1s0j-z76as5gsgdcp02",
  pcode: 3524,
  proxyBaseUrl: "https://rumote.whatap-browser-agent.io/",
  sampleRate: 100,
  xhrTracing: true,
  agentError: true,
  isWebView: false,
  // Sites with strict CSP that block Worker creation and external connects
  blacklist: [
    'github.com',
    'gitlab.com',
    'bitbucket.org',
    'stackoverflow.com',
    'stackexchange.com'
  ]
};

// DOM Elements
const elements = {
  enableAgent: document.getElementById('enableAgent'),
  statusText: document.getElementById('statusText'),
  settingsSection: document.getElementById('settingsSection'),
  projectAccessKey: document.getElementById('projectAccessKey'),
  pcode: document.getElementById('pcode'),
  proxyBaseUrl: document.getElementById('proxyBaseUrl'),
  sampleRate: document.getElementById('sampleRate'),
  sampleRateValue: document.getElementById('sampleRateValue'),
  xhrTracing: document.getElementById('xhrTracing'),
  agentError: document.getElementById('agentError'),
  blacklist: document.getElementById('blacklist'),
  saveBtn: document.getElementById('saveBtn'),
  resetBtn: document.getElementById('resetBtn'),
  statusMessage: document.getElementById('statusMessage')
};

// Load settings from chrome.storage
function loadSettings() {
  chrome.storage.sync.get(['whatapConfig'], (result) => {
    const config = result.whatapConfig || DEFAULT_CONFIG;

    // Master toggle
    elements.enableAgent.checked = config.enableAgent !== false;
    updateMasterToggleUI(elements.enableAgent.checked);

    // Form fields
    elements.projectAccessKey.value = config.projectAccessKey || DEFAULT_CONFIG.projectAccessKey;
    elements.pcode.value = config.pcode || DEFAULT_CONFIG.pcode;
    elements.proxyBaseUrl.value = config.proxyBaseUrl || DEFAULT_CONFIG.proxyBaseUrl;
    elements.sampleRate.value = config.sampleRate !== undefined ? config.sampleRate : DEFAULT_CONFIG.sampleRate;
    elements.sampleRateValue.textContent = `${elements.sampleRate.value}%`;
    elements.xhrTracing.checked = config.xhrTracing !== false;
    elements.agentError.checked = config.agentError !== false;

    // Load blacklist
    const blacklistArray = config.blacklist || DEFAULT_CONFIG.blacklist;
    elements.blacklist.value = blacklistArray.join('\n');

    console.log('[WhatAp Settings] Loaded config:', config);
  });
}

// Save settings to chrome.storage
function saveSettings() {
  // Parse blacklist (split by newlines, trim, remove empty)
  const blacklistArray = elements.blacklist.value
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0);

  const config = {
    enableAgent: elements.enableAgent.checked,
    projectAccessKey: elements.projectAccessKey.value.trim(),
    pcode: parseInt(elements.pcode.value, 10),
    proxyBaseUrl: elements.proxyBaseUrl.value.trim(),
    sampleRate: parseInt(elements.sampleRate.value, 10),
    xhrTracing: elements.xhrTracing.checked,
    agentError: elements.agentError.checked,
    isWebView: false,
    blacklist: blacklistArray
  };

  // Validation
  if (!config.projectAccessKey) {
    showStatus('Project Access Key is required', 'error');
    return;
  }

  if (isNaN(config.pcode) || config.pcode <= 0) {
    showStatus('Invalid Project Code', 'error');
    return;
  }

  if (!config.proxyBaseUrl) {
    showStatus('Proxy Base URL is required', 'error');
    return;
  }

  chrome.storage.sync.set({ whatapConfig: config }, () => {
    console.log('[WhatAp Settings] Saved config:', config);
    showStatus('Settings saved successfully!', 'success');

    // Reload all tabs to apply new settings
    chrome.tabs.query({}, (tabs) => {
      tabs.forEach(tab => {
        if (tab.url && (tab.url.startsWith('http://') || tab.url.startsWith('https://'))) {
          chrome.tabs.reload(tab.id);
        }
      });
    });
  });
}

// Reset to default settings
function resetSettings() {
  if (!confirm('Reset all settings to default values?')) {
    return;
  }

  chrome.storage.sync.set({ whatapConfig: DEFAULT_CONFIG }, () => {
    console.log('[WhatAp Settings] Reset to default');
    loadSettings();
    showStatus('Settings reset to default', 'success');
  });
}

// Update master toggle UI
function updateMasterToggleUI(enabled) {
  if (enabled) {
    elements.statusText.textContent = 'Active on all pages';
    elements.settingsSection.classList.remove('disabled');
  } else {
    elements.statusText.textContent = 'Disabled (not injecting)';
    elements.settingsSection.classList.add('disabled');
  }
}

// Show status message
function showStatus(message, type) {
  elements.statusMessage.textContent = message;
  elements.statusMessage.className = `status-message show ${type}`;

  setTimeout(() => {
    elements.statusMessage.classList.remove('show');
  }, 3000);
}

// Event Listeners
elements.enableAgent.addEventListener('change', () => {
  updateMasterToggleUI(elements.enableAgent.checked);
  saveSettings();
});

elements.sampleRate.addEventListener('input', () => {
  elements.sampleRateValue.textContent = `${elements.sampleRate.value}%`;
});

elements.saveBtn.addEventListener('click', saveSettings);
elements.resetBtn.addEventListener('click', resetSettings);

// Keyboard shortcuts
document.addEventListener('keydown', (e) => {
  if (e.metaKey && e.key === 's') {
    e.preventDefault();
    saveSettings();
  }
});

// Initialize
document.addEventListener('DOMContentLoaded', loadSettings);
