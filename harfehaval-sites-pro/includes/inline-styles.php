<?php
/**
 * Inline per-instance CSS for complete theme isolation.
 * Specificity: #id .class = (1,1,0) + !important = unbeatable.
 *
 * @package HarfehavalSitesPro
 */

defined( 'ABSPATH' ) || exit;

function ha_sites_pro_inline_styles( $id ) {
	$p = '#' . $id;           // widget instance prefix  — specificity (1,1,0)
	$m = '#' . $id . '-modal'; // portaled modal prefix   — specificity (1,1,0)
	return "
/* ── COMPLETE THEME ISOLATION via instance ID (unbeatable specificity) ── */

/* Base button reset + shape */
{$p} .ha-pro-btn,
{$p} button.ha-pro-btn,
{$p} a.ha-pro-btn {
    display: inline-flex !important;
    align-items: center !important;
    justify-content: center !important;
    gap: 6px !important;
    padding: 10px 18px !important;
    border: 0 !important;
    outline: 0 !important;
    border-radius: 10px !important;
    font-family: IRANYekan, Vazirmatn, Tahoma, system-ui, sans-serif !important;
    font-size: .875rem !important;
    font-weight: 700 !important;
    line-height: 1 !important;
    letter-spacing: normal !important;
    text-decoration: none !important;
    text-transform: none !important;
    white-space: nowrap !important;
    min-height: 42px !important;
    cursor: pointer !important;
    transition: transform .15s ease, box-shadow .2s ease !important;
    position: relative !important;
    overflow: hidden !important;
    flex: 1 !important;
    text-align: center !important;
    -webkit-appearance: none !important;
    appearance: none !important;
    box-sizing: border-box !important;
    margin: 0 !important;
    vertical-align: middle !important;
    box-shadow: none !important;
    background-clip: padding-box !important;
}

/* Primary */
{$p} .ha-pro-btn-primary {
    background: linear-gradient(135deg, #2ec4b6 0%, #20a49a 100%) !important;
    color: #ffffff !important;
    box-shadow: 0 4px 12px rgba(46,196,182,.3) !important;
}
{$p} .ha-pro-btn-primary:hover { transform: translateY(-2px) !important; box-shadow: 0 8px 20px rgba(46,196,182,.4) !important; color: #fff !important; }
{$p} .ha-pro-btn-primary:active { transform: translateY(0) !important; }

/* Secondary */
{$p} .ha-pro-btn-secondary {
    background: #ffffff !important;
    color: #011627 !important;
    border: 1.5px solid #dbe5ef !important;
    box-shadow: 0 1px 2px rgba(1,22,39,.04) !important;
}
{$p} .ha-pro-btn-secondary:hover { color: #2ec4b6 !important; border-color: #2ec4b6 !important; transform: translateY(-2px) !important; background: #fff !important; }

/* Search input */
{$p} .ha-pro-search-input {
    all: unset !important;
    display: block !important;
    width: 100% !important;
    flex: 1 !important;
    padding: 10px 0 !important;
    font-size: .9rem !important;
    color: #011627 !important;
    background: transparent !important;
    border: 0 !important;
    outline: 0 !important;
    box-shadow: none !important;
    font-family: IRANYekan, Vazirmatn, Tahoma, system-ui, sans-serif !important;
    direction: rtl !important;
    line-height: 1.5 !important;
}

/* Sort select */
{$p} .ha-pro-sort {
    all: unset !important;
    display: inline-block !important;
    padding: 8px 10px !important;
    border: 1.5px solid #dbe5ef !important;
    border-radius: 8px !important;
    font-size: .85rem !important;
    color: #011627 !important;
    background: #ffffff !important;
    cursor: pointer !important;
    font-family: IRANYekan, Vazirmatn, Tahoma, system-ui, sans-serif !important;
    direction: rtl !important;
    -webkit-appearance: auto !important;
    appearance: auto !important;
    box-sizing: border-box !important;
}

/* Filter chips */
{$p} .ha-pro-chip {
    display: inline-flex !important;
    align-items: center !important;
    gap: 5px !important;
    padding: 7px 14px !important;
    border: 1.5px solid #dbe5ef !important;
    border-radius: 100px !important;
    font-size: .82rem !important;
    font-weight: 700 !important;
    color: #64748b !important;
    background: #ffffff !important;
    cursor: pointer !important;
    transition: all .18s ease !important;
    box-sizing: border-box !important;
    font-family: IRANYekan, Vazirmatn, Tahoma, system-ui, sans-serif !important;
    text-decoration: none !important;
    -webkit-appearance: none !important;
    appearance: none !important;
    margin: 0 !important;
    outline: 0 !important;
    white-space: nowrap !important;
    line-height: 1 !important;
}
{$p} .ha-pro-chip:hover { border-color: #2ec4b6 !important; color: #2ec4b6 !important; }
{$p} .ha-pro-chip.is-active { background: #2ec4b6 !important; border-color: #2ec4b6 !important; color: #ffffff !important; box-shadow: 0 3px 10px rgba(46,196,182,.3) !important; }
{$p} .ha-pro-chip.is-active small { color: rgba(255,255,255,.8) !important; background: rgba(0,0,0,.15) !important; }
{$p} .ha-pro-chip small { display: inline-flex !important; align-items: center !important; justify-content: center !important; min-width: 18px !important; height: 18px !important; padding: 0 5px !important; background: #f0f4f8 !important; color: #64748b !important; border-radius: 100px !important; font-size: .7rem !important; font-weight: 800 !important; box-sizing: border-box !important; }

/* Layout switcher */
{$p} .ha-pro-layout-switcher button {
    display: inline-flex !important;
    align-items: center !important;
    justify-content: center !important;
    width: 34px !important;
    height: 34px !important;
    padding: 0 !important;
    background: transparent !important;
    color: #64748b !important;
    border: 0 !important;
    cursor: pointer !important;
    font-size: .9rem !important;
    -webkit-appearance: none !important;
    appearance: none !important;
    transition: all .15s !important;
    box-sizing: border-box !important;
    outline: 0 !important;
    border-left: 1px solid #dbe5ef !important;
    border-radius: 0 !important;
    box-shadow: none !important;
    margin: 0 !important;
    flex: none !important;
    min-height: 0 !important;
    font-family: inherit !important;
}
{$p} .ha-pro-layout-switcher button:first-child { border-left: 0 !important; }
{$p} .ha-pro-layout-switcher button.is-active { color: #2ec4b6 !important; background: rgba(46,196,182,.1) !important; }

/* Load more + reset */
{$p} .ha-pro-loadmore {
    display: inline-flex !important;
    align-items: center !important;
    justify-content: center !important;
    padding: 13px 48px !important;
    background: #ffffff !important;
    color: #011627 !important;
    border: 2px solid #dbe5ef !important;
    border-radius: 100px !important;
    font-size: .9rem !important;
    font-weight: 700 !important;
    cursor: pointer !important;
    transition: all .2s !important;
    font-family: IRANYekan, Vazirmatn, Tahoma, system-ui, sans-serif !important;
    -webkit-appearance: none !important;
    appearance: none !important;
    box-sizing: border-box !important;
    box-shadow: none !important;
    margin: 0 !important;
    line-height: 1 !important;
    text-decoration: none !important;
    outline: 0 !important;
    letter-spacing: normal !important;
    text-transform: none !important;
    min-height: 0 !important;
    flex: none !important;
}
{$p} .ha-pro-loadmore:hover { background: #2ec4b6 !important; color: #011627 !important; border-color: #2ec4b6 !important; }

/* ── MODAL STYLES (portaled to body — use #{id}-modal prefix) ─────────────── */

/* Reset all buttons/links inside modal header */
{$m} .ha-pro-preview-close,
{$m} .ha-pro-preview-open,
{$m} .ha-pro-share-btn,
{$m} .ha-pro-preview-devices button {
    -webkit-appearance: none !important;
    appearance: none !important;
    cursor: pointer !important;
    font-family: IRANYekan, Vazirmatn, Tahoma, system-ui, sans-serif !important;
    box-sizing: border-box !important;
    margin: 0 !important;
    text-decoration: none !important;
    outline: 0 !important;
    box-shadow: none !important;
    letter-spacing: normal !important;
    text-transform: none !important;
}

{$m} .ha-pro-preview-header {
    display: flex !important;
    align-items: center !important;
    gap: 12px !important;
    padding: 10px 20px !important;
    background: #011627 !important;
    color: #fff !important;
    flex-shrink: 0 !important;
    height: 56px !important;
    flex-wrap: nowrap !important;
    box-sizing: border-box !important;
    border: 0 !important;
    box-shadow: none !important;
}

{$m} .ha-pro-preview-close {
    display: flex !important; align-items: center !important; justify-content: center !important;
    width: 34px !important; height: 34px !important; padding: 0 !important;
    background: rgba(255,255,255,.1) !important; color: #fff !important;
    border: 0 !important; border-radius: 50% !important;
    font-size: 1.2rem !important; line-height: 1 !important;
    flex: none !important; min-height: 0 !important;
}
{$m} .ha-pro-preview-close:hover { background: rgba(239,68,68,.5) !important; color: #fff !important; }

{$m} .ha-pro-preview-open {
    display: inline-flex !important; align-items: center !important;
    padding: 7px 14px !important;
    background: rgba(255,255,255,.1) !important; color: rgba(255,255,255,.85) !important;
    border: 1px solid rgba(255,255,255,.15) !important; border-radius: 7px !important;
    font-size: .8rem !important; font-weight: 600 !important;
    flex: none !important; min-height: 0 !important; white-space: nowrap !important;
}
{$m} .ha-pro-preview-open:hover { background: rgba(255,255,255,.2) !important; color: #fff !important; }

{$m} .ha-pro-preview-devices {
    display: flex !important;
    background: rgba(255,255,255,.08) !important;
    border: 1px solid rgba(255,255,255,.12) !important;
    border-radius: 8px !important;
    overflow: hidden !important;
    flex-shrink: 0 !important;
}
{$m} .ha-pro-preview-devices button {
    display: inline-flex !important; align-items: center !important; justify-content: center !important;
    padding: 7px 12px !important; background: transparent !important;
    color: rgba(255,255,255,.65) !important; border: 0 !important;
    font-size: .78rem !important; font-weight: 700 !important;
    transition: all .15s !important; white-space: nowrap !important;
    line-height: 1 !important; flex: none !important; min-height: 0 !important;
    border-radius: 0 !important;
}
{$m} .ha-pro-preview-devices button.is-active { color: #2ec4b6 !important; background: rgba(46,196,182,.15) !important; }

/* Actions/buttons inside the sidebar panel */
{$m} .ha-pro-btn,
{$m} button.ha-pro-btn,
{$m} a.ha-pro-btn {
    display: inline-flex !important;
    align-items: center !important;
    justify-content: center !important;
    gap: 6px !important;
    padding: 10px 18px !important;
    border: 0 !important;
    outline: 0 !important;
    border-radius: 10px !important;
    font-family: IRANYekan, Vazirmatn, Tahoma, system-ui, sans-serif !important;
    font-size: .875rem !important;
    font-weight: 700 !important;
    line-height: 1 !important;
    text-decoration: none !important;
    text-transform: none !important;
    white-space: nowrap !important;
    min-height: 40px !important;
    cursor: pointer !important;
    transition: transform .15s ease, box-shadow .2s ease !important;
    -webkit-appearance: none !important;
    appearance: none !important;
    box-sizing: border-box !important;
    margin: 0 !important;
    letter-spacing: normal !important;
    box-shadow: none !important;
    width: 100% !important;
}
{$m} .ha-pro-btn-primary {
    background: linear-gradient(135deg, #2ec4b6 0%, #20a49a 100%) !important;
    color: #ffffff !important;
    box-shadow: 0 4px 12px rgba(46,196,182,.3) !important;
}
{$m} .ha-pro-btn-primary:hover { transform: translateY(-1px) !important; color: #fff !important; }
{$m} .ha-pro-btn-secondary {
    background: #ffffff !important; color: #011627 !important;
    border: 1.5px solid #dbe5ef !important;
}
{$m} .ha-pro-btn-secondary:hover { color: #2ec4b6 !important; border-color: #2ec4b6 !important; background: #fff !important; }

/* Side tabs in modal */
{$m} .ha-pro-side-tab {
    display: inline-flex !important; align-items: center !important; padding: 8px 12px !important;
    background: transparent !important; color: #64748b !important; border: 0 !important;
    border-bottom: 2px solid transparent !important; border-radius: 0 !important;
    font-size: .82rem !important; font-weight: 600 !important; cursor: pointer !important;
    -webkit-appearance: none !important; appearance: none !important;
    font-family: IRANYekan, Vazirmatn, Tahoma, system-ui, sans-serif !important;
    box-sizing: border-box !important; margin: 0 0 -2px !important; outline: 0 !important;
    flex: none !important; white-space: nowrap !important; min-height: 0 !important;
    box-shadow: none !important; line-height: 1 !important; text-decoration: none !important;
    transition: all .15s !important;
}
{$m} .ha-pro-side-tab.is-active { color: #2ec4b6 !important; border-bottom-color: #2ec4b6 !important; }

/* Side handle inside modal (panel on left, handle at panel's right edge) */
{$m} .ha-pro-side-handle {
    display: flex !important; align-items: center !important; justify-content: center !important;
    width: 22px !important; height: 72px !important; padding: 0 !important;
    background: rgba(255,255,255,.97) !important; border: 1px solid #dbe5ef !important;
    border-left: 0 !important; border-radius: 0 10px 10px 0 !important;
    cursor: pointer !important; -webkit-appearance: none !important; appearance: none !important;
    box-sizing: border-box !important; margin: 0 !important; outline: 0 !important;
    flex: none !important; min-height: 0 !important; box-shadow: 4px 0 16px rgba(1,22,39,.09) !important;
    color: #94a3b8 !important; font-size: .65rem !important;
    transition: left .3s ease, background .2s !important;
    line-height: 1 !important; position: absolute !important; top: 50% !important;
    left: 300px !important; right: auto !important; transform: translateY(-50%) !important;
    z-index: 20 !important;
}
{$m} .ha-pro-side-handle:hover { background: #f8fafc !important; color: #2ec4b6 !important; }
{$m} .ha-pro-frame-stage.is-info-hidden .ha-pro-side-handle { left: 0 !important; }
{$m} .ha-pro-side-handle::before { content: '\\276F' !important; font-family: system-ui !important; transition: transform .3s !important; display: block !important; }
{$m} .ha-pro-frame-stage.is-info-hidden .ha-pro-side-handle::before { transform: rotate(180deg) !important; }

/* Sidebar panel itself — force width & overlay layout */
{$m} .ha-pro-preview-side {
    position: absolute !important;
    top: 0 !important; bottom: 0 !important; left: 0 !important; right: auto !important;
    width: 300px !important; max-width: 28vw !important; min-width: 260px !important;
    background: rgba(255,255,255,.97) !important;
    border-right: 1.5px solid #dbe5ef !important; border-left: 0 !important;
    overflow-y: auto !important; overflow-x: hidden !important;
    display: flex !important; flex-direction: column !important;
    z-index: 10 !important; box-shadow: 6px 0 32px rgba(1,22,39,.12) !important;
    transition: transform .3s ease, opacity .3s ease !important;
    box-sizing: border-box !important;
}
{$m} .ha-pro-frame-stage { position: relative !important; display: flex !important; flex: 1 !important; overflow: hidden !important; }
{$m} .ha-pro-frame-wrap { flex: 1 !important; width: 100% !important; }
{$m} .ha-pro-frame-stage.is-info-hidden .ha-pro-preview-side {
    transform: translateX(-100%) !important; opacity: 0 !important; pointer-events: none !important;
}

/* Sidebar inner content — clean RTL list */
{$m} .ha-pro-side-head { padding: 20px 20px 0 !important; flex-shrink: 0 !important; }
{$m} .ha-pro-side-head h3 { font-size: 1rem !important; font-weight: 800 !important; color: #011627 !important; margin: 0 0 6px !important; line-height: 1.5 !important; }
{$m} .ha-pro-side-head p  { font-size: .85rem !important; color: #64748b !important; margin: 0 !important; line-height: 1.7 !important; }

{$m} .ha-pro-side-tabs { padding: 16px 20px 0 !important; }
{$m} .ha-pro-side-tabs-nav { display: flex !important; gap: 4px !important; border-bottom: 2px solid #dbe5ef !important; margin-bottom: 12px !important; }
{$m} .ha-pro-side-tab-panel { display: none !important; }
{$m} .ha-pro-side-tab-panel.is-active { display: block !important; }
{$m} .ha-pro-side-tab-body { font-size: .85rem !important; color: #011627 !important; line-height: 1.8 !important; }
{$m} .ha-pro-side-tab-body p { margin: 0 0 10px !important; }

{$m} .ha-pro-side-section-title {
    padding: 16px 20px 6px !important; font-size: .78rem !important; font-weight: 800 !important;
    color: #64748b !important; text-transform: none !important; letter-spacing: .02em !important;
}

{$m} .ha-pro-side-facts {
    list-style: none !important; padding: 0 20px !important; margin: 8px 0 !important;
}
{$m} .ha-pro-side-facts li {
    display: flex !important; justify-content: space-between !important; align-items: center !important;
    padding: 9px 0 !important; border-bottom: 1px dashed #dbe5ef !important;
    font-size: .85rem !important; line-height: 1.5 !important; gap: 12px !important;
}
{$m} .ha-pro-side-facts li:last-child { border-bottom: 0 !important; }
{$m} .ha-pro-side-facts b    { color: #64748b !important; font-weight: 600 !important; flex: none !important; }
{$m} .ha-pro-side-facts span { color: #011627 !important; font-weight: 700 !important; text-align: left !important; flex: 1 !important; }

{$m} .ha-pro-side-price {
    display: flex !important; align-items: baseline !important; gap: 10px !important;
    padding: 14px 20px !important; border-top: 1px solid #dbe5ef !important; margin-top: 8px !important;
}
{$m} .ha-pro-side-price strong { font-size: 1.15rem !important; font-weight: 900 !important; color: #2ec4b6 !important; }
{$m} .ha-pro-side-price del    { font-size: .85rem !important; color: #94a3b8 !important; text-decoration: line-through !important; }

{$m} .ha-pro-side-highlight {
    margin: 12px 20px 0 !important; padding: 10px 14px !important;
    background: linear-gradient(90deg, #fef3c7, #dbeafe) !important;
    border-radius: 8px !important; font-size: .82rem !important; font-weight: 700 !important;
    color: #1e3a5f !important; line-height: 1.6 !important;
}

/* QR block */
{$m} .ha-pro-qr {
    display: flex !important; align-items: center !important; gap: 14px !important;
    padding: 16px 20px !important; border-top: 1px solid #dbe5ef !important; margin-top: 8px !important;
}
{$m} .ha-pro-qr img {
    width: 96px !important; height: 96px !important; border: 6px solid #fff !important;
    border-radius: 10px !important; box-shadow: 0 4px 14px rgba(1,22,39,.1) !important;
    background: #fff !important; flex: none !important; display: block !important;
}
{$m} .ha-pro-qr-text { flex: 1 !important; font-size: .8rem !important; line-height: 1.7 !important; }
{$m} .ha-pro-qr-text b    { display: block !important; color: #011627 !important; font-weight: 800 !important; margin-bottom: 4px !important; }
{$m} .ha-pro-qr-text span { display: block !important; color: #64748b !important; font-size: .75rem !important; }

/* Action area in sidebar */
{$m} .ha-pro-preview-side .ha-pro-actions {
    padding: 14px 20px 20px !important; display: flex !important; flex-direction: column !important; gap: 10px !important;
    border-top: 1px solid #dbe5ef !important; margin-top: 4px !important;
}
{$m} .ha-pro-preview-side .ha-pro-actions .ha-pro-btn { width: 100% !important; flex: none !important; }

/* Code badge inside sidebar */
{$m} .ha-pro-code-badge {
    display: inline-flex !important; align-items: center !important; gap: 4px !important;
    font-size: .72rem !important; font-weight: 900 !important; padding: 4px 10px !important;
    background: #011627 !important; color: #fff !important; border-radius: 6px !important;
    font-family: ui-monospace, 'Courier New', monospace !important; letter-spacing: .06em !important;
    position: static !important;
}

/* Loading spinner */
{$m} .ha-pro-frame-wrap { position: relative !important; background: #e8ecf0 !important; padding: 16px !important; }
{$m} .ha-pro-frame-wrap iframe { width: 100% !important; height: 100% !important; border: 0 !important; border-radius: 10px !important; background: #fff !important; box-shadow: 0 4px 40px rgba(0,0,0,.2) !important; display: block !important; }
{$m} .ha-pro-frame-wrap.is-tablet iframe { width: 768px !important; max-width: 100% !important; margin: 0 auto !important; }
{$m} .ha-pro-frame-wrap.is-mobile iframe { width: 390px !important; max-width: 100% !important; margin: 0 auto !important; }
{$m} .ha-pro-frame-wrap.is-loading::before {
    content: '' !important; position: absolute !important; top: 50% !important; left: 50% !important;
    width: 48px !important; height: 48px !important; margin: -24px 0 0 -24px !important;
    border: 4px solid rgba(46,196,182,.15) !important; border-top-color: #2ec4b6 !important;
    border-radius: 50% !important; animation: ha-spin .8s linear infinite !important; z-index: 2 !important;
}

/* Modal title text */
{$m} .ha-pro-preview-title { flex: 1 !important; min-width: 0 !important; }
{$m} .ha-pro-preview-title strong { display: block !important; font-size: .925rem !important; color: #fff !important; font-weight: 700 !important; white-space: nowrap !important; overflow: hidden !important; text-overflow: ellipsis !important; }
{$m} .ha-pro-preview-title span   { display: block !important; font-size: .75rem !important; color: rgba(255,255,255,.55) !important; }

/* Modal preview wrapper */
{$m} .ha-pro-preview { position: relative !important; z-index: 1 !important; display: flex !important; flex-direction: column !important; width: 100% !important; background: #f0f4f8 !important; overflow: hidden !important; }
{$m} .ha-pro-modal-backdrop { position: absolute !important; inset: 0 !important; background: rgba(1,22,39,.7) !important; backdrop-filter: blur(4px) !important; cursor: pointer !important; }

/* Modal header buttons (kept for backward compat) */

/* Hero buttons */
{$p} .ha-pro-hero-btn {
    display: inline-flex !important; align-items: center !important; justify-content: center !important;
    padding: 12px 24px !important; border-radius: 10px !important;
    font-weight: 700 !important; font-size: .95rem !important; cursor: pointer !important;
    transition: all .2s !important; text-decoration: none !important;
    white-space: nowrap !important; border: 0 !important; box-sizing: border-box !important;
    font-family: IRANYekan, Vazirmatn, Tahoma, system-ui, sans-serif !important;
    line-height: 1 !important; -webkit-appearance: none !important; appearance: none !important;
    outline: 0 !important; margin: 0 !important; min-height: 0 !important; flex: none !important;
}
{$p} .ha-pro-hero-btn-primary { background: #2ec4b6 !important; color: #011627 !important; }
{$p} .ha-pro-hero-btn-primary:hover { background: #20a49a !important; color: #011627 !important; }
{$p} .ha-pro-hero-btn-secondary { background: rgba(255,255,255,.12) !important; color: #fff !important; border: 1px solid rgba(255,255,255,.2) !important; }
{$p} .ha-pro-hero-btn-secondary:hover { background: rgba(255,255,255,.2) !important; }

/* Card tool buttons (heart/compare) */
{$p} .ha-pro-tool {
    display: flex !important; align-items: center !important; justify-content: center !important;
    width: 32px !important; height: 32px !important; padding: 0 !important;
    background: rgba(255,255,255,.9) !important; border: 1px solid rgba(0,0,0,.06) !important;
    border-radius: 50% !important; font-size: 1rem !important; cursor: pointer !important;
    color: #64748b !important; transition: all .2s !important;
    -webkit-appearance: none !important; appearance: none !important;
    box-sizing: border-box !important; margin: 0 !important; outline: 0 !important;
    box-shadow: none !important; flex: none !important; min-height: 0 !important;
    line-height: 1 !important; font-family: inherit !important; text-decoration: none !important;
}
{$p} .ha-pro-tool:hover { background: #fff !important; color: #ef4444 !important; }

/* Quick view */
{$p} .ha-pro-quick-view {
    padding: 7px 14px !important; background: rgba(255,255,255,.95) !important;
    color: #011627 !important; border: 0 !important; border-radius: 100px !important;
    font-size: .76rem !important; font-weight: 800 !important; cursor: pointer !important;
    white-space: nowrap !important; -webkit-appearance: none !important; appearance: none !important;
    font-family: IRANYekan, Vazirmatn, Tahoma, system-ui, sans-serif !important;
    box-shadow: 0 4px 14px rgba(0,0,0,.15) !important; outline: 0 !important;
    margin: 0 !important; box-sizing: border-box !important; flex: none !important;
    min-height: 0 !important; text-decoration: none !important; line-height: 1 !important;
    display: inline-flex !important; align-items: center !important;
}
{$p} .ha-pro-quick-view:hover { background: #2ec4b6 !important; color: #fff !important; }

/* Compare bar buttons */
{$p} .ha-pro-compare-bar [data-ha-compare-clear] {
    display: inline-flex !important; align-items: center !important; padding: 8px 16px !important;
    background: rgba(255,255,255,.15) !important; color: #fff !important; border: 0 !important;
    border-radius: 8px !important; font-size: .8rem !important; font-weight: 700 !important;
    cursor: pointer !important; -webkit-appearance: none !important; appearance: none !important;
    font-family: IRANYekan, Vazirmatn, Tahoma, system-ui, sans-serif !important;
    box-sizing: border-box !important; margin: 0 !important; outline: 0 !important;
    flex: none !important; white-space: nowrap !important; min-height: 0 !important;
    box-shadow: none !important;
}

/* Side tab buttons */
{$p} .ha-pro-side-tab {
    display: inline-flex !important; align-items: center !important; padding: 8px 12px !important;
    background: transparent !important; color: #64748b !important; border: 0 !important;
    border-bottom: 2px solid transparent !important; border-radius: 0 !important;
    font-size: .82rem !important; font-weight: 600 !important; cursor: pointer !important;
    transition: all .15s !important; -webkit-appearance: none !important; appearance: none !important;
    font-family: IRANYekan, Vazirmatn, Tahoma, system-ui, sans-serif !important;
    box-sizing: border-box !important; margin: 0 0 -2px !important; outline: 0 !important;
    flex: none !important; white-space: nowrap !important; min-height: 0 !important;
    box-shadow: none !important; line-height: 1 !important; text-decoration: none !important;
}
{$p} .ha-pro-side-tab.is-active { color: #2ec4b6 !important; border-bottom-color: #2ec4b6 !important; }

/* Reset/empty state button */
{$p} .ha-pro-reset {
    display: inline-flex !important; align-items: center !important; gap: 6px !important;
    padding: 10px 22px !important; background: rgba(46,196,182,.12) !important;
    color: #2ec4b6 !important; border: 0 !important; border-radius: 10px !important;
    font-weight: 700 !important; font-size: .875rem !important; cursor: pointer !important;
    transition: all .2s !important; -webkit-appearance: none !important; appearance: none !important;
    font-family: IRANYekan, Vazirmatn, Tahoma, system-ui, sans-serif !important;
    box-sizing: border-box !important; margin: 0 !important; outline: 0 !important;
    flex: none !important; white-space: nowrap !important; min-height: 0 !important;
    box-shadow: none !important; text-decoration: none !important; line-height: 1 !important;
}
{$p} .ha-pro-reset:hover { background: #2ec4b6 !important; color: #fff !important; }

/* Sidebar handle */
{$p} .ha-pro-side-handle {
    display: flex !important; align-items: center !important; justify-content: center !important;
    width: 18px !important; height: 64px !important; padding: 0 !important;
    background: #fff !important; border: 1px solid #dbe5ef !important;
    border-right: 0 !important; border-radius: 8px 0 0 8px !important;
    cursor: pointer !important; -webkit-appearance: none !important; appearance: none !important;
    box-sizing: border-box !important; margin: 0 !important; outline: 0 !important;
    flex: none !important; min-height: 0 !important; box-shadow: -3px 0 10px rgba(1,22,39,.07) !important;
    color: #94a3b8 !important; font-size: .6rem !important; transition: background .2s, color .2s !important;
    line-height: 1 !important; position: absolute !important; top: 50% !important;
    right: var(--ha-side-w, 260px) !important; transform: translateY(-50%) !important;
    z-index: 20 !important;
}
{$p} .ha-pro-side-handle:hover { background: #f8fafc !important; color: #2ec4b6 !important; }
{$p} .ha-pro-frame-stage.is-info-hidden .ha-pro-side-handle { right: 0 !important; border-radius: 8px 0 0 8px !important; }
{$p} .ha-pro-side-handle::before { content: '❮' !important; font-family: system-ui !important; transition: transform .3s !important; display: block !important; }
{$p} .ha-pro-frame-stage.is-info-hidden .ha-pro-side-handle::before { transform: rotate(180deg) !important; }
";
}
