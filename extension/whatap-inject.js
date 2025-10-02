// WhatAp Browser Agent Auto-Injector
// Injects WhatAp Browser Agent into every page's <head> before any other scripts
(function() {
  'use strict';

  console.log('[WhatAp Auto-Inject] Starting injection...');

  // Default configuration
  const DEFAULT_CONFIG = {
    enableAgent: true,
    projectAccessKey: "x43e420hjvmv6-z5qbtlae2q1s0j-z76as5gsgdcp02",
    pcode: 3524,
    sampleRate: 100,
    proxyBaseUrl: "https://rumote.whatap-browser-agent.io/",
    agentError: true,
    isWebView: false,
    xhrTracing: true,
    // Sites with strict CSP that block Worker creation and external connects
    blacklist: [
      'github.com',
      'gitlab.com',
      'bitbucket.org',
      'stackoverflow.com',
      'stackexchange.com'
    ]
  };

  // Check if current domain is blacklisted
  function isBlacklisted(hostname, blacklist) {
    if (!blacklist || blacklist.length === 0) return false;

    return blacklist.some(domain => {
      // Exact match or subdomain match
      return hostname === domain || hostname.endsWith('.' + domain);
    });
  }

  // Load config from chrome.storage and inject agent
  chrome.storage.sync.get(['whatapConfig'], (result) => {
    const config = result.whatapConfig || DEFAULT_CONFIG;

    // Check if agent is enabled
    if (config.enableAgent === false) {
      console.log('[WhatAp Auto-Inject] ⚠️ Agent is disabled - skipping injection');
      return;
    }

    // Check if current domain is blacklisted
    const currentHostname = window.location.hostname;
    const blacklist = config.blacklist || DEFAULT_CONFIG.blacklist;

    if (isBlacklisted(currentHostname, blacklist)) {
      console.log(`[WhatAp Auto-Inject] ⚠️ Domain "${currentHostname}" is blacklisted - skipping injection`);
      return;
    }

    // WhatAp configuration
    const whatapConfig = {
      projectAccessKey: config.projectAccessKey,
      pcode: config.pcode,
      sampleRate: config.sampleRate,
      proxyBaseUrl: config.proxyBaseUrl,
      agentError: config.agentError,
      isWebView: config.isWebView || false,
      xhrTracing: config.xhrTracing
    };

    // Send config to MAIN world script via postMessage
    // (Agent code is bundled in whatap-inject-main.js)
    window.postMessage({
      type: 'WHATAP_INJECT_CONFIG',
      config: whatapConfig,
      shouldInject: true
    }, '*');

    console.log('[WhatAp Auto-Inject] ✅ Sent config to MAIN world (CSP bypass)');
    console.log('[WhatAp Auto-Inject] Configuration:', whatapConfig);
  });
})();
