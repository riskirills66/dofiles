// ==UserScript==
// @name         Rose Pine Crisp Theme
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  Apply Rose Pine theme to Crisp chat interface
// @author       You
// @match        https://app.crisp.chat/*
// @match        https://*.crisp.chat/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    // Create style element
    const style = document.createElement('style');
    style.type = 'text/css';
    
    // CSS content from your markdown file
    style.innerHTML = `
/* ===== app.crisp.chat DOMAIN ===== */
/* ===== COLOR SCHEME VARIABLES ===== */
:root {
    /* Primary Theme Colors */
    --primary-bg: #191724 !important;           /* Main dark background */
    --secondary-bg: #1f1d2e !important;         /* Secondary background */
    --tertiary-bg: #21202e !important;          /* Tertiary background */
    --accent-bg: #26233a !important;            /* Accent background */
    --highlight-bg: #403d52 !important;         /* Highlight background */
    
    /* Brand Colors */
    --brand-blue: #31748f !important;           /* Primary blue */
    --brand-teal: #56949f !important;           /* Teal accent */
    --brand-purple: #c4a7e7 !important;         /* Purple accent */
    --brand-red: #eb6f92 !important;            /* Error/warning red */
    --brand-yellow: #f6c177 !important;         /* Warning/accent yellow */
    
    /* Text Colors */
    --text-primary: #e0def4 !important;         /* Primary text */
    --text-secondary: #f6c177 !important;       /* Secondary text */
    --text-muted: #575279 !important;           /* Muted text */
    --text-white: #fff !important;              /* Pure white text */
    --text-dark: #191724 !important;            /* Dark text */
    
    /* Border Colors */
    --border-primary: #26233a !important;       /* Primary border */
    --border-accent: #403d52 !important;        /* Accent border */
    --border-special: #5640a5 !important;       /* Special border */
    
    /* Hover States */
    --hover-blue: #31748f !important;           /* Blue hover */
    --hover-purple: #907aa9 !important;         /* Purple hover */
    --hover-red: #7f4a56 !important;            /* Red hover */
    
    /* Legacy Light Theme (for fallback) */
    --light-bg: #faf4ed !important;
    --light-text: #575279 !important;
}

/* ===== BASE STYLES ===== */
html {
    background-color: var(--light-bg) !important;
    color: var(--light-text) !important;
    font-size: 1em;
    font-family: Crisp Sans, Helvetica Neue, Helvetica, Arial, sans-serif;
    line-height: 1.5;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
}

html, 
body {
    color: var(--text-secondary) !important;
}

a {
    outline: 0;
    color: var(--brand-teal) !important;
    text-decoration: none;
    -webkit-transition: color linear .2s;
    transition: color linear .2s;
    cursor: pointer;
    -webkit-user-drag: none;
}

/* ===== UTILITY CLASSES ===== */
.c-conversation-profile__controls,
.c-base-dropdown__button.u-has-tooltip {
    visibility: visible !important;
    opacity: 1 !important;
    pointer-events: auto !important;
    display: block !important; /* adjust as needed: inline-block, flex, etc. */
}

.c-base-empty-spot {
    background-color: #fff0 !important;
}

/* ===== BUTTON STYLES ===== */
.c-base-button--blue {
    background-color: var(--brand-blue) !important;
    color: var(--text-white) !important;
}

.c-base-button--blue:hover:not([disabled]):not(.c-base-button--pending), 
.c-base-button--blue.c-base-button--hovered:not([disabled]):not(.c-base-button--pending) {
    background-color: var(--hover-blue) !important;
}

.c-base-button--green {
    background-color: var(--brand-blue) !important;
    color: var(--text-white) !important;
}

.c-base-button--red {
    background-color: var(--brand-red) !important;
    color: var(--text-white) !important;
}

.c-base-button--red:hover:not([disabled]):not(.c-base-button--pending), 
.c-base-button--red.c-base-button--hovered:not([disabled]):not(.c-base-button--pending) {
    background-color: var(--hover-red) !important;
}

/* ===== TAB STYLES ===== */
.c-base-tab--blue.c-base-tab--active {
    color: var(--text-dark) !important;
    border-color: rgba(102, 25, 245, .4) !important;
    background-color: var(--brand-purple) !important;
}

/* ===== STATUS & NOTIFICATION STYLES ===== */
.c-base-status--green {
    background-color: var(--brand-blue) !important;
}

.c-base-notification--blue {
    background-color: var(--brand-blue) !important;
}

.c-base-notification--red {
    background-color: var(--brand-red) !important;
}

.c-base-notification--state-resolved {
    background-color: var(--brand-blue) !important;
}

.c-base-notification--state-unresolved {
    background-color: var(--brand-red) !important;
}

/* ===== FLOATING ACTION STYLES ===== */
.c-base-floating-action .c-base-floating-action__inner {
    background-color: var(--highlight-bg) !important;
}

/* ===== LOGO STYLES ===== */
.c-base-logo--default {
    background-image: url("https://avatars.githubusercontent.com/u/62077688?s=200&v=4") !important;
    background-size: contain !important;
    background-repeat: no-repeat !important;
    background-position: center !important;
    display: inline-block !important;
}

/* ===== SIDEBAR STYLES ===== */
.c-sidebar {
    background-color: var(--tertiary-bg) !important;
}

.c-sidebar-item--current:not(.c-sidebar-item--sub)>.c-sidebar-item__inner {
    background-color: var(--brand-blue) !important;
}

.c-sidebar-item--current:not(.c-sidebar-item--sub)>.c-sidebar-item__inner:hover {
    background-color: var(--hover-purple) !important;
}

/* ===== CONVERSATION BOX STYLES ===== */
.c-conversation-box {
    background-color: var(--primary-bg) !important;
}

.c-conversation-box-topbar {
    border-bottom-color: var(--border-primary) !important;
    background-color: var(--tertiary-bg) !important;
    color: var(--text-primary) !important;
}

.c-conversation-box-content-message-bubble--operator .c-conversation-box-content-message-bubble__wrapper {
    background-color: var(--accent-bg) !important;
    color: var(--text-white) !important;
}

.c-conversation-box-content-message-bubble--user .c-conversation-box-content-message-bubble__wrapper {
    background-color: var(--highlight-bg) !important;
    color: var(--text-secondary) !important;
}

.c-conversation-box-suggestions .c-conversation-box-suggestions__body {
    background-color: var(--primary-bg) !important;
}

.c-conversation-box-suggestions .c-conversation-box-suggestions__header {
    border-bottom-color: var(--border-special) !important;
    background-color: var(--primary-bg) !important;
}

.c-conversation-box-suggestion-item {
    background-color: var(--primary-bg) !important;
}

.c-conversation-box-suggestion-item--active {
    background-color: var(--brand-teal) !important;
    color: var(--text-white) !important;
}

.c-conversation-box-live-translate .c-conversation-box-live-translate__action {
    overflow: hidden !important;
    -webkit-box-flex: 0 !important;
    -ms-flex: 0 0 auto !important;
    flex: 0 0 auto !important;
    margin-left: 5px !important;
    color: var(--brand-blue) !important;
    white-space: nowrap !important;
    cursor: pointer !important;
}

.c-conversation-box-live-translate .c-conversation-box-live-translate__wrapper {
    display: none !important;
}

/* ===== CONVERSATION MENU STYLES ===== */
.c-conversation-menu {
    background-color: var(--secondary-bg) !important;
}

.c-conversation-menu .c-conversation-menu__inner .c-conversation-menu__body {
    background-color: var(--secondary-bg) !important;
}

.c-conversation-menu .c-conversation-menu__inner .c-conversation-menu__body .c-conversation-menu__information {
    background-color: var(--secondary-bg) !important;
}

.c-conversation-menu .c-conversation-menu__inner .c-conversation-menu__body .c-conversation-menu__conversations {
    padding: 0px !important;
}

.c-conversation-menu .c-conversation-menu__inner .c-conversation-menu__body .c-conversation-menu__information .c-conversation-menu__empty-spot {
    width: 150px !important;
}

.c-conversation-menu .c-conversation-menu__inner .c-conversation-menu__body .c-conversation-menu__conversations .c-conversation-menu__swipeout-action--state {
    background-color: var(--brand-blue) !important;
}

/* Conversation Menu Header */
.c-conversation-menu-header {
    border-bottom-color: var(--primary-bg) !important;
    background-color: #10025a !important;
}

.c-conversation-menu-header .c-conversation-menu-header__filters .c-conversation-menu-header__menu--custom {
    margin-left: 10px !important;
    margin-right: 5px !important;
}

.c-conversation-menu-header--chat .c-conversation-menu-header__filters .c-conversation-menu-header__button--new .c-base-button__inner .c-base-button__icon, 
.c-conversation-menu-header--compact .c-conversation-menu-header__filters .c-conversation-menu-header__button--new .c-base-button__inner .c-base-button__icon {
    color: var(--brand-blue) !important;
    stroke: var(--brand-blue) !important;
}

/* Conversation Menu Footer */
.c-conversation-menu-footer {
    height: 35px !important;
    justify-content: space-between !important;
    padding: 0 0px 0 15px !important;
    border-top-color: var(--primary-bg) !important;
    background-color: var(--primary-bg) !important;
}

.c-conversation-menu-footer .c-conversation-menu-footer__operators {
    display: none !important;
}

/* ===== CONVERSATION MENU ITEM STYLES ===== */
.c-conversation-menu-item .c-conversation-menu-item__avatar {
    display: none !important;
}

.c-conversation-menu-item .c-conversation-menu-item__container {
    margin-left: 8px !important;
}

.c-conversation-menu-item--active {
    background-color: var(--primary-bg) !important;
}

.c-conversation-menu-item:hover {
    background-color: var(--accent-bg) !important;
}

.c-conversation-menu-item--chat {
    padding: 0px 5px 0px 0px !important;
}

.c-conversation-menu-item--compact {
    height: 58px !important;
    padding: 3px 3px !important;
    border-radius: 6px !important;
}

/* Conversation Menu Item Headlines */
.c-conversation-menu-item-headline {
    color: var(--text-secondary) !important;
}

.c-conversation-menu-item-headline--chat {
    font-size: 14px !important;
    line-height: 14px !important;
    margin-bottom: 0px !important;
    margin-top: 0px !important;
}

.c-conversation-menu-item-headline .c-conversation-menu-item-headline__names .c-conversation-menu-item-headline__routing {
    display: none !important;
    font-size: 14.5px !important;
}

/* Conversation Menu Item Context */
.c-conversation-menu-item-context .c-conversation-menu-item-context__inner .c-conversation-menu-item-context__last-message-text {
    max-height: 18px !important;
    font-size: 14px !important;
    line-height: 18px !important;
}

.c-conversation-menu-item-context .c-conversation-menu-item-context__context-meta .c-conversation-menu-item-context__operators .c-conversation-menu-item-context__operator {
    width: 18px !important;
    height: 18px !important;
}

/* ===== AVATAR STYLES ===== */
.c-base-avatar--mini .c-base-avatar__picture {
    width: 18px !important;
    height: 18px !important;
}

.c-conversation-menu-item .c-conversation-menu-item__avatar,
.c-conversation-profile .c-conversation-profile__loaded .c-conversation-profile__header .c-conversation-profile__information .c-conversation-profile__avatar {
    display: none !important;
}

/* ===== SELECT MENU STYLES ===== */
.c-base-select-menu {
    border-top-color: var(--tertiary-bg) !important;
    border-right-color: var(--tertiary-bg) !important;
    border-bottom-color: var(--tertiary-bg) !important;
    border-left-color: var(--tertiary-bg) !important;
    background-color: var(--primary-bg) !important;
    box-shadow:
        rgba(64, 61, 82, 0.2) 0px 0px 14px -4px,
        rgba(82, 79, 103, 0.3) 0px 32px 48px -8px,
        rgba(82, 79, 103, 0.35) 0px 40px 64px -12px !important;
}

/* ===== DARK READER OVERRIDES ===== */
[data-darkreader-inline-border-top] {
    border-top-color: var(--highlight-bg) !important;
}

[data-darkreader-inline-bgcolor] {
    background-color: var(--primary-bg) !important;
}

/* ===== CONVERSATION PROFILE STYLES ===== */
.c-conversation-profile {
    background-color: var(--highlight-bg) !important;
}

.c-conversation-profile-widget {
    border-bottom-color: var(--accent-bg) !important;
}

.c-conversation-profile-widget--deployed .c-conversation-profile-widget__header {
    border-bottom-color: var(--accent-bg) !important;
    background-color: var(--primary-bg) !important;
}

.c-conversation-profile-widget--white .c-conversation-profile-widget__body {
    background-color: var(--primary-bg) !important;
}

.c-conversation-profile-widget .c-conversation-profile-widget__header {
    background-color: var(--primary-bg) !important;
    color: #ebffda !important;
}

.c-conversation-profile-widget-layout-action {
    border-bottom-color: var(--accent-bg) !important;
    background-color: var(--primary-bg) !important;
}

.c-conversation-profile-widget-data-item--has-submit .c-conversation-profile-widget-data-item__cell, 
.c-conversation-profile-widget-data-item--has-submit .c-conversation-profile-widget-data-item__cell .c-conversation-profile-widget-data-item__input {
    background-color: var(--primary-bg) !important;
}

/* ===== FIELD INPUT STYLES ===== */
.c-field-input--normal.c-field-input--bordered .c-field-input__wrapper .c-field-input__container {
    border-top-color: var(--accent-bg) !important;
    border-right-color: var(--accent-bg) !important;
    border-bottom-color: var(--accent-bg) !important;
    border-left-color: var(--accent-bg) !important;
    color: var(--text-dark) !important;
}

.c-field-input--bordered .c-field-input__wrapper .c-field-input__container {
    background-color: var(--primary-bg) !important;
}
    `;

    // Function to inject styles
    function injectStyles() {
        // Remove existing style if it exists
        const existingStyle = document.getElementById('rose-pine-crisp-theme');
        if (existingStyle) {
            existingStyle.remove();
        }
        
        // Add ID to style element for easy removal
        style.id = 'rose-pine-crisp-theme';
        
        // Inject the styles
        document.head.appendChild(style);
        
        // Force reflow to ensure styles are applied
        document.body.offsetHeight;
    }

    // Inject styles immediately
    injectStyles();

    // Also inject when DOM is ready (in case the page loads dynamically)
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', injectStyles);
    }

    // Additional delayed injection to override Crisp's styles
    setTimeout(injectStyles, 1000);
    setTimeout(injectStyles, 3000);

    // Watch for dynamic content changes (useful for SPAs)
    const observer = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
            if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
                // Check if any added nodes contain Crisp elements
                for (let node of mutation.addedNodes) {
                    if (node.nodeType === Node.ELEMENT_NODE) {
                        if (node.classList && (
                            node.classList.contains('c-conversation-box') ||
                            node.classList.contains('c-conversation-menu') ||
                            node.querySelector('.c-conversation-box, .c-conversation-menu')
                        )) {
                            // Re-inject styles if needed
                            if (!document.getElementById('rose-pine-crisp-theme')) {
                                injectStyles();
                            }
                            break;
                        }
                    }
                }
            }
        });
    });

    // Start observing
    observer.observe(document.body, {
        childList: true,
        subtree: true
    });

    console.log('Rose Pine Crisp Theme loaded successfully!');
})();