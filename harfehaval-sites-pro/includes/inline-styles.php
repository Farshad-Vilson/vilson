<?php
/**
 * Inline per-instance CSS for complete theme isolation.
 * Specificity: #id .class = (1,1,0) + !important = unbeatable.
 *
 * @package HarfehavalSitesPro
 */

defined( 'ABSPATH' ) || exit;

function ha_sites_pro_inline_styles( $id ) {
	$p = '#' . $id; // prefix
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

/* Modal header buttons */
{$p} .ha-pro-preview-close,
{$p} .ha-pro-preview-info-toggle,
{$p} .ha-pro-preview-open,
{$p} .ha-pro-share-btn {
    -webkit-appearance: none !important;
    appearance: none !important;
    cursor: pointer !important;
    font-family: IRANYekan, Vazirmatn, Tahoma, system-ui, sans-serif !important;
    box-sizing: border-box !important;
    margin: 0 !important;
    text-decoration: none !important;
    outline: 0 !important;
}

{$p} .ha-pro-preview-close {
    display: flex !important; align-items: center !important; justify-content: center !important;
    width: 34px !important; height: 34px !important; padding: 0 !important;
    background: rgba(255,255,255,.1) !important; color: #fff !important;
    border: 0 !important; border-radius: 50% !important;
    font-size: 1.2rem !important; line-height: 1 !important;
    flex: none !important; min-height: 0 !important; box-shadow: none !important;
}
{$p} .ha-pro-preview-close:hover { background: rgba(239,68,68,.5) !important; }

{$p} .ha-pro-preview-devices button {
    display: inline-flex !important; align-items: center !important; justify-content: center !important;
    padding: 7px 12px !important; background: transparent !important;
    color: rgba(255,255,255,.65) !important; border: 0 !important;
    font-size: .78rem !important; font-weight: 700 !important; cursor: pointer !important;
    transition: all .15s !important; white-space: nowrap !important;
    -webkit-appearance: none !important; appearance: none !important;
    box-sizing: border-box !important; line-height: 1 !important;
    flex: none !important; min-height: 0 !important; box-shadow: none !important;
    border-radius: 0 !important; margin: 0 !important;
    font-family: IRANYekan, Vazirmatn, Tahoma, system-ui, sans-serif !important;
    outline: 0 !important;
}
{$p} .ha-pro-preview-devices button.is-active { color: #2ec4b6 !important; background: rgba(46,196,182,.15) !important; }

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
