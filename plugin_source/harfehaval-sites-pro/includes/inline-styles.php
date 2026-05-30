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
    left: 340px !important; right: auto !important; transform: translateY(-50%) !important;
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
    width: 340px !important; max-width: 30vw !important; min-width: 280px !important;
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

/* Star rating buttons — plain glyphs, no box/border/rounding/background */
{$m} .ha-pro-side-rating { border: 0 !important; background: none !important; box-shadow: none !important; padding: 8px 0 !important; }
{$m} .ha-pro-stars .ha-pro-star,
{$m} .ha-pro-side-rating .ha-pro-star {
    background: none !important; border: 0 !important; border-radius: 0 !important;
    box-shadow: none !important; outline: none !important; padding: 0 2px !important;
    margin: 0 !important; min-width: 0 !important; width: auto !important; height: auto !important;
    font-size: 1.25rem !important; line-height: 1 !important; cursor: pointer !important;
    color: #94a3b8 !important; transition: color .12s ease, transform .12s ease !important;
}
{$m} .ha-pro-stars .ha-pro-star.is-filled,
{$m} .ha-pro-side-rating .ha-pro-star.is-filled { color: #f59e0b !important; }
{$m} .ha-pro-stars .ha-pro-star:active,
{$m} .ha-pro-side-rating .ha-pro-star:active { transform: scale(.85) !important; }
{$m} .ha-pro-stars .ha-pro-star:focus,
{$m} .ha-pro-side-rating .ha-pro-star:focus { outline: none !important; box-shadow: none !important; }
{$m} .ha-pro-stars-wrap { display:flex !important; align-items:center !important; gap:6px !important; flex-wrap:wrap !important; }
{$m} .ha-pro-star-hint { font-size:.78rem !important; font-weight:600 !important; color:#64748b !important; min-width:90px !important; transition:color .15s !important; }

/* Side facts — right-aligned RTL layout */
{$m} .ha-pro-side-facts { direction:rtl !important; text-align:right !important; }
{$m} .ha-pro-side-facts li { direction:rtl !important; justify-content:space-between !important; }
{$m} .ha-pro-side-facts span { text-align:right !important; direction:rtl !important; }

/* Meta row: view count + stars compact side-by-side */
{$m} .ha-pro-side-meta-row { display:flex !important; align-items:center !important; justify-content:space-between !important; gap:8px !important; margin-top:8px !important; flex-wrap:wrap !important; padding:0 !important; }
{$m} .ha-pro-side-view-count { display:inline-flex !important; align-items:center !important; gap:4px !important; padding:2px 8px !important; background:rgba(1,22,39,.07) !important; color:#011627 !important; font-size:.72rem !important; font-weight:700 !important; border-radius:999px !important; border:1px solid rgba(1,22,39,.12) !important; white-space:nowrap !important; }
{$m} .ha-pro-side-rating { display:flex !important; align-items:center !important; gap:2px !important; margin-top:0 !important; padding:0 !important; }

/* Side panel action group — new button layout */
{$m} .ha-pro-side-action-group {
    display: flex !important; flex-direction: column !important; gap: 10px !important;
    padding: 14px 20px 24px !important; border-top: 1px solid #e2e8f0 !important; margin-top: 4px !important;
}

/* مشاهده کامل button — white, pill, dark border, 1.5px */
{$m} .ha-pro-side-view-btn {
    display: flex !important; align-items: center !important; justify-content: center !important;
    gap: 8px !important; width: 100% !important; padding: 12px 20px !important;
    background: #ffffff !important; color: #011627 !important;
    border: 1.5px solid #011627 !important; border-radius: 999px !important;
    font-size: .88rem !important; font-weight: 800 !important;
    text-decoration: none !important; cursor: pointer !important;
    transition: background .2s ease, color .2s ease !important;
    box-sizing: border-box !important; font-family: inherit !important;
    line-height: 1 !important; min-height: 44px !important;
}
{$m} .ha-pro-side-view-btn:hover { background: #011627 !important; color: #fff !important; }

/* WhatsApp order button */
{$m} .ha-pro-btn-whatsapp {
    display: flex !important; align-items: center !important; justify-content: center !important;
    gap: 8px !important; width: 100% !important; padding: 12px 20px !important;
    background: #25d366 !important; color: #fff !important;
    border: none !important; border-radius: 999px !important;
    font-size: .88rem !important; font-weight: 800 !important;
    text-decoration: none !important; cursor: pointer !important;
    transition: background .2s ease, transform .2s ease !important;
    box-sizing: border-box !important; font-family: inherit !important;
    line-height: 1 !important; min-height: 44px !important;
    box-shadow: 0 4px 14px rgba(37,211,102,.3) !important;
}
{$m} .ha-pro-btn-whatsapp:hover { background: #1da851 !important; transform: translateY(-2px) !important; color: #fff !important; }

/* Icon inside side panel buttons */
{$m} .ha-pro-side-btn-icon { font-size: 1rem !important; line-height: 1 !important; flex-shrink: 0 !important; }

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
/* Progress bar */
{$m} .ha-pro-progress-bar {
    position: absolute !important; top: 0 !important; left: 0 !important; right: 0 !important;
    height: 3px !important; background: rgba(255,255,255,.15) !important;
    z-index: 10 !important; overflow: hidden !important;
}
{$m} .ha-pro-progress-fill {
    height: 100% !important; width: 0% !important;
    background: linear-gradient(90deg, #2ec4b6, #7dd3fc) !important;
    transition: width .4s ease !important; box-shadow: 0 0 8px rgba(46,196,182,.6) !important;
}
/* Fallback overlay inside iframe */
{$m} .ha-pro-frame-fallback {
    position: absolute !important; inset: 0 !important; display: flex !important;
    align-items: center !important; justify-content: center !important; padding: 24px !important;
    z-index: 3 !important; background: rgba(240,244,248,.85) !important; backdrop-filter: blur(6px) !important;
}
{$m} .ha-pro-frame-fallback-box {
    max-width: 360px !important; background: #fff !important; border: 1px solid #dbe5ef !important;
    border-radius: 20px !important; padding: 32px 28px !important; text-align: center !important;
    box-shadow: 0 24px 64px rgba(1,22,39,.16) !important; box-sizing: border-box !important;
}
{$m} .ha-pro-fallback-icon { font-size: 2.5rem !important; margin-bottom: 14px !important; line-height: 1 !important; display: block !important; }
{$m} .ha-pro-frame-fallback h3 { font-size: 1rem !important; font-weight: 800 !important; color: #011627 !important; margin: 0 0 8px !important; line-height: 1.5 !important; }
{$m} .ha-pro-frame-fallback p  { font-size: .875rem !important; color: #64748b !important; line-height: 1.7 !important; margin: 0 0 20px !important; }
{$m} .ha-pro-fallback-open {
    display: inline-flex !important; align-items: center !important; justify-content: center !important;
    gap: 8px !important; padding: 12px 24px !important;
    background: linear-gradient(135deg,#2ec4b6,#20a49a) !important; color: #fff !important;
    border: 0 !important; border-radius: 12px !important; font-weight: 800 !important;
    font-size: .95rem !important; text-decoration: none !important; transition: all .2s !important;
    box-shadow: 0 6px 20px rgba(46,196,182,.3) !important; width: 100% !important; box-sizing: border-box !important;
    -webkit-appearance: none !important; appearance: none !important; cursor: pointer !important;
    font-family: IRANYekan, Vazirmatn, Tahoma, system-ui, sans-serif !important;
}
{$m} .ha-pro-fallback-open:hover { transform: translateY(-2px) !important; color: #fff !important; }

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

/* ── HOME PORTFOLIO SKIN OVERRIDES v3.3.4 ── */
{$p} .ha-pro-shell { max-width: var(--ha-shell-max, 1220px) !important; width: 100% !important; margin: 0 auto !important; padding: 0 16px 58px !important; }
{$p} .ha-pro-hero { display:block !important; background:transparent !important; border:0 !important; box-shadow:none !important; padding:0 !important; margin:0 0 18px !important; text-align:center !important; }
{$p} .ha-pro-hero::before, {$p} .ha-pro-hero-badge, {$p} .ha-pro-hero-card, {$p} .ha-pro-hero-actions { display:none !important; }
{$p} .ha-pro-hero-content { max-width:820px !important; margin:0 auto !important; }
{$p} .ha-pro-hero h2 { font-size:clamp(17px,1.7vw,22px); font-weight:900; line-height:1.65; color:#011627; margin:0; }
{$p} .ha-pro-hero p { margin:8px auto 0; max-width:720px; font-size:13px; line-height:1.9; color:#5f6b7a; }

{$p} .ha-pro-toolbar { max-width:960px !important; margin:0 auto 18px !important; padding:10px !important; border-radius:14px !important; border:1px solid #e5e7eb !important; background:#fff !important; box-shadow:0 1px 3px rgba(15,23,42,.05) !important; }
{$p} .ha-pro-search { position:relative !important; min-height:42px !important; border:1px solid #e5e7eb !important; background:#f8fafc !important; border-radius:999px !important; padding:0 42px 0 16px !important; gap:0 !important; }
{$p} .ha-pro-search-icon { position:absolute !important; right:16px !important; top:50% !important; transform:translateY(-50%) !important; width:18px !important; height:18px !important; color:#7b8794 !important; }
{$p} .ha-pro-search-input { all:unset !important; display:block !important; width:100% !important; flex:1 !important; padding:10px 0 !important; font-size:13px !important; line-height:1.5 !important; color:#011627 !important; background:transparent !important; border:0 !important; outline:0 !important; box-shadow:none !important; font-family:IRANYekan,Vazirmatn,Tahoma,system-ui,sans-serif !important; direction:rtl !important; }
{$p} .ha-pro-sort { all:unset !important; display:inline-block !important; padding:9px 14px 9px 30px !important; border:1px solid #e5e7eb !important; border-radius:999px !important; font-size:12.5px !important; color:#011627 !important; background:#fff url('data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%2211%22 height=%2211%22 viewBox=%220 0 24 24%22 fill=%22none%22 stroke=%22%23011627%22 stroke-width=%222.5%22 stroke-linecap=%22round%22 stroke-linejoin=%22round%22%3E%3Cpolyline points=%226 9 12 15 18 9%22/%3E%3C/svg%3E') no-repeat 10px center !important; cursor:pointer !important; font-family:IRANYekan,Vazirmatn,Tahoma,system-ui,sans-serif !important; direction:rtl !important; -webkit-appearance:none !important; appearance:none !important; }
{$p} .ha-pro-layout-switcher { border-radius:999px !important; border:1px solid #e5e7eb !important; background:#fff !important; overflow:hidden !important; }
{$p} .ha-pro-layout-switcher button { width:36px !important; height:36px !important; border-radius:0 !important; color:#011627 !important; }
{$p} .ha-pro-layout-switcher button.is-active { background:#011627 !important; color:#fff !important; }

{$p} .ha-pro-filter-panel { background:transparent !important; border:0 !important; box-shadow:none !important; padding:0 !important; margin:0 0 24px !important; gap:10px !important; }
{$p} .ha-pro-filter-row { justify-content:center !important; gap:10px !important; padding-top:0 !important; border-top:0 !important; }
{$p} .ha-pro-filter-row + .ha-pro-filter-row { margin-top:0 !important; padding-top:0 !important; border-top:0 !important; }
{$p} .ha-pro-chip { display:inline-flex !important; align-items:center !important; justify-content:center !important; gap:6px !important; min-height:40px !important; padding:8px 22px !important; border:1.5px solid #d8dee8 !important; border-radius:999px !important; background:#fff !important; color:#011627 !important; font-size:13px !important; font-weight:800 !important; line-height:1 !important; box-shadow:0 2px 8px rgba(15,23,42,.05) !important; transition:all .22s cubic-bezier(.4,0,.2,1) !important; cursor:pointer !important; transform:none !important; }
{$p} .ha-pro-chip:hover { background:#011627 !important; border-color:#011627 !important; color:#fff !important; box-shadow:0 14px 32px rgba(1,22,39,.12) !important; transform:translateY(-2px) !important; }
{$p} .ha-pro-chip.is-active, {$p} .ha-pro-status-chip.is-active { background:#011627 !important; border-color:#011627 !important; color:#fff !important; box-shadow:0 8px 22px rgba(1,22,39,.20) !important; transform:translateY(-1px) !important; }
{$p} .ha-pro-chip small { display:none !important; }

{$p} .ha-pro-grid { gap:26px !important; align-items:stretch !important; }
{$p} .ha-pro-card { background:#fff !important; border:1px solid #e5e7eb !important; border-radius:12px !important; box-shadow:0 1px 3px rgba(15,23,42,.06) !important; padding:12px !important; overflow:visible !important; min-height:100% !important; gap:0 !important; transition:transform .6s ease, box-shadow .6s ease, border-color .5s ease !important; will-change:transform !important; }
{$p} .ha-pro-card:hover { transform:translateY(-4px) !important; border-color:#011627 !important; box-shadow:0 12px 28px rgba(1,22,39,.14) !important; transition:transform .4s ease, box-shadow .4s ease, border-color .3s ease !important; }
{$p} .ha-pro-thumb { height:var(--ha-thumb-h,220px) !important; border-radius:10px !important; border:1px solid #e5e7eb !important; background:#f7f9fc !important; overflow:hidden !important; margin:0 !important; }
{$p} .ha-pro-thumb::after { background:transparent !important; }
{$p} .ha-pro-card-body { padding:18px 0 0 !important; gap:11px !important; }
{$p} .ha-pro-card-title { margin:0 !important; }

{$p} .ha-pro-card-excerpt { -webkit-line-clamp:3; min-height:72px; text-align-last:auto !important; }
{$p} .ha-pro-facts, {$p} .ha-pro-meta, {$p} .ha-pro-card-features { justify-content:center !important; }
{$p} .ha-pro-actions { display:flex !important; flex-direction:row !important; align-items:center !important; gap:10px !important; margin-top:4px !important; width:100% !important; flex-wrap:nowrap !important; }
{$p} .ha-pro-btn, {$p} button.ha-pro-btn, {$p} a.ha-pro-btn { min-height:42px !important; font-weight:900 !important; line-height:1 !important; flex:1 1 0 !important; white-space:nowrap !important; }





{$p} .ha-pro-loadmore { min-width:190px !important; height:46px !important; padding:12px 36px !important; border-radius:999px !important; background:#fff !important; color:#011627 !important; border:1.5px solid #cbd2dc !important; font-size:13px !important; font-weight:900 !important; box-shadow:0 4px 12px rgba(1,22,39,.05) !important; }
{$p} .ha-pro-loadmore:hover { background:#011627 !important; color:#fff !important; border-color:#011627 !important; transform:translateY(-2px) !important; }
{$p} .ha-pro-loadmore-wrap { margin-top:28px !important; }

{$p} .ha-pro-card-tools { top:20px !important; left:20px !important; }
{$p} .ha-pro-tool { width:34px !important; height:34px !important; background:rgba(255,255,255,.94) !important; border:1px solid rgba(1,22,39,.08) !important; box-shadow:0 8px 18px rgba(1,22,39,.10) !important; }

{$p}.ha-sites-pro--list .ha-pro-card { flex-direction:row !important; gap:16px !important; align-items:stretch !important; }
{$p}.ha-sites-pro--list .ha-pro-thumb { width:360px !important; flex:0 0 360px !important; height:230px !important; }
{$p}.ha-sites-pro--list .ha-pro-card-body { padding-top:4px !important; }
{$p}.ha-sites-pro--compact .ha-pro-card { padding:10px !important; }
{$p}.ha-sites-pro--compact .ha-pro-thumb { height:145px !important; }
{$p}.ha-sites-pro--compact .ha-pro-card-excerpt { display:none !important; min-height:0 !important; }
{$p}.ha-sites-pro--compact .ha-pro-card-title { font-size:13px !important; line-height:1.6 !important; }

@media (max-width: 767px) {
    {$p} .ha-pro-filter-row { justify-content:flex-start !important; overflow-x:auto !important; flex-wrap:nowrap !important; padding-bottom:4px !important; scrollbar-width:none !important; }
    {$p} .ha-pro-filter-row::-webkit-scrollbar { display:none !important; }
    {$p} .ha-pro-chip { padding:7px 16px !important; min-height:36px !important; font-size:12px !important; flex:0 0 auto !important; }
    {$p} .ha-pro-actions { flex-direction:row !important; }
    {$p}.ha-sites-pro--list .ha-pro-card { flex-direction:column !important; }
    {$p}.ha-sites-pro--list .ha-pro-thumb { width:100% !important; flex:none !important; height:var(--ha-thumb-h,240px) !important; }
}
@media (max-width: 480px) {
    {$p} .ha-pro-actions { flex-direction:column !important; }
    {$p} .ha-pro-btn { width:100% !important; }
}

/* Modal final polish */
{$m} .ha-pro-preview-header { height:58px !important; background:#011627 !important; padding:10px 18px !important; gap:12px !important; }
{$m} .ha-pro-preview-devices { border-radius:10px !important; background:rgba(255,255,255,.08) !important; }
{$m} .ha-pro-preview-devices button { border-radius:0 !important; font-size:12px !important; font-weight:800 !important; padding:8px 12px !important; }
{$m} .ha-pro-preview-devices button.is-active { background:#2ec4b6 !important; color:#011627 !important; }
{$m} .ha-pro-frame-wrap { padding:12px !important; background:#edf2f7 !important; }
{$m} .ha-pro-frame-wrap iframe { border-radius:10px !important; border:1px solid #e5e7eb !important; box-shadow:0 8px 40px rgba(1,22,39,.18) !important; }



{$p} .ha-pro-preview-helper { display:flex !important; align-items:flex-start !important; gap:10px !important; background:#eef6ff !important; border:1px solid #d7e3f2 !important; color:#27405d !important; padding:12px 16px !important; border-radius:14px !important; margin:0 auto 16px !important; max-width:960px !important; line-height:1.9 !important; font-size:13px !important; }
{$p} .ha-pro-preview-helper-icon { flex:0 0 auto !important; font-size:16px !important; line-height:1.7 !important; }
{$p} .ha-pro-inline-helper, {$m} .ha-pro-inline-helper { display:flex !important; gap:10px !important; align-items:flex-start !important; margin:16px 20px 0 !important; padding:10px 12px !important; border-radius:12px !important; background:#eef6ff !important; border:1px solid #d7e3f2 !important; color:#27405d !important; font-size:12.5px !important; line-height:1.9 !important; }
{$p} .ha-pro-rating-badge { position:absolute !important; left:12px !important; bottom:12px !important; display:inline-flex !important; align-items:center !important; gap:4px !important; padding:6px 10px !important; border-radius:999px !important; background:rgba(1,22,39,.88) !important; color:#fff !important; font-size:12px !important; font-weight:800 !important; z-index:3 !important; box-shadow:0 8px 18px rgba(1,22,39,.18) !important; }
{$m} .ha-pro-frame-fallback-box p { line-height:1.9 !important; }

/* CRITICAL: respect HTML [hidden] attribute — modal must not cover page when closed */
{$m}[hidden] { display:none !important; }


/* v3.3.6 final instance fixes */

{$m} .ha-pro-preview-side { overflow-y:scroll !important; overscroll-behavior:contain !important; -webkit-overflow-scrolling:touch !important; touch-action:pan-y !important; pointer-events:auto !important; }
{$m} .ha-pro-preview-title span { white-space:normal !important; line-height:1.75 !important; max-width:680px !important; color:rgba(255,255,255,.78) !important; }
{$p} .ha-pro-thumb img { image-rendering:auto !important; filter:none !important; backface-visibility:hidden !important; }
{$p} .ha-pro-shell { max-width:var(--ha-shell-max,100%) !important; }



{$p} .ha-pro-btn-primary { background:#011627 !important; color:#fff !important; border:1.5px solid #011627 !important; box-shadow:0 4px 12px rgba(1,22,39,.10) !important; }
{$p} .ha-pro-btn-primary:hover { background:#0d2742 !important; border-color:#0d2742 !important; color:#fff !important; box-shadow:0 8px 18px rgba(1,22,39,.18) !important; }
{$p} .ha-pro-btn-secondary { position:relative !important; background:#fff !important; color:#011627 !important; border:1.5px solid #cbd2dc !important; box-shadow:0 4px 12px rgba(1,22,39,.05) !important; padding-inline-start:50px !important; padding-inline-end:18px !important; }
{$p} .ha-pro-btn-secondary::before { content:'\2190' !important; position:absolute !important; inset-inline-start:10px !important; top:50% !important; transform:translateY(-50%) !important; width:24px !important; height:24px !important; border-radius:999px !important; background:#011627 !important; color:#fff !important; display:inline-flex !important; align-items:center !important; justify-content:center !important; font-size:12px !important; line-height:1 !important; transition:transform .28s ease, inset-inline-start .28s ease, box-shadow .28s ease !important; box-shadow:0 4px 10px rgba(1,22,39,.18) !important; }
{$p} .ha-pro-btn-secondary:hover { border-color:#011627 !important; color:#011627 !important; background:#fff !important; transform:translateY(-2px) !important; }
{$p} .ha-pro-btn-secondary:hover::before { transform:translateY(-50%) translateX(-4px) !important; box-shadow:0 8px 16px rgba(1,22,39,.22) !important; }



/* v3.3.8 old +P-HA button correction */
{$p} .ha-pro-actions { direction:rtl !important; }
{$p} .ha-pro-actions .ha-pro-btn-secondary { position:relative !important; border:1.5px solid #011627 !important; background:#fff !important; color:#011627 !important; padding-right:46px !important; padding-left:18px !important; overflow:hidden !important; }
{$p} .ha-pro-actions .ha-pro-btn-secondary::before { content:none !important; display:none !important; }
{$p} .ha-pro-actions .ha-pro-btn-secondary::after { content:'←' !important; position:absolute !important; right:8px !important; top:50% !important; width:26px !important; height:26px !important; border-radius:999px !important; background:#011627 !important; color:#fff !important; display:inline-flex !important; align-items:center !important; justify-content:center !important; font-size:13px !important; line-height:1 !important; transform:translateY(-50%) !important; transition:transform .28s ease !important; box-shadow:0 3px 8px rgba(1,22,39,.16) !important; }
{$p} .ha-pro-actions .ha-pro-btn-secondary:hover::after { transform:translateY(-50%) translateX(-5px) !important; }
{$p} .ha-pro-actions .ha-pro-btn-primary { background:#011627 !important; border:1.5px solid #011627 !important; color:#fff !important; }
{$p} .ha-pro-thumb img { object-fit:cover !important; object-position:top center !important; filter:none !important; opacity:1 !important; }



/* v3.3.9 mobile drawer and reliable arrow button */
{$p} .ha-pro-btn-secondary::before { content:none !important; display:none !important; }
{$p} .ha-pro-btn-primary { border-radius:var(--ha-btn1-radius,999px) !important; }
{$p} .ha-pro-btn-secondary { position:relative !important; display:inline-flex !important; align-items:center !important; justify-content:center !important; gap:8px !important; border-radius:var(--ha-btn2-radius,999px) !important; padding-inline-start:50px !important; padding-inline-end:18px !important; overflow:hidden !important; }
{$p} .ha-pro-btn-secondary .ha-pro-btn-text { position:relative !important; z-index:2 !important; }
{$p} .ha-pro-btn-secondary .ha-pro-btn-arrow { position:absolute !important; inset-inline-start:8px !important; top:50% !important; transform:translateY(-50%) !important; width:24px !important; height:24px !important; border-radius:999px !important; background:#011627 !important; color:#fff !important; display:inline-flex !important; align-items:center !important; justify-content:center !important; line-height:1 !important; font-size:13px !important; font-family:Tahoma,Arial,sans-serif !important; transition:transform .28s ease, box-shadow .28s ease, background .28s ease !important; z-index:2 !important; }
{$p} .ha-pro-btn-secondary:hover .ha-pro-btn-arrow { transform:translateY(-50%) translateX(-4px) !important; box-shadow:0 8px 16px rgba(1,22,39,.22) !important; }
@media (max-width:768px){
/* Header: single compact flex row — device switcher hidden */
{$m} .ha-pro-preview-header { height:54px !important; min-height:54px !important; max-height:54px !important; padding:0 10px !important; display:flex !important; flex-direction:row !important; align-items:center !important; gap:6px !important; flex-wrap:nowrap !important; overflow:hidden !important; }
{$m} .ha-pro-preview-title { flex:1 1 0 !important; min-width:0 !important; display:flex !important; flex-direction:column !important; justify-content:center !important; overflow:hidden !important; }
{$m} .ha-pro-preview-title strong { font-size:12px !important; line-height:1.4 !important; white-space:nowrap !important; overflow:hidden !important; text-overflow:ellipsis !important; }
{$m} .ha-pro-preview-title span { font-size:10px !important; line-height:1.3 !important; white-space:nowrap !important; overflow:hidden !important; text-overflow:ellipsis !important; color:rgba(255,255,255,.6) !important; max-width:100% !important; display:block !important; }
/* Hide device switcher buttons (دسکتاپ/تبلت/موبایل) on mobile */
{$m} .ha-pro-preview-devices { display:none !important; }
{$m} .ha-pro-preview-actions { flex-shrink:0 !important; display:flex !important; gap:4px !important; align-items:center !important; }
{$m} .ha-pro-preview-open { font-size:10px !important; padding:5px 8px !important; white-space:nowrap !important; border-radius:6px !important; }
{$m} .ha-pro-preview-close { flex-shrink:0 !important; width:30px !important; height:30px !important; border-radius:8px !important; background:rgba(239,68,68,.9) !important; color:#fff !important; font-size:20px !important; }
{$m} .ha-pro-frame-stage { position:relative !important; display:block !important; overflow:hidden !important; min-height:0 !important; }
{$m} .ha-pro-frame-wrap { position:absolute !important; inset:0 !important; padding:8px !important; display:flex !important; }
{$m} .ha-pro-frame-wrap iframe { width:100% !important; height:100% !important; border-radius:12px !important; }
{$m} .ha-pro-preview-side { position:absolute !important; inset:0 !important; width:100% !important; height:100% !important; max-width:none !important; min-width:0 !important; border:0 !important; border-radius:0 !important; background:#fff !important; box-shadow:0 -16px 42px rgba(1,22,39,.18) !important; transform:translateY(0) !important; opacity:1 !important; pointer-events:auto !important; z-index:50 !important; overflow-y:auto !important; -webkit-overflow-scrolling:touch !important; padding-bottom:82px !important; transition:transform .4s cubic-bezier(.32,1,.4,1), opacity .3s ease !important; }
{$m} .ha-pro-frame-stage.is-info-hidden .ha-pro-preview-side { transform:translateY(100%) !important; opacity:0 !important; pointer-events:none !important; }
{$m} .ha-pro-side-handle { position:absolute !important; right:50% !important; left:auto !important; top:auto !important; bottom:20px !important; transform:translateX(50%) !important; width:auto !important; min-width:150px !important; height:44px !important; padding:0 20px !important; border-radius:999px !important; background:#011627 !important; color:#fff !important; border:1px solid rgba(255,255,255,.28) !important; box-shadow:0 10px 24px rgba(1,22,39,.22) !important; z-index:70 !important; font-size:13px !important; font-weight:900 !important; display:flex !important; align-items:center !important; justify-content:center !important; }
/* جزئیات پروژه text — explicitly override rotate(180deg) from desktop rule */
{$m} .ha-pro-side-handle::before { content:'جزئیات پروژه' !important; transform:none !important; font-family:inherit !important; display:block !important; font-size:13px !important; font-weight:900 !important; }
{$m} .ha-pro-frame-stage.is-info-hidden .ha-pro-side-handle { transform:translateX(50%) !important; right:50% !important; left:auto !important; bottom:20px !important; top:auto !important; min-width:150px !important; width:auto !important; height:44px !important; padding:0 20px !important; border-radius:999px !important; background:#011627 !important; }
{$m} .ha-pro-frame-stage.is-info-hidden .ha-pro-side-handle::before { content:'جزئیات پروژه' !important; transform:none !important; font-size:13px !important; font-weight:900 !important; }
{$m} .ha-pro-frame-stage:not(.is-info-hidden) .ha-pro-side-handle { right:auto !important; left:14px !important; top:14px !important; bottom:auto !important; transform:none !important; min-width:42px !important; width:42px !important; height:42px !important; padding:0 !important; border-radius:12px !important; background:#ef4444 !important; color:#fff !important; }
{$m} .ha-pro-frame-stage:not(.is-info-hidden) .ha-pro-side-handle::before { content:'×' !important; font-size:24px !important; line-height:1 !important; transform:none !important; }
}

/* ── v3.4.0 fixes ── */

/* Fix 1: Arrow swipe animation for preview button */
@keyframes ha-arrow-swipe {
  0%   { transform: translateY(-50%) translateX(0);    opacity: 1; }
  40%  { transform: translateY(-50%) translateX(-120%); opacity: 0; }
  41%  { transform: translateY(-50%) translateX(120%);  opacity: 0; }
  100% { transform: translateY(-50%) translateX(0);    opacity: 1; }
}
{$p} .ha-pro-btn-secondary:hover .ha-pro-btn-arrow { animation: ha-arrow-swipe 0.55s ease forwards !important; }

/* Fix 3: Desktop sidebar 340px — only on desktop */
@media (min-width:769px){
{$m} .ha-pro-preview-side { width:340px !important; max-width:340px !important; min-width:260px !important; }
{$m} .ha-pro-side-handle { left:340px !important; }
{$m} .ha-pro-frame-stage.is-info-hidden .ha-pro-side-handle { left:0 !important; }
}

/* Fix 6: Blocked iframe fallback mobile */
@media (max-width: 768px) {
  {$m} .ha-pro-frame-fallback { padding:16px !important; align-items:flex-start !important; padding-top:40px !important; }
  {$m} .ha-pro-frame-fallback-box { max-width:100% !important; padding:24px 20px !important; }
  {$m} .ha-pro-frame-fallback h3 { font-size:.9rem !important; }
  {$m} .ha-pro-frame-fallback p  { font-size:.8rem !important; }
}

";
}
