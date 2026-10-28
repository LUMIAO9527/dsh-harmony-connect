window.__ModuleLoader__.load({
  id: 'dsh-harmony-connect',
  factory(require) {
    const React = require('react');
    const { createRoot } = require('react-dom/client');
    const { FishLogo } = require('@deepseek-ai/dsh-client-ui-primitives');
    const { createElement: h, useState, useEffect, useRef } = React;
    const COMPUTER_KEY = 'dsh-harmony-connect.computers.v1';
    function parseConnectionAddress(input) {
      const value = input.trim();
      if (!value || value.length > 8192 || /[\u0000-\u0020\u007f]/.test(value)) throw new Error('invalid_address');
      const parsed = new URL(value);
      const local = ['localhost', '127.0.0.1', '[::1]'].includes(parsed.hostname);
      if (parsed.username || parsed.password || (parsed.protocol !== 'https:' && !(parsed.protocol === 'http:' && local))) throw new Error('invalid_address');
      if (parsed.pathname === '/' || parsed.pathname === '/index.html') parsed.searchParams.set('frontend', 'stock');
      const pairing = parsed.pathname === '/mobile-access/pair';
      const saved = new URL(parsed.origin + (pairing ? '/' : parsed.pathname));
      if (pairing || parsed.searchParams.get('frontend') === 'stock') saved.searchParams.set('frontend', 'stock');
      return { entry: parsed.href, saved: saved.href };
    }
    function readComputers(storage) {
      try {
        const raw = storage.getItem(COMPUTER_KEY) || '[]';
        if (raw.length > 131072) return [];
        const rows = JSON.parse(raw);
        if (!Array.isArray(rows)) return [];
        const clean = [];
        for (const row of rows.slice(0, 40)) {
          if (!row || typeof row.id !== 'string' || typeof row.name !== 'string' || typeof row.address !== 'string') continue;
          try { clean.push({ id:row.id, name:row.name.slice(0,40), address:parseConnectionAddress(row.address).saved }); } catch {}
          if (clean.length >= 20) break;
        }
        return clean;
      } catch { return []; }
    }
    function saveComputers(storage, rows) {
      const clean = rows.map(row => ({ id:row.id, name:row.name.slice(0,40), address:parseConnectionAddress(row.address).saved }));
      if (clean.length > 20) throw new Error('computer_limit');
      storage.setItem(COMPUTER_KEY, JSON.stringify(clean));
    }
    const CSS = `
      .dhc-nav-backdrop,.dhc-quick-nav { display:none }
      .dhc-settings { max-width:620px;padding-block:8px 20px;color:var(--dsw-alias-label-primary);line-height:1.6 }
      .dhc-settings h3 { margin:0 0 8px;font-size:17px;font-weight:600 }
      .dhc-settings p { color:var(--dsw-alias-label-secondary);margin:0 0 16px }
      .dhc-settings .dhc-button { width:auto;min-width:160px;background:var(--dsw-alias-button-info-fill,#0a59f7);color:var(--dsw-alias-label-primary-foreground,#fff) }
      .dhc-icon { display:block;width:22px;height:22px;flex:none;fill:none;stroke:currentColor;stroke-width:1.7;stroke-linecap:round;stroke-linejoin:round }
      .dhc-dialog-layer { position:fixed;inset:0 0 auto;height:var(--dhc-visible-height,100dvh);z-index:1000;display:grid;place-items:center;box-sizing:border-box;padding:24px;isolation:isolate;background:rgba(0,0,0,.32);pointer-events:auto }
      .dhc-dialog { --dhc-secondary:var(--dsw-alias-label-secondary,#737780);--dhc-surface:var(--dsw-alias-interactive-bg-hover,#f2f3f5);--dhc-border:var(--dsw-alias-border-l2,#e3e5e8);--dhc-accent:var(--dsw-alias-button-info-fill,#0a59f7);width:min(100%,480px);max-height:min(760px,100%);min-height:0;display:flex;flex-direction:column;box-sizing:border-box;border:1px solid var(--dhc-border);border-radius:28px;background:var(--dsw-alias-bg-base,#fff);color:var(--dsw-alias-label-primary,#191b1f);box-shadow:0 18px 64px rgba(0,0,0,.2);overflow:hidden;font-size:14px;line-height:1.5;animation:dhc-appear .18s ease-out }
      .dhc-dialog header { flex:none;display:flex;align-items:center;gap:8px;padding:16px 18px 8px }
      .dhc-dialog h2 { margin:0;flex:1;min-width:0;font-size:21px;line-height:1.4;font-weight:600;letter-spacing:.01em }
      .dhc-icon-button { display:flex;align-items:center;justify-content:center;flex:none;width:44px;height:44px;padding:10px;border:0;border-radius:50%;background:transparent;color:var(--dhc-secondary);font:inherit;cursor:pointer;touch-action:manipulation }
      .dhc-dialog-content { min-height:0;padding:4px 24px 24px;overflow:auto;overscroll-behavior:contain;scrollbar-gutter:stable;scroll-padding-block:16px }
      .dhc-caption { margin:0 0 20px;color:var(--dhc-secondary);font-size:13px;line-height:1.65 }
      .dhc-section-title { margin:22px 0 10px;font-size:13px;font-weight:500;color:var(--dhc-secondary) }
      .dhc-computer { box-sizing:border-box;border:1px solid var(--dhc-border);border-radius:20px;padding:16px;margin:0 0 12px;min-width:0 }
      .dhc-computer-top { display:flex;gap:12px;align-items:center;min-width:0 }
      .dhc-computer-icon { display:grid;place-items:center;width:44px;height:44px;flex:none;background:var(--dhc-surface);border-radius:14px;color:var(--dhc-secondary) }
      .dhc-computer-info { min-width:0;flex:1 }
      .dhc-computer strong { display:block;font-size:15px;line-height:1.4;font-weight:600;overflow-wrap:anywhere }
      .dhc-origin { margin-top:4px;color:var(--dhc-secondary);font-size:12px;line-height:1.6;overflow-wrap:anywhere;word-break:break-word }
      .dhc-badge { display:inline-flex;align-items:center;max-width:100%;margin-top:8px;padding:3px 9px;border-radius:20px;background:var(--dhc-surface);color:var(--dhc-secondary);font-size:11px;line-height:1.5 }
      .dhc-button { display:flex;align-items:center;justify-content:center;gap:8px;min-height:48px;border:1px solid transparent;border-radius:999px;width:100%;padding:11px 16px;color:inherit;background:var(--dhc-surface);font:inherit;font-size:14px;font-weight:500;line-height:1.5;cursor:pointer;box-sizing:border-box;touch-action:manipulation;transition:background-color .15s,opacity .15s,transform .15s }
      .dhc-button + .dhc-button { margin-top:10px }
      .dhc-button:disabled,.dhc-icon-button:disabled { cursor:default;opacity:.5 }
      .dhc-button:active:not(:disabled),.dhc-icon-button:active { transform:scale(.985) }
      .dhc-primary { background:var(--dhc-accent);color:var(--dsw-alias-label-primary-foreground,#fff) }
      .dhc-outline { border-color:var(--dhc-border);background:transparent }
      .dhc-computer>.dhc-button,.dhc-pair-card>.dhc-button { margin-top:16px }
      .dhc-computer-actions { display:flex;align-items:center;gap:8px;margin-top:16px }
      .dhc-computer-actions>.dhc-button { flex:1 }
      .dhc-computer-actions>.dhc-icon-button { border:1px solid var(--dhc-border) }
      .dhc-field { display:flex;flex-direction:column;gap:9px;margin:0 0 18px;font-size:13px;font-weight:500 }
      .dhc-field input,.dhc-pair-link { min-width:0;width:100%;box-sizing:border-box;min-height:50px;padding:12px 14px;background:var(--dhc-surface);border:1px solid transparent;border-radius:16px;color:inherit;font:inherit;font-size:16px;font-weight:400;line-height:1.5 }
      .dhc-field input::placeholder { color:var(--dhc-secondary);opacity:.85 }
      .dhc-field input[aria-invalid=true] { border-color:var(--dsw-alias-state-error-primary,#c8423c) }
      .dhc-field:focus-within>span { color:var(--dhc-accent) }
      .dhc-dialog :is(button,input):focus-visible { outline:2px solid var(--dsw-alias-state-business-primary,#0a59f7);outline-offset:3px }
      .dhc-message { display:flex;align-items:flex-start;gap:9px;margin:12px 0 16px;padding:12px 14px;border-radius:14px;background:var(--dhc-surface);font-size:12px;line-height:1.65;color:var(--dhc-secondary);overflow-wrap:anywhere }
      .dhc-message .dhc-icon { width:18px;height:18px;margin-top:1px }
      .dhc-message[data-tone=error] { color:var(--dsw-alias-state-error-primary,#c8423c);background:color-mix(in srgb,var(--dsw-alias-state-error-primary,#c8423c) 9%,transparent) }
      .dhc-message[data-tone=success] { color:var(--dsw-alias-state-success-primary,#20945e);background:color-mix(in srgb,var(--dsw-alias-state-success-primary,#20945e) 9%,transparent) }
      .dhc-pair-card { padding:18px;background:var(--dhc-surface);border-radius:22px }
      .dhc-pair-card h3 { margin:0 0 6px;font-size:16px;font-weight:600 }
      .dhc-pair-card .dhc-caption { margin-bottom:0 }
      .dhc-pair-card .dhc-button:not(.dhc-primary) { border-color:var(--dhc-border);background:transparent }
      .dhc-qr { display:block;width:min(216px,100%);height:auto;aspect-ratio:1;box-sizing:border-box;background:white;margin:18px auto 12px;border-radius:16px;padding:12px }
      .dhc-pair-expiry { margin:8px 0 14px;text-align:center;color:var(--dhc-secondary);font-size:12px;font-variant-numeric:tabular-nums }
      .dhc-pair-link { font-size:12px;min-height:44px;border:1px solid var(--dhc-border);border-radius:12px;background:var(--dsw-alias-bg-base,#fff) }
      .dhc-form-actions { display:flex;flex-direction:column;gap:10px;margin-top:22px }
      .dhc-form-actions .dhc-button+.dhc-button { margin-top:0 }
      @media(hover:hover) {
        .dhc-icon-button:hover { background:var(--dsw-alias-interactive-bg-hover,#f2f3f5) }
        .dhc-button:hover:not(:disabled) { opacity:.88 }
      }
      @keyframes dhc-appear { from { opacity:0;transform:translateY(10px) scale(.985) } to { opacity:1;transform:translateY(0) scale(1) } }
      @media(max-width:767px) {
        html[data-dhc-enabled] { --dsh-composer-side-clearance:12px;font-family:"HarmonyOS Sans SC","HarmonyOS Sans",system-ui,sans-serif }
        [data-dhc-frame] { grid-template-columns:minmax(0,1fr) 0 0!important;height:var(--dhc-visible-height,100dvh)!important;box-sizing:border-box }
        [data-dhc-frame]>[data-dhc-center] { grid-area:1/1;min-width:0 }
        [data-dhc-frame]>[data-dhc-sidebar] { position:absolute;inset:0 auto 0 0;width:min(88vw,320px)!important;height:100%;z-index:30;border:0;box-shadow:none;transition:transform .22s ease;transform:translateX(-110%);visibility:hidden;pointer-events:none }
        [data-dhc-frame]:not([data-sidebar-collapsed])>[data-dhc-sidebar] { transform:none;visibility:visible;pointer-events:auto;border-radius:0 24px 24px 0;background:var(--dsw-specific-sidebar-fill,var(--dsw-alias-bg-base)) }
        [data-dhc-frame] [data-dhc-sidebar] button { min-width:44px;min-height:44px;touch-action:manipulation }
        [data-dhc-frame] [data-dhc-sidebar] [data-window-drag] { min-height:44px }
        [data-dhc-frame] [data-dhc-sidebar] [data-slot="sidebar"]>div { width:100%!important;max-width:100%;box-sizing:border-box }
        .dhc-quick-nav { display:flex;align-items:center;justify-content:center;position:fixed;left:max(8px,env(safe-area-inset-left,0px));top:max(6px,env(safe-area-inset-top,0px));width:44px;height:44px;z-index:26;padding:10px;border:0;border-radius:16px;background:transparent;color:var(--dsw-alias-label-primary,#222);cursor:pointer;touch-action:manipulation;-webkit-touch-callout:none;user-select:none }
        html[data-dhc-navigation-open] .dhc-quick-nav { visibility:hidden;pointer-events:none }
        .dhc-quick-nav:active { background:var(--dsw-alias-interactive-bg-hover) }
        .dhc-quick-nav:focus-visible { outline:2px solid var(--dsw-alias-state-business-primary,#0a59f7);outline-offset:1px }
        [data-dhc-frame] [data-dhc-chat-header] { padding:4px 8px 0 48px!important;margin:0!important;width:100%!important;max-width:100%;box-sizing:border-box;position:relative;grid-template-columns:minmax(0,1fr)!important;row-gap:0!important;background:var(--dsw-alias-bg-base) }
        [data-dhc-frame] [data-conversation-header-leading] { display:none!important }
        [data-dhc-frame] [data-dhc-title-row] { grid-column:1!important;grid-row:1!important;min-height:48px!important;height:auto!important;width:100%;padding-inline:8px;box-sizing:border-box;min-width:0;align-items:center }
        [data-dhc-frame] [data-dhc-title-cluster] { min-width:0;flex:1 }
        [data-dhc-frame] [data-dhc-title-actions] { flex-shrink:0;height:44px;display:flex;align-items:center;gap:4px }
        [data-dhc-frame] [data-dhc-chat-header][data-dhc-has-tabs] [data-dhc-title-actions] { position:absolute;top:52px;right:8px;max-width:52% }
        [data-dhc-frame] [data-dhc-title-actions] button { max-width:100%;font-size:12px;white-space:nowrap }
        [data-dhc-frame] [data-dhc-tabs-row] { grid-column:1!important;min-height:44px!important;height:auto!important;padding-bottom:0!important;padding-right:64px;margin-left:-40px;width:calc(100% + 40px);box-sizing:border-box;align-items:center;flex-wrap:nowrap;gap:8px }
        [data-dhc-frame] [data-dhc-chat-header] [data-open-target] { display:none }
        [data-dhc-frame] [data-phase] header nav { min-width:0;overflow:hidden;white-space:nowrap;text-overflow:ellipsis }
        [data-dhc-frame] [data-phase] header nav span { min-width:0;max-width:100%;overflow:hidden;text-overflow:ellipsis }
        [data-dhc-frame] [data-conversation-tabs] { min-width:0;overflow-x:auto;flex-wrap:nowrap;scrollbar-width:none;gap:16px }
        [data-dhc-frame] [data-conversation-tabs] [role="tab"] { min-height:44px;padding-inline:12px;flex:none;font-size:14px }
        [data-dhc-frame][data-dhc-main-panel]>[data-dhc-center] { padding-top:52px;box-sizing:border-box }
        [data-dhc-frame]>[data-rightbar-col] { position:absolute;inset:0;width:100%!important;height:100%;z-index:28;background:var(--dsw-alias-bg-base) }
        [data-dhc-frame][data-rightbar-collapsed]:not([data-rightbar-fullscreen])>[data-rightbar-col] { display:none }
        [data-dhc-frame][data-rightbar-fullscreen]>[data-rightbar-col] { display:block;inset:0;width:100%!important;z-index:35 }
        [data-dhc-frame]>.dhc-nav-backdrop[data-open] { display:block;position:absolute;inset:0;z-index:27;border:0;padding:0;border-radius:0;background:rgba(0,0,0,.28);cursor:pointer;touch-action:manipulation }
        [data-dhc-frame] [data-shell-overlay] { z-index:40 }
        [data-dhc-frame] [data-dhc-chat-body] { padding-inline:12px!important;box-sizing:border-box;min-width:0 }
        [data-dhc-frame] [data-dhc-chat-scroll] { scrollbar-gutter:auto!important;margin-right:0!important;min-width:0 }
        [data-dhc-frame] [data-dhc-composer-stack] { padding-inline:0!important }
        [data-dhc-frame] [data-dhc-composer-root] { padding-inline:0!important;min-width:0 }
        [data-dhc-frame] [data-composer-card] { border-radius:24px;max-width:100%;box-sizing:border-box }
        [data-dhc-frame] [data-composer-input] { min-height:48px;font-size:max(16px,var(--dsh-content-font-size,14px));line-height:1.55;font-family:"HarmonyOS Sans SC","HarmonyOS Sans",system-ui,sans-serif }
        [data-dhc-frame] [data-composer-card] button { min-height:44px;min-width:36px }
        [data-dhc-frame] [data-composer-card] button[aria-label] { min-width:44px }
        html[data-dhc-enabled] [data-composer-card] [data-model-compact] { --dsh-composer-model-text-display:block;--dsh-composer-model-icon-display:none;column-gap:8px }
        html[data-dhc-enabled] [data-composer-card] button[aria-haspopup="menu"]:has([data-model-id]) { max-width:clamp(72px,calc(100vw - 280px),134px) }
        html[data-dhc-enabled] [data-composer-card] button[aria-haspopup="menu"]>span:has([data-model-id]) { min-width:0;max-width:100px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap }
        [data-dhc-frame] [data-composer-seat] { padding:0 0 max(8px,env(safe-area-inset-bottom,0px))!important;min-width:0 }
        [data-dhc-frame] [data-dhc-center] header button { min-width:44px;min-height:44px;touch-action:manipulation }
        [data-dhc-frame] [data-rightbar-col] button[aria-label],[data-dhc-frame] [data-rightbar-col] [role="tab"] { min-width:44px;min-height:44px;touch-action:manipulation }
        html[data-dhc-enabled] [role="menu"] { max-inline-size:calc(100vw - 24px);max-height:min(68dvh,520px);padding:6px;border-radius:20px;overscroll-behavior:contain }
        html[data-dhc-enabled] [role="menuitem"] { min-height:44px;padding:10px 12px;border-radius:12px;font-size:15px;line-height:1.4;touch-action:manipulation }
        .dhc-dialog-layer { align-items:end;padding:max(10px,env(safe-area-inset-top,0px)) max(10px,env(safe-area-inset-right,0px)) max(10px,env(safe-area-inset-bottom,0px)) max(10px,env(safe-area-inset-left,0px)) }
        .dhc-dialog { width:100%;max-height:100%;border-radius:26px }
        .dhc-dialog header { padding:12px 12px 6px }
        .dhc-dialog h2 { font-size:20px }
        .dhc-dialog-content { padding:4px 18px max(20px,env(safe-area-inset-bottom,0px)) }
        .dhc-pair-card { padding:16px }
      }
      @media(min-width:768px) and (pointer:coarse) {
        [data-dhc-frame] [data-composer-card] { border-radius:24px }
        [data-dhc-frame] [data-composer-input] { font-size:max(16px,var(--dsh-content-font-size,14px)) }
        [data-dhc-frame] [data-dhc-center] header button,[data-dhc-frame] [data-composer-card] button[aria-label] { min-height:44px;min-width:44px }
      }
      @media(pointer:coarse) {
        html[data-dhc-enabled] [data-turn-tail][data-actions-reveal] [data-clock="end"] { min-height:44px;height:auto;flex-wrap:wrap;gap:2px }
        html[data-dhc-enabled] [data-turn-tail][data-actions-reveal] [data-clock="end"] button { min-width:44px;min-height:44px;height:auto;touch-action:manipulation }
      }
      @media(max-width:767px) {
        html[data-dhc-navigation-open] .dsh-pet-root { visibility:hidden }
      }
      @media(max-height:480px) { .dhc-dialog-layer { padding:8px } .dhc-dialog { border-radius:20px } .dhc-dialog header { padding-block:8px 4px } .dhc-dialog-content { padding-bottom:16px } }
      @media(prefers-reduced-motion:reduce) { .dhc-dialog { animation:none;scroll-behavior:auto } .dhc-button { transition:none } }

      .dhc-inline{--dhc-secondary:var(--dsw-alias-label-secondary,#737780);--dhc-surface:var(--dsw-alias-interactive-bg-hover,#f2f3f5);--dhc-border:var(--dsw-alias-border-l2,#e3e5e8);--dhc-accent:var(--dsw-alias-button-info-fill,#0a59f7);min-width:0}
      .dhc-inline .dhc-dialog-content{padding:0;overflow:visible;scrollbar-gutter:auto}
      .dhc-inline .dhc-pair-card{padding:0;background:transparent}
      .dhc-inline .dhc-pair-card>h3{font-size:15px;margin-top:22px}
      .dhc-settings .dhc-inline .dhc-button{min-width:0;width:100%;color:inherit;background:var(--dhc-surface)}
      .dhc-settings .dhc-inline .dhc-primary{background:var(--dhc-accent);color:var(--dsw-alias-label-primary-foreground,#fff)}
      .dhc-inline .dhc-pair-link{display:block;margin-top:12px}
      .dhc-inline .dhc-qr{width:min(208px,100%);margin-inline:0}
      .dhc-inline .dhc-pair-expiry{text-align:start}
      @media(max-width:767px){
        [data-dhc-frame]{grid-template-rows:minmax(0,1fr) auto!important;min-height:0!important;max-height:100dvh!important;padding-top:0!important}
        [data-dhc-frame]>[data-dhc-center]{min-height:0;display:flex;flex-direction:column}
        [data-dhc-center] [data-slot="main.conversation"]{display:flex;flex:1;min-height:0;min-width:0}
        [data-dhc-center] [data-slot="main.conversation"]>[data-phase]{flex:1;min-height:0;min-width:0}
        [data-dhc-center] [data-slot="conversation.header"]{display:block;flex:none;position:relative;z-index:3;background:var(--dsw-alias-bg-base)}
        [data-dhc-center] [data-slot="conversation.content"]{display:flex;flex:1;min-height:0;min-width:0}
        [data-dhc-center] [data-conversation-content]{min-height:0;min-width:0}
        [data-dhc-frame] [data-dhc-chat-header]{display:grid!important;grid-template-columns:minmax(0,1fr)!important;grid-auto-rows:auto;min-height:0!important;flex:none;padding:4px 10px 0 52px!important;z-index:3;isolation:isolate;background:var(--dsw-alias-bg-base);overflow:hidden}
        [data-dhc-frame] [data-dhc-title-row]{position:relative;grid-row:1;grid-column:1;min-height:48px!important;min-width:0;padding:0!important;container-type:normal}
        [data-dhc-frame] [data-dhc-title-cluster]{min-width:0;overflow:hidden}
        [data-dhc-frame] [data-dhc-title-cluster]>nav{flex:1;min-width:0;max-width:100%;overflow:hidden}
        [data-dhc-frame] [data-dhc-title-actions], [data-dhc-frame] [data-dhc-chat-header][data-dhc-has-tabs] [data-dhc-title-actions]{position:static;max-width:none;flex:none;gap:2px;margin:0;min-width:0}
        [data-dhc-frame] [data-dhc-title-actions] button{font-size:12px;max-width:100px;padding-inline:6px}
        [data-dhc-frame] [data-dhc-title-row]>[class*="_headerUtilities"]{margin-left:0;gap:0;flex:none}
        [data-dhc-frame] [data-dhc-title-row]>[data-conversation-header-corner]{margin:0;flex:none}
        [data-dhc-frame] [data-dhc-tabs-row]{grid-column:1;grid-row:2;position:relative;min-height:44px!important;margin:0 0 0 -44px!important;padding:0!important;width:calc(100% + 44px);align-items:center;gap:4px;overflow:hidden}
        [data-dhc-frame] [data-conversation-tabs]{flex:1;min-width:0;overflow-x:auto;touch-action:pan-x}
        [data-dhc-frame] [data-shell-bottom]{grid-row:2;min-height:0;margin:0!important;padding:0 10px max(4px,var(--dhc-bottom-inset,0px))!important}
        [data-dhc-frame] [data-shell-bottom]:empty{display:none}
        [data-dhc-frame] [data-shell-bottom]>div{margin-block:0!important;padding-block:4px!important}
        [data-dhc-frame] [data-composer-seat]{padding-bottom:4px!important}
        html[data-dhc-enabled] :is(button,[role="button"],a){touch-action:manipulation}
      }
    `;
    function Icon({ name = 'computer' }) {
      const paths = {
        computer: ['M3 4.5h18v12H3z','M8 20h8','M12 16.5V20'],
        close: ['m6 6 12 12','M18 6 6 18'],
        back: ['m14 5-7 7 7 7'],
        plus: ['M12 5v14','M5 12h14'],
        remove: ['M4 7h16','M9 3.5h6L16 7H8z','m6 7 1 13h10l1-13','M10 10.5v6','M14 10.5v6'],
        info: ['M12 16v-4','M12 8h.01','M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0'],
        check: ['m5 12 4 4L19 6'],
        phone: ['M7 3h10v18H7z','M10 6h4','M11 18h2']
      };
      return h('svg',{className:'dhc-icon',viewBox:'0 0 24 24','aria-hidden':true,focusable:'false'},
        ...(paths[name] || paths.computer).map((d,index)=>h('path',{d,key:index})));
    }
    function visibleAddress(value) {
      try { const address = new URL(value); return address.host + (address.pathname === '/' ? '' : address.pathname); }
      catch { return value; }
    }
    function apply(ctx) {
      let storage;
      try { storage = window.localStorage; } catch {}
      let open = false;
      const layout = ctx.get('layout');
      const uiSession = ctx.get('uiSession');
      let returnTo = null;
      const listeners = new Set();
      const update = next => { open = next; for (const notify of listeners) notify(next); };
      const show = () => {
        if (window.HarmonyConnector && typeof window.HarmonyConnector.showComputers === 'function') {
          window.HarmonyConnector.showComputers();
          return;
        }
        document.body.dispatchEvent(new KeyboardEvent('keydown',{key:',',code:'Comma',ctrlKey:true,altKey:true,bubbles:true,cancelable:true}));
        requestAnimationFrame(()=>requestAnimationFrame(()=>{
          const nav=document.querySelector('[data-shortcut-modal="settings"]>nav');
          [...(nav?.querySelectorAll('button')||[])].find(button=>button.textContent.trim()==='DS Harmony')?.click();
        }));
      };
      const close = () => update(false);
      const requestShow = () => window.dispatchEvent(new CustomEvent('dsh-harmony-connect:show-computers'));
      function useOpen() {
        const [value,set] = useState(open);
        useEffect(() => { listeners.add(set); set(open); return () => listeners.delete(set); }, []);
        return value;
      }
      function ConnectionSettings({view='page'}) {
        if(view!=='page') return '管理设备配对与连接入口';
        return h('section',{className:'dhc-settings','data-dhc-settings':true},
          h('h3',null,'DS Harmony'),
          h('p',null,'在手机和平板上使用电脑的 DSH。工作区、会话和插件保持同步。'),
          window.HarmonyConnector ? h('button',{className:'dhc-button',type:'button',onClick:requestShow},h(Icon,{name:'computer'}),'管理电脑') : h(Overlay,{inline:true}));
      }
      function QuickNav() {
        const [panel,setPanel]=useState(()=>layout?.panelInfo.getSnapshot().activePanelId ?? null);
        const visible=useOpen();
        useEffect(()=>layout?.panelInfo.subscribe(()=>setPanel(layout.panelInfo.getSnapshot().activePanelId)),[]);
        if(visible) return null;
        return h('button',{className:'dhc-quick-nav','data-dhc-quick-nav':true,type:'button',
          'aria-label':panel?'返回会话':'打开会话列表',
          onClick:()=>{if(panel)layout.selectPanel(null);else layout?.toggleSidebar();}},
          panel?h(Icon,{name:'back'}):h(FishLogo,{size:25}));
      }
      function Overlay({inline=false}) {
        const overlayOpen = useOpen();
        const visible = inline || overlayOpen;
        const [view,setView] = useState('computers');
        const [message,setMessage] = useState('');
        const [messageTone,setMessageTone] = useState('info');
        const [deviceName,setDeviceName] = useState('');
        const [link,setLink] = useState('');
        const [computers,setComputers] = useState(() => readComputers(storage));
        const [pairing,setPairing] = useState(null);
        const [pairingBusy,setPairingBusy] = useState(false);
        const [now,setNow] = useState(Date.now());
        const dialogRef = useRef(null);
        const pairingRequest = useRef(0);
        const desktop = (location.protocol === 'dsh-app:' && location.hostname === 'app') || ['127.0.0.1','localhost','[::1]'].includes(location.hostname);
        const notify = (text,tone='info') => { setMessage(text);setMessageTone(tone); };
        const createPairing = async () => {
          const request = ++pairingRequest.current;
          setPairingBusy(true);setPairing(null);notify('');
          try {
            const headers = { 'content-type':'application/json' };
            headers[location.protocol === 'dsh-app:' ? 'x-dsh-mobile-desktop-admin' : 'x-dsh-mobile-web-admin'] = location.protocol === 'dsh-app:' ? 'dsh-app://app' : 'same-origin-json';
            const response = await fetch('/api/mobile-access/harmony/pairing/open',{method:'POST',headers,body:'{"ttlMs":600000}'});
            const result = await response.json();
            if(!response.ok || typeof result.pairUrl !== 'string' || typeof result.qrSvg !== 'string') throw new Error('pairing_failed');
            if (pairingRequest.current !== request) return;
            const expires = typeof result.expiresAt === 'number' ? result.expiresAt : Date.parse(result.expiresAt);
            setNow(Date.now());setPairing({ url:result.pairUrl, svg:result.qrSvg, expiresAt:Number.isFinite(expires) ? expires : Date.now()+600000 });
          } catch { if (pairingRequest.current === request) notify('未能生成配对二维码，请检查电脑端连接服务后重试。','error'); }
          finally { if (pairingRequest.current === request) setPairingBusy(false); }
        };
        useEffect(() => {
          if (!visible || !pairing) return;
          const timer = setInterval(()=>setNow(Date.now()),1000);
          return () => clearInterval(timer);
        },[visible,pairing]);
        useEffect(() => {
          const frame = document.querySelector('[data-dhc-frame]');
          if (inline) return () => { pairingRequest.current++; };
          frame?.toggleAttribute('data-dhc-dialog-open',visible);
          if (!visible) return;
          setView('computers');notify('');setLink('');setPairing(null);setPairingBusy(false);
          const seats = frame ? [...frame.children] : [];
          const before = seats.map(el=>el.inert);
          seats.forEach(el=>{el.inert=true;});
          dialogRef.current?.querySelector('button')?.focus();
          const keydown = event => {
            if (event.key==='Escape') { event.stopPropagation(); event.preventDefault(); close(); }
            if (event.key==='Tab' && dialogRef.current) {
              const buttons=[...dialogRef.current.querySelectorAll('button,input,[tabindex="0"]')].filter(el=>!el.disabled && el.getClientRects().length);
              const first=buttons[0],last=buttons[buttons.length-1];
              if (!first || !last) return;
              if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus();}
              else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus();}
            }
          };
          document.addEventListener('keydown',keydown,true);
          return () => { pairingRequest.current++;seats.forEach((el,i)=>{el.inert=before[i];}); frame?.removeAttribute('data-dhc-dialog-open'); document.removeEventListener('keydown',keydown,true); const focusTarget=returnTo?.isConnected?returnTo:document.querySelector('[data-dhc-quick-nav]');focusTarget?.focus(); };
        },[visible,inline]);
        useEffect(() => {
          if (!visible || inline) return;
          dialogRef.current?.querySelector(view === 'add' ? 'input' : 'header button')?.focus();
        },[visible,view]);
        if(!visible) return null;
        const openAdd = () => { setView('add');notify(''); };
        const backToComputers = () => { setView('computers');notify('');setLink(''); };
        const connect = () => {
          let address;
          try { address = parseConnectionAddress(link); }
          catch { notify('请输入电脑端生成的完整 HTTPS 连接地址。','error');dialogRef.current?.querySelector('input[type="url"]')?.focus();return; }
          const existing = computers.find(row => row.address === address.saved);
          const row = { id:existing?.id || `${Date.now()}-${Math.random().toString(36).slice(2,10)}`, name:deviceName.trim().slice(0,40) || '我的电脑', address:address.saved };
          const rows = computers.filter(item => item.address !== row.address).concat(row);
          try { saveComputers(storage, rows); }
          catch { notify(rows.length > 20 ? '最多保存 20 台电脑。' : '电脑列表暂时无法保存，请重试。','error');return; }
          setComputers(rows); setLink(''); setDeviceName('');
          window.location.assign(address.entry);
        };
        const forget = id => {
          const rows = computers.filter(row => row.id !== id);
          try { saveComputers(storage, rows); setComputers(rows); }
          catch { notify('电脑列表暂时无法保存，请重试。','error'); }
        };
        const notice = message ? h('div',{className:'dhc-message','data-tone':messageTone,role:messageTone==='error'?'alert':'status',id:'dhc-message',key:'notice'},
          h(Icon,{name:messageTone==='success'?'check':'info'}),h('span',null,message)) : null;
        const remaining = pairing ? Math.max(0,Math.ceil((pairing.expiresAt-now)/1000)) : 0;
        const expired = pairing && remaining === 0;
        const expiryLabel = `${Math.floor(remaining/60)}:${String(remaining%60).padStart(2,'0')}`;
        return h('div',{className:inline?'dhc-inline':'dhc-dialog-layer',onClick:inline?undefined:event=>{if(event.target===event.currentTarget)close();}},
          h('section',{className:inline?'dhc-inline-content':'dhc-dialog',role:inline?undefined:'dialog','aria-modal':inline?undefined:true,'aria-labelledby':inline?undefined:'dhc-title','aria-describedby':inline?undefined:'dhc-description',ref:dialogRef},
            inline ? null : h('header',null,
              view==='add' ? h('button',{className:'dhc-icon-button',type:'button','aria-label':'返回电脑列表',onClick:backToComputers},h(Icon,{name:'back'})) : null,
              h('h2',{id:'dhc-title'},view==='add'?'添加电脑':'电脑与连接'),
              h('button',{className:'dhc-icon-button',type:'button','aria-label':'关闭电脑与连接',onClick:close},h(Icon,{name:'close'}))),
            h('div',{className:'dhc-dialog-content'},view==='computers' ? [
              inline ? null : h('p',{className:'dhc-caption',id:'dhc-description',key:'caption'},'继续使用电脑上的 DSH，保留工作区、会话与插件。'),
              notice,
              inline ? null : h('div',{className:'dhc-computer',key:'current'},
                h('div',{className:'dhc-computer-top'},h('div',{className:'dhc-computer-icon'},h(Icon,{name:'computer'})),
                  h('div',{className:'dhc-computer-info'},h('strong',null,'当前电脑'),h('div',{className:'dhc-origin'},desktop?'本机 DSH':visibleAddress(location.origin)))),
                h('button',{className:'dhc-button',type:'button',onClick:close},'返回 DSH')),
              desktop ? h('div',{className:'dhc-pair-card',key:'pair','aria-busy':pairingBusy},
                h('h3',null,'连接手机或平板'),
                h('p',{className:'dhc-caption'},'在 DS Harmony 中扫码，或粘贴配对链接。'),
                pairing && !expired ? h(React.Fragment,null,
                  h('img',{className:'dhc-qr',src:'data:image/svg+xml;charset=utf-8,'+encodeURIComponent(pairing.svg),alt:'DSH 一次性配对二维码'}),
                  h('p',{className:'dhc-pair-expiry'},'一次性链接 · ',h('span',null,expiryLabel),' 后过期'),
                  h('input',{className:'dhc-pair-link',readOnly:true,value:pairing.url,'aria-label':'一次性配对链接',onFocus:event=>event.target.select()}),
                  h('button',{className:'dhc-button',type:'button',onClick:async()=>{try{await navigator.clipboard.writeText(pairing.url);notify('配对链接已复制，可在客户端粘贴。','success');}catch{notify('请选中上方链接后复制。');}}},'复制配对链接')) : null,
                expired ? h('p',{className:'dhc-pair-expiry',role:'status'},'二维码已过期，请重新生成。') : null,
                h('button',{className:'dhc-button'+(!pairing || expired?' dhc-primary':''),type:'button',disabled:pairingBusy,onClick:createPairing},
                  !pairing && !pairingBusy ? h(Icon,{name:'phone'}) : null,pairingBusy?'正在生成二维码…':pairing?'重新生成二维码':'生成配对二维码')) : null,
              computers.length ? h('h3',{className:'dhc-section-title',key:'saved-title'},'已保存的电脑') : null,
              ...computers.map(computer => h('div',{className:'dhc-computer',key:computer.id},
                h('div',{className:'dhc-computer-top'},h('div',{className:'dhc-computer-icon'},h(Icon,{name:'computer'})),
                  h('div',{className:'dhc-computer-info'},h('strong',null,computer.name),h('div',{className:'dhc-origin',title:computer.address},visibleAddress(computer.address)))),
                h('div',{className:'dhc-computer-actions'},
                  h('button',{className:'dhc-button dhc-outline',type:'button',onClick:()=>window.location.assign(computer.address)},'连接电脑'),
                  h('button',{className:'dhc-icon-button',type:'button','aria-label':`移除 ${computer.name}`,title:'移除电脑',onClick:()=>forget(computer.id)},h(Icon,{name:'remove'}))))),
              inline ? null : h('div',{className:'dhc-form-actions',key:'add'},h('button',{className:'dhc-button dhc-outline',type:'button',onClick:openAdd},h(Icon,{name:'plus'}),'添加电脑'))
            ] : [
              h('p',{className:'dhc-caption',id:'dhc-description',key:'caption'},'粘贴电脑端生成的连接地址或一次性配对链接。'),
              h('form',{noValidate:true,key:'form',onSubmit:event=>{event.preventDefault();connect();}},
                h('label',{className:'dhc-field'},h('span',null,'电脑名称'),h('input',{name:'computer-name',value:deviceName,onChange:e=>setDeviceName(e.target.value),placeholder:'例如：我的电脑',autoComplete:'off',maxLength:40,enterKeyHint:'next'})),
                h('label',{className:'dhc-field'},h('span',null,'DSH 连接地址'),h('input',{name:'computer-address',type:'url',value:link,onChange:e=>{setLink(e.target.value);if(messageTone==='error')notify('');},placeholder:'https://…',autoComplete:'off',autoCapitalize:'none',spellCheck:false,maxLength:8192,enterKeyHint:'go','aria-invalid':messageTone==='error','aria-describedby':message?'dhc-address-note dhc-message':'dhc-address-note'})),
                h('p',{className:'dhc-caption',id:'dhc-address-note'},'请使用自己电脑生成的入口。地址中的授权参数仅用于本次连接。'),
                notice,
                h('div',{className:'dhc-form-actions'},h('button',{className:'dhc-button dhc-primary',type:'submit'},'添加并连接'),
                  h('button',{className:'dhc-button',type:'button',onClick:backToComputers},'取消')))
            ])));
      }
      ctx.effect(() => {
        if (!document.querySelector('meta[name="dsh-mobile-gateway"][content="authenticated"]')) return;
        const connection = ctx.get('connection');
        if (!connection) return;
        const previous = connection.isLoopback;
        connection.isLoopback = true;
        return () => { connection.isLoopback = previous; };
      },'authenticated gateway connection');
      ctx.effect(()=>{
        const connection=ctx.get('connection');
        if(!connection?.state) return;
        const publish=()=>{
          const state=connection.state.getSnapshot() || 'connecting';
          window.__DSH_HARMONY_STATE__=state;
          window.HarmonyConnector?.connectionChanged?.(state);
          if(state==='connected'&&document.querySelector('[data-shell-overlay]'))window.HarmonyConnector?.pageReady?.();
        };
        const retry=()=>connection.reconnect();
        const dispose=connection.state.subscribe(publish);
        window.addEventListener('dsh-harmony:retry-transport',retry);publish();
        return()=>{dispose?.();window.removeEventListener('dsh-harmony:retry-transport',retry);delete window.__DSH_HARMONY_STATE__;};
      },'native connection state');
      ctx.effect(() => {
        const style=document.createElement('style');style.dataset.plugin='dsh-harmony-connect';style.textContent=CSS;document.head.append(style);
        document.documentElement.dataset.dhcEnabled='true';
        let frame=null;
        const backdrop=document.createElement('button');backdrop.type='button';backdrop.className='dhc-nav-backdrop';backdrop.setAttribute('aria-label','收起导航面板');
        const compact=window.matchMedia('(max-width:767px)');
        const syncPanels=()=>{
          const expanded=compact.matches && frame && (!frame.hasAttribute('data-sidebar-collapsed') || !frame.hasAttribute('data-rightbar-collapsed'));
          backdrop.toggleAttribute('data-open',!!expanded);backdrop.dataset.panel=frame && !frame.hasAttribute('data-sidebar-collapsed')?'left':'right';backdrop.tabIndex=expanded?0:-1;backdrop.setAttribute('aria-hidden',expanded?'false':'true');
          document.documentElement.toggleAttribute('data-dhc-navigation-open',!!expanded);
          frame?.toggleAttribute('data-dhc-main-panel',layout?.panelInfo.getSnapshot().activePanelId!=null);
        };
        const closePanels=()=>{
          if (!frame) return;
          if (!frame.hasAttribute('data-sidebar-collapsed')) layout?.toggleSidebar();
          if (!frame.hasAttribute('data-rightbar-collapsed')) layout?.closeRightbar();
        };
        const panelsObserver=new MutationObserver(syncPanels);
        const marked=new Set();
        const mark=(node,name)=>{if(node&&!node.hasAttribute(name)){node.setAttribute(name,'');marked.add([node,name]);}};
        const markContents=()=>{
          if(!frame||window.__DS_HARMONY_NATIVE_SHELL__)return;
          const header=frame.querySelector('[data-dhc-center] [data-phase] > [data-slot="conversation.header"] > header, [data-dhc-center] [data-phase] > header[data-window-drag]');
          mark(header,'data-dhc-chat-header');
          const nav=header?.querySelector('nav');
          mark(nav?.parentElement,'data-dhc-title-cluster');
          mark(nav?.parentElement?.parentElement,'data-dhc-title-row');
          mark(nav?.parentElement?.children[1],'data-dhc-title-actions');
          const tabs=header?.querySelector('[data-conversation-tabs]');
          mark(tabs?.parentElement,'data-dhc-tabs-row');
          if(tabs)mark(header,'data-dhc-has-tabs');else header?.removeAttribute('data-dhc-has-tabs');
          const seat=frame.querySelector('[data-composer-seat]');
          mark(seat?.parentElement,'data-dhc-chat-scroll');mark(seat?.parentElement?.parentElement,'data-dhc-chat-body');
          const card=seat?.querySelector('[data-composer-card]');
          mark(card?.parentElement,'data-dhc-composer-root');
          const slot=card?.parentElement?.parentElement;
          if(slot?.hasAttribute('data-slot'))mark(slot.parentElement,'data-dhc-composer-stack');
        };
        let contentsFrame=0;
        const structural='[data-phase],[data-conversation-content],[data-conversation-scroll],[data-composer-seat],[data-composer-card],[data-conversation-tabs],header[data-window-drag],[class*="_titleRow"],[class*="_titleCluster"]';
        const contentsObserver=new MutationObserver(records=>{
          if(window.__DS_HARMONY_NATIVE_SHELL__||document.hidden)return;
          const relevant=records.some(record=>{
            const content=record.target.closest?.('[data-chat-flow],[data-composer-card]');
            return [...record.addedNodes,...record.removedNodes].some(node=>node.nodeType===1&&(node.matches(structural)||(!content&&node.querySelector(structural))));
          });
          if(relevant&&!contentsFrame)contentsFrame=requestAnimationFrame(()=>{contentsFrame=0;markContents();});
        });
        const syncOwner=()=>{
          contentsObserver.disconnect();cancelAnimationFrame(contentsFrame);contentsFrame=0;
          if(frame&&!window.__DS_HARMONY_NATIVE_SHELL__&&!document.hidden){contentsObserver.observe(frame,{childList:true,subtree:true});markContents();}
        };
        window.addEventListener('dsh-harmony:layout-owner',syncOwner);
        document.addEventListener('visibilitychange',syncOwner);
        backdrop.addEventListener('click',closePanels);compact.addEventListener('change',syncPanels);
        let activePanel=layout?.panelInfo.getSnapshot().activePanelId;
        const stopPanel=layout?.panelInfo.subscribe(()=>{
          const nextPanel=layout.panelInfo.getSnapshot().activePanelId;
          const changed=nextPanel!==activePanel;activePanel=nextPanel;
          if(compact.matches&&changed)closePanels();
          syncPanels();
        });
        let currentSession=uiSession?.current.getSnapshot().key;
        const stopSession=uiSession?.current.subscribe(()=>{
          const nextSession=uiSession.current.getSnapshot().key;
          const changed=nextSession!==currentSession;currentSession=nextSession;
          if(compact.matches&&changed&&nextSession!==undefined)closePanels();
        });
        let navigationFrame=0;
        const sidebarMessages=ctx.locale?.bind('sidebar');
        const newSessionLabel=sidebarMessages?.('session.new.label')||'新建会话';
        const navigationClick=event=>{
          if(!compact.matches||!(event.target instanceof Element))return;
          const target=event.target;
          if(!target.closest('[data-dhc-sidebar]'))return;
          const row=target.closest('[data-row-key^="session:"][role="treeitem"][aria-selected="true"]');
          const selectedRow=row&&!target.closest('button,input,[contenteditable="true"]');
          const newSession=target.closest('button')?.getAttribute('aria-label')===newSessionLabel;
          if(!selectedRow&&!newSession&&!target.closest('nav button'))return;
          cancelAnimationFrame(navigationFrame);
          navigationFrame=requestAnimationFrame(()=>{navigationFrame=0;closePanels();});
        };
        document.addEventListener('click',navigationClick);
        const markFrame=()=>{
          const candidate=document.querySelector('[data-shell-overlay]')?.parentElement;
          if(!candidate)return;
          frame=candidate;frame.dataset.dhcFrame='true';frame.children[0]?.setAttribute('data-dhc-sidebar','true');frame.children[1]?.setAttribute('data-dhc-center','true');
          if(compact.matches&&!frame.hasAttribute('data-sidebar-collapsed'))layout?.toggleSidebar();
          frame.append(backdrop);panelsObserver.observe(frame,{attributes:true,attributeFilter:['data-sidebar-collapsed','data-rightbar-collapsed']});syncPanels();
          syncOwner();
          observer.disconnect();
        };
        const observer=new MutationObserver(markFrame);
        observer.observe(document.body,{childList:true,subtree:true});markFrame();
        const viewport=window.visualViewport;
        let visibleHeight=0;
        const syncHeight=()=>{
          if(window.__DS_HARMONY_NATIVE_SHELL__)return;
          const height=viewport?.height||window.innerHeight;
          if(height>0&&height!==visibleHeight){visibleHeight=height;document.documentElement.style.setProperty('--dhc-visible-height',height+'px');}
        };
        syncHeight();viewport?.addEventListener('resize',syncHeight);window.addEventListener('resize',syncHeight);
        return()=>{observer.disconnect();panelsObserver.disconnect();contentsObserver.disconnect();cancelAnimationFrame(contentsFrame);cancelAnimationFrame(navigationFrame);document.removeEventListener('click',navigationClick);document.removeEventListener('visibilitychange',syncOwner);window.removeEventListener('dsh-harmony:layout-owner',syncOwner);if(!window.__DS_HARMONY_NATIVE_SHELL__){for(const[node,name]of marked)node.removeAttribute(name);delete document.documentElement.dataset.dhcEnabled;frame?.removeAttribute('data-dhc-frame');frame?.children[0]?.removeAttribute('data-dhc-sidebar');frame?.children[1]?.removeAttribute('data-dhc-center');}stopPanel?.();stopSession?.();backdrop.removeEventListener('click',closePanels);compact.removeEventListener('change',syncPanels);backdrop.remove();style.remove();document.documentElement.removeAttribute('data-dhc-navigation-open');document.documentElement.style.removeProperty('--dhc-visible-height');frame?.removeAttribute('data-dhc-main-panel');viewport?.removeEventListener('resize',syncHeight);window.removeEventListener('resize',syncHeight);};
      },'harmony connection styles');
      ctx.effect(()=>{
        const back=()=>{
          const escape=()=>document.body.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape',code:'Escape',bubbles:true,cancelable:true}));
          if(document.querySelector('[role="menu"],[role="dialog"],[data-shortcut-modal]')) {escape();return;}
          const frame=document.querySelector('[data-dhc-frame]');
          if(frame&&!frame.hasAttribute('data-rightbar-collapsed')){layout?.closeRightbar();return;}
          if(layout?.panelInfo.getSnapshot().activePanelId!=null){layout.selectPanel(null);return;}
          const tabs=document.querySelector('[data-conversation-tabs]');
          const first=tabs?.querySelector('[role="tab"]');
          if(first&&first.getAttribute('aria-selected')!=='true'){first.click();return;}
          layout?.toggleSidebar();
        };
        window.__DSH_HARMONY_BACK__=back;
        return()=>{if(window.__DSH_HARMONY_BACK__===back)delete window.__DSH_HARMONY_BACK__;};
      },'DSH system back navigation');
      ctx.effect(()=>ctx.slots.inject('settings.section',()=>ctx.slots.register({name:'settings.section',id:'dsh-harmony-connect',order:35,label:'DS Harmony'},ConnectionSettings)),'DS Harmony connection settings');
      ctx.effect(()=>ctx.slots.inject('plugins.bundle.config',()=>ctx.slots.register({name:'plugins.bundle.config',key:'dsh-harmony-connect'},ConnectionSettings)),'harmony plugin connection settings');
      ctx.effect(()=>{
        // DSH memoizes shell.overlay; an owned root keeps late loads and hot replacement interactive.
        const host=document.createElement('div');host.dataset.dhcOverlayHost='true';document.body.append(host);
        const root=createRoot(host);
        window.addEventListener('dsh-harmony-connect:show-computers',show);
        root.render(h(QuickNav));
        return()=>{window.removeEventListener('dsh-harmony-connect:show-computers',show);root.unmount();host.remove();listeners.clear();};
      },'harmony connection overlay');
    }
    return {name:'dsh-harmony-connect',inject:['slots','connection','layout','uiSession','locale'],apply,parseConnectionAddress,readComputers,saveComputers};
  }
});
