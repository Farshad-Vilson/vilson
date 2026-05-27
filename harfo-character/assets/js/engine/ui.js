/* ================================================================
   حرفو v7 — UI Engine
   Search palette · Text selection · TOC · Tour
   ================================================================ */
(function (W) {
  'use strict';

  function $(s, c) { return (c || document).querySelector(s); }

  /* ════════════════════ SEARCH PALETTE ════════════════════ */
  var Palette = {
    _el:null, _inp:null, _list:null, _items:[], _idx:0,

    init: function () {
      this._el   = document.getElementById('h-palette');
      this._inp  = document.getElementById('h-pal-inp');
      this._list = document.getElementById('h-pal-list');
      if (!this._el) return;

      var self = this;
      this._inp.addEventListener('input',   function () { self.render(self._inp.value); });
      this._inp.addEventListener('keydown', function (e) {
        if (e.key==='Escape')    { self.close(); return; }
        if (e.key==='ArrowDown') { e.preventDefault(); self.move(1);  return; }
        if (e.key==='ArrowUp')   { e.preventDefault(); self.move(-1); return; }
        if (e.key==='Enter')     { e.preventDefault(); self.go();     return; }
      });
      this._el.addEventListener('click', function (e) { if (e.target===self._el) self.close(); });

      window.addEventListener('keydown', function (e) {
        if ((e.ctrlKey||e.metaKey) && e.key.toLowerCase()==='k') {
          e.preventDefault(); self.open();
        }
      });
    },

    _build: function () {
      var seen={}, items=[];
      var ai = W.HarfoPageAI ? W.HarfoPageAI.d : {};

      var add = function (arr, icon) {
        (arr||[]).forEach(function (l) {
          if (!seen[l.t]) { seen[l.t]=1; items.push({t:l.t,href:l.href||null,scroll:l.scroll||null,icon:icon||'🔗'}); }
        });
      };

      add(ai.navLinks||[], '🧭');
      (ai.headings||[]).forEach(function (h) {
        if(!seen[h.t]){seen[h.t]=1;items.push({t:h.t,href:null,scroll:h.el,icon:'📌'});}
      });
      add(ai.allLinks||[], '🔗');
      this._items = items;
    },

    open: function () {
      if (!this._el) return;
      this._build(); this.render('');
      this._el.classList.add('show');
      setTimeout(function(){Palette._inp&&Palette._inp.focus();},60);
    },

    close: function () { if(this._el) this._el.classList.remove('show'); },

    render: function (q) {
      q=(q||'').trim().toLowerCase();
      var matches=q
        ? this._items.filter(function(i){return i.t.toLowerCase().indexOf(q)>=0;}).slice(0,22)
        : this._items.slice(0,14);
      this._list.innerHTML=''; this._idx=0;
      if (!matches.length) { this._list.innerHTML='<div class="no-r">نتیجه‌ای پیدا نشد</div>'; return; }
      matches.forEach(function(m,i){
        var a=document.createElement('a');
        a.href=m.href||'#'; a.className=i===0?'sel':'';
        a.innerHTML='<span class="h-pal-icon">'+(m.icon||'🔗')+'</span>'+m.t;
        a.onclick=function(e){
          if(m.scroll){e.preventDefault();m.scroll.scrollIntoView({behavior:'smooth',block:'start'});}
          Palette.close();
        };
        Palette._list.appendChild(a);
      });
    },

    move: function (dir) {
      var links=Array.prototype.slice.call(this._list.querySelectorAll('a'));
      if(!links.length) return;
      links[this._idx]&&links[this._idx].classList.remove('sel');
      this._idx=(this._idx+dir+links.length)%links.length;
      links[this._idx]&&links[this._idx].classList.add('sel');
      links[this._idx]&&links[this._idx].scrollIntoView({block:'nearest'});
    },

    go: function () { var s=this._list.querySelector('.sel'); if(s)s.click(); }
  };

  /* ════════════════════ TEXT SELECTION ════════════════════ */
  var Selection = {
    _pop: null,

    init: function () {
      document.addEventListener('mouseup', function(){setTimeout(Selection._check,30);});
      document.addEventListener('mousedown', function(e){
        if(Selection._pop&&!Selection._pop.contains(e.target)) Selection._hide();
      });
    },

    _check: function () {
      var sel=window.getSelection(), text=sel?sel.toString().trim():'';
      if(!text||text.length<4||text.length>800){Selection._hide();return;}
      try{var r=sel.getRangeAt(0).getBoundingClientRect();if(r.width<1&&r.height<1)return;Selection._show(text,r);}
      catch(e){}
    },

    _show: function (text, rect) {
      Selection._hide();
      var p=document.createElement('div');
      p.className='h-sel-pop';
      p.style.cssText='top:'+(window.scrollY+rect.top-44)+'px;left:'+(window.scrollX+rect.left)+'px;';

      function btn(label, fn){
        var b=document.createElement('button');
        b.textContent=label;
        b.onclick=function(e){e.preventDefault();fn();Selection._hide();};
        p.appendChild(b);
      }
      btn('کپی',function(){try{navigator.clipboard.writeText(text);W.HarfoToast&&W.HarfoToast.show('کپی شد ✓');}catch(e){}});
      btn('برجسته',function(){
        try{var sp=document.createElement('mark');sp.style.cssText='background:rgba(91,232,218,0.32);padding:0 2px;border-radius:3px';
          window.getSelection().getRangeAt(0).surroundContents(sp);}catch(e){}
      });
      btn('بخوان',function(){
        try{var u=new SpeechSynthesisUtterance(text);u.lang='fa-IR';speechSynthesis.cancel();speechSynthesis.speak(u);
          W.HarfoToast&&W.HarfoToast.show('در حال خواندن...');}catch(e){}
      });
      if(text.length>80) btn('خلاصه',function(){
        var s=text.split(/(?<=[\.\?\!؟])\s+/).slice(0,2).join(' ');
        W.HarfoSpeech&&W.HarfoSpeech.say(s,{force:true,sticky:true,actions:[{label:'باشه',fn:function(){}}]});
      });
      document.body.appendChild(p);
      Selection._pop=p;
    },

    _hide: function(){if(Selection._pop){Selection._pop.remove();Selection._pop=null;}}
  };

  /* ════════════════════ SITE TOUR ════════════════════ */
  var Tour = {
    _running:false, _steps:[], _i:0,

    _plan: function () {
      var steps=[];
      var ai=W.HarfoPageAI?W.HarfoPageAI.d:{};
      var add=function(sel,msg,pose,after){
        var el=document.querySelector(sel);
        if(!el)return;
        var r=el.getBoundingClientRect();
        if(r.width<10||r.height<5)return;
        steps.push({el:el,rect:r,msg:msg,pose:pose||'sit',after:after||null});
      };
      add('.site-logo,.custom-logo,header .logo','این لوگوی سایت — خونه ماست.','peek');
      add('.main-navigation,header nav','اینجا منوی اصلیه.','drape');
      add('h1',ai.productTitle?'این محصول: '+ai.productTitle:(ai.isArticle?'شروع مقاله از اینجاست.':'عنوان اصلی'),'peek');
      if(ai.isProduct){
        add('.price,.amount','قیمت اینجاست.','sit');
        add('.single_add_to_cart_button','با این دکمه به سبد اضافه کن.','sit');
      } else if(ai.isArticle&&ai.headings&&ai.headings.length>=2){
        add('article h2,.entry-content h2',
          'این مقاله '+( ai.readMin||1)+' دقیقه‌ست — فهرست رو برات می‌آرم.','peek',
          function(){setTimeout(function(){W.HarfoHelpers&&W.HarfoHelpers.buildTOC();},800);});
      } else if(ai.isCart){
        add('.checkout-button,a[href*="checkout"]','از اینجا پرداخت می‌کنی.','sit');
      }
      add('footer,.site-footer','پایین صفحه هم لینک‌های مفیدی داره.','drape');
      return steps.filter(Boolean);
    },

    start: function () {
      if(this._running) return;
      this._steps=this._plan();
      if(!this._steps.length){Tour._done();return;}
      this._i=0; this._running=true;
      W.HarfoMemory&&W.HarfoMemory.markToured(location.pathname);
      Tour._step();
    },

    _step: function () {
      if(!Tour._running||Tour._i>=Tour._steps.length){Tour._done();return;}
      var s=Tour._steps[Tour._i++];
      var rect=s.el.getBoundingClientRect();
      if(rect.top<-80||rect.top>window.innerHeight+200)
        window.scrollTo({top:window.scrollY+rect.top-140,behavior:'smooth'});
      setTimeout(function(){
        rect=s.el.getBoundingClientRect();
        var spot=W.HarfoAnchors?W.HarfoAnchors.spotOn({el:s.el,rect:rect,kind:'other'}):{x:rect.left,y:rect.top-140};
        s.el.classList.add('harfo-hl');
        if(W.HarfoMorph) W.HarfoMorph.to(s.pose||'sit',450);
        if(W.HarfoPhysics) W.HarfoPhysics.moveTo(spot.x,spot.y,function(){
          W.HarfoSpeech&&W.HarfoSpeech.say(s.msg,{force:true,dur:3400});
          s.after&&s.after();
          setTimeout(function(){s.el.classList.remove('harfo-hl');Tour._step();},4200);
        });
      },380);
    },

    _done: function () {
      Tour._running=false;
      document.querySelectorAll('.harfo-hl').forEach(function(el){el.classList.remove('harfo-hl');});
      if(W.HarfoPhysics) W.HarfoPhysics.parkHome();
      if(W.HarfoMorph)   W.HarfoMorph.to('stand',500);
      W.HarfoSpeech&&W.HarfoSpeech.say('گردش تموم شد! هر وقت کمک خواستی روم کلیک کن.',{force:true});
    },

    stop: function () {
      Tour._running=false;
      document.querySelectorAll('.harfo-hl').forEach(function(el){el.classList.remove('harfo-hl');});
    },

    isRunning: function () { return Tour._running; }
  };

  W.HarfoPalette   = Palette;
  W.HarfoSelection = Selection;
  W.HarfoTour      = Tour;

}(window));
