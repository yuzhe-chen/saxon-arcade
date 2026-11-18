/* Knesset Combat 26' — CPU opponent. Produces a virtual controller state every frame. */
(function () {
  var LEVELS = {
    easy: { react: 24, block: 0.15, aggro: 0.35, think: 26, combo: 0.15, anti: 0.1, superUse: 0.3, jumpProj: 0.25 },
    normal: { react: 13, block: 0.45, aggro: 0.55, think: 16, combo: 0.45, anti: 0.35, superUse: 0.7, jumpProj: 0.45 },
    hard: { react: 7, block: 0.75, aggro: 0.72, think: 9, combo: 0.8, anti: 0.65, superUse: 0.95, jumpProj: 0.6 },
    boss: { react: 5, block: 0.82, aggro: 0.8, think: 7, combo: 0.9, anti: 0.75, superUse: 1, jumpProj: 0.65 }
  };
  /* skill 0..1 blends from a clumsy rookie to a near-perfect boss (used by the 250-level campaign) */
  function blend(skill) {
    var a = { react: 26, block: 0.12, aggro: 0.3, think: 28, combo: 0.1, anti: 0.08, superUse: 0.25, jumpProj: 0.2, punish: 0.05, guardSense: 0.1 };
    var b = { react: 3, block: 0.92, aggro: 0.85, think: 5, combo: 0.97, anti: 0.9, superUse: 1, jumpProj: 0.75, punish: 0.9, guardSense: 0.95 };
    var o = {}; for (var k in a) o[k] = a[k] + (b[k] - a[k]) * skill;
    o.react = Math.round(o.react); o.think = Math.round(o.think);
    return o;
  }
  KC.aiBlend = blend;
  var SKILL = { easy: 0.15, normal: 0.42, hard: 0.7, boss: 0.85 };
  var AI = KC.AI = function (fighter, level, skill) {
    this.f = fighter; this.level = level;
    this.skill = skill != null ? skill : (SKILL[level] != null ? SKILL[level] : 0.42);
    if (skill == null) this.skill = Math.min(1, this.skill + 0.06);   // fixed difficulties are slightly smarter; campaign skill is used as-is
    this.L = blend(this.skill);
    this.plan = null; this.planT = 0;
    this.intent = 'approach'; this.intentT = 0; this.hold = {}; this.threatT = -1; this.defend = 0; this.defendLow = false;
    this.press = null; this.pressT = 0; this.jumpPlan = 0;
  };
  function R() { return Math.random(); }

  AI.prototype.input = function (m) {
    var f = this.f, o = f.opp, L = this.L;
    var inp = { l: 0, r: 0, u: 0, d: 0, p: 0, k: 0, s: 0, x: 0, e: 0, ai: 1 };
    var dx = o.x - f.x, dist = Math.abs(dx), toward = dx >= 0 ? 'r' : 'l', away = dx >= 0 ? 'l' : 'r';

    // release a pressed button after one frame so the next press registers as fresh
    if (this.pressT > 0) { this.pressT--; if (this.pressT === 0) this.press = null; }

    if ((f.state === 'hitstun' || f.state === 'airhit') && (f.combo || 0) >= 2) this.escapeArm = true;

    /* ---- defence ---- */
    var threat = false, lowThreat = false, projThreat = false, skyDodge = null;
    if ((o.state === 'attack' || o.state === 'rush' || o.state === 'super') && dist < 2.4) { threat = true; lowThreat = o.move && o.move.level === 'low'; if (o.move && o.move.air) lowThreat = false; }
    for (var i = 0; i < m.hazards.length; i++) {
      var h = m.hazards[i];
      if (h.owner !== o) continue;
      var hd = (f.x - h.x) * (h.vx >= 0 ? 1 : -1);
      if (h.sky && !h.armed && Math.abs(f.x - h.x) < 1.6) { skyDodge = h.x; continue; }   // sky beam reticle on us: get out from under it
      if (h.kind === 'beam' || h.kind === 'drop' || h.kind === 'fall') { threat = true; continue; }
      if (hd > -0.5 && hd < 3.6) { threat = true; projThreat = h.kind === 'proj' || h.kind === 'wave'; }
    }
    if (skyDodge != null && f.actionable() && R() < 0.25 + 0.7 * this.skill) {
      var run = f.x >= skyDodge ? 'r' : 'l';
      if (Math.abs(f.x) > KC.STAGE_BOUND - 1.2) run = f.x > 0 ? 'l' : 'r';   // cornered: run through to the other side
      inp[run] = 1;
      if (R() < 0.08 * this.skill) return this.tap(inp, 'e');
      return inp;
    }
    if (threat && this.threatT < 0) this.threatT = L.react + ((R() * 6) | 0);
    if (!threat) this.threatT = -1;
    if (this.threatT > 0) this.threatT--;
    if (this.threatT === 0) {
      this.threatT = -2; // decided
      if (f.alt && f.alt.type === 'counter' && f.actionable() && !projThreat && dist < 2.2 && R() < L.block * 0.45) { this.altNow = 1; }
      else if (projThreat && f.actionable() && R() < L.jumpProj && dist > 2.2) { this.jumpPlan = 1; }
      else if (!projThreat && f.actionable() && dist < 2.0 && o.state !== 'super' && R() < L.block * 0.2) { this.dashBack = 1; }
      else if (R() < L.block) { this.defend = 26; this.defendLow = lowThreat || (R() < 0.3 && o.state !== 'super'); }
    }
    if (this.altNow) { this.altNow = 0; inp.d = 1; return this.tap(inp, 's'); }
    if (this.dashBack) { this.dashBack = 0; inp[away] = 1; return this.tap(inp, 'e'); }   // backdash out of pressure
    if (this.jumpPlan) { this.jumpPlan = 0; inp.u = 1; inp[toward] = 1; this.intent = 'air'; this.intentT = 40; return inp; }
    var guardNearBreak = (f.blockTime || 0) > KC.GUARD_FRAMES * (0.55 + 0.3 * (1 - L.guardSense));
    if (guardNearBreak && R() < L.guardSense) { this.defend = 0; if (dist < 1.3 && f.actionable()) return this.tap(inp, R() < 0.5 ? 'p' : 'k'); inp[away] = 0; return inp; }
    if (this.defend > 0) {
      this.defend--;
      if (o.move && o.state === 'attack') this.defendLow = o.move.level === 'low';
      inp[away] = 1; if (this.defendLow) inp.d = 1;
      if (f.state === 'blockstun') this.defend = Math.max(this.defend, 6);
      return inp;
    }
    if (f.state === 'blockstun' && R() < L.block) { inp[away] = 1; inp.d = this.defendLow ? 1 : 0; return inp; }

    /* ---- combos: hit-confirm into a planned route ---- */
    if (f.state === 'attack' && f.moveHit && f.move && !f.move.air) {
      if (this.routeFor !== f.atkId) {
        this.routeFor = f.atkId;
        // decide once per connecting hit: continue the string, cash out into special/super, or stop
        var go = R() < L.combo;
        var id = f.move.id, nxt = null;
        if (go) {
          var canChain = ((id === 'LP' || id === 'CP') && f.chainCount < 2) || (f.comboMaster && f.chainCount < 3);
          var superOK = f.meter >= 100 && f.hasSuper && R() < L.superUse;
          var spOK = f.ch.special.type !== 'projectile' || !m.hasProjectile(f);
          if (canChain && R() < 0.65) nxt = { b: f.comboMaster && R() < 0.4 ? 'k' : 'p', d: id === 'CP' ? 1 : 0 };
          else if (superOK) nxt = { b: 'x', d: 0 };
          else if (spOK) nxt = { b: 's', d: 0 };
          else if (f.alt && R() < 0.5) nxt = { b: 's', d: 1 };
        }
        this.route = nxt; this.routeDelay = Math.max(1, 6 - Math.round(L.combo * 5));
      }
      if (this.route) {
        if (this.routeDelay > 0) { this.routeDelay--; return inp; }
        var rt = this.route; this.route = null;
        if (rt.d) inp.d = 1;
        return this.tap(inp, rt.b);
      }
      return inp;
    }
    if (f.state !== 'attack') this.routeFor = null;

    /* ---- setups: juggle, meaty on wake-up, mix-ups after blocked strings ---- */
    if (f.actionable() && R() < L.combo) {
      // juggle a falling opponent with an uppercut / air attack
      if (o.state === 'airhit' && o.y < 1.4 && dist < 1.4 && o.vy < 0 && f.alt && f.alt.type === 'rising') { inp.d = 1; return this.tap(inp, 's'); }
      // opponent is down: walk to point-blank and time an attack as they stand
      if (o.state === 'knockdown' || o.state === 'getup') {
        this.plan = 'meaty';
        if (dist > 1.05) { inp[toward] = 1; return inp; }
        if (o.state === 'getup' && o.st >= 14) { if (R() < 0.5) inp.d = 1; return this.tap(inp, R() < 0.5 ? 'k' : 'p'); }
        if (dist < 0.75) { inp[away] = 1; return inp; }
        return inp;
      }
      // they blocked our string: mix them up (low sweep vs. jump-in overhead vs. frame-trap jab)
      if (o.state === 'blockstun' && dist < 1.5) {
        var mix = R();
        if (mix < 0.35) { inp.d = 1; return this.tap(inp, 'k'); }
        if (mix < 0.55 && dist > 0.9) { inp.u = 1; inp[toward] = 1; this.intent = 'air'; this.intentT = 40; return inp; }
        if (mix < 0.8) return this.tap(inp, 'p');
        // keep them pinned so their guard meter runs out
        inp[toward] = 1; return inp;
      }
      // they keep blocking: lean in to pressure their 2.5 s guard
      if ((o.blockTime || 0) > KC.GUARD_FRAMES * 0.5 && dist < 1.4) return this.tap(inp, R() < 0.6 ? 'p' : 'k');
    }
    if (f.state === 'jump' && !f.airUsed && f.vy < 0.05 && dist < 1.6) return this.tap(inp, R() < 0.6 ? 'k' : 'p');
    // dash-in attack: once a forward dash gets close, cancel it into a punch or kick
    if (f.state === 'dash' && f.dashDir > 0 && f.st >= 5 && dist < 1.3 && R() < 0.35 + L.aggro * 0.5) return this.tap(inp, R() < 0.5 ? 'p' : 'k');
    if (!f.actionable()) return inp;

    /* ---- punish: opponent whiffed, is recovering, landing or guard-broken ---- */
    var recovering = (o.state === 'attack' && o.move && !o.moveHit && o.st > o.move.startup + o.move.active) || (o.state === 'land' && (o.landLag || 0) > 4) ||
      (o.state === 'rush' && o.rushStop) || o.state === 'counter' && o.st > 26 || o.guardBroken > 0 || (o.state === 'hitstun' && o.stun > 25) || (o.state === 'dash' && o.dashDir < 0 && o.st > 9);
    if (recovering && f.actionable() && R() < L.punish * 0.6) {
      if (f.meter >= 100 && f.hasSuper && dist < 3.2 && R() < L.superUse * 0.7) return this.tap(inp, 'x');
      if (dist < 1.25) return this.tap(inp, R() < 0.55 ? 'k' : 'p');
      if (dist > 1.3 && dist < 3.4 && R() < this.skill) { inp[toward] = 1; return this.tap(inp, 'e'); }   // dash in to punish
      if (dist < 2.6) { inp[toward] = 1; return inp; }
    }
    /* ---- anti-air ---- */
    if (!o.grounded() && dist < 1.9 && o.vy < 0.08 && R() < L.anti * 0.3) {
      if (f.alt && f.alt.type === 'rising' && R() < 0.65) { inp.d = 1; return this.tap(inp, 's'); }
      return this.tap(inp, R() < 0.6 ? 'k' : 'p');
    }

    /* ---- escape: after eating a combo, backdash out and keep the distance (zoning) for a while ---- */
    if (this.escapeArm && f.actionable()) {
      this.escapeArm = false;
      if (R() < 0.35 + 0.6 * this.skill) {
        this.intent = 'zone'; this.intentT = 70 + ((R() * 60) | 0); this.keepAway = this.intentT;
        if (dist < 2.6) { inp[away] = 1; return this.tap(inp, 'e'); }
      }
    }
    if (this.keepAway > 0) this.keepAway--;

    /* ---- projectiles: fire whenever there's room and ammo ---- */
    var hasProj = f.ch.special.type === 'projectile' || (f.alt && f.alt.type === 'projectile');
    if (hasProj && !m.hasProjectile(f) && dist > 2.2 && R() < 0.025 + 0.05 * this.skill + (this.keepAway > 0 ? 0.05 : 0)) {
      if (f.ch.special.type === 'projectile') return this.tap(inp, 's');
      inp.d = 1; return this.tap(inp, 's');
    }

    /* ---- super ---- */
    if (f.meter >= 100 && f.hasSuper && R() < 0.02 * L.superUse) {
      var t = f.ch.super.type;
      var good = (t === 'beam' || t === 'wave' || t === 'vehicle' || t === 'drop' || t === 'rain') ? dist < 7 : t === 'reflect' ? m.hazards.some(function (h) { return h.owner === o && h.kind === 'proj'; }) : dist < 3.2;
      if (good && o.state !== 'knockdown' && o.state !== 'getup') return this.tap(inp, 'x');
    }

    /* ---- intent selection ---- */
    this.intentT--;
    if (this.intentT <= 0) this.pickIntent(dist);
    switch (this.intent) {
      case 'approach':
        if (dist > 2.8 && R() < 0.02 + 0.06 * this.skill) { inp[toward] = 1; return this.tap(inp, 'e'); }   // dash to close distance
        if (dist > 1.05) inp[toward] = 1;
        else { this.intent = R() < 0.5 ? 'poke' : 'heavy'; this.intentT = 10; }
        break;
      case 'poke':
        if (dist > 1.15) { inp[toward] = 1; break; }
        if (R() < 0.3 + L.aggro * 0.3) { if (R() < 0.4) inp.d = 1; return this.tap(inp, 'p'); }
        break;
      case 'heavy':
        if (dist > 1.3) { inp[toward] = 1; break; }
        if (R() < 0.35) { if (R() < 0.45) inp.d = 1; return this.tap(inp, 'k'); }
        break;
      case 'zone':
        if (f.alt && (f.alt.type === 'projectile' || f.alt.type === 'rush') && R() < 0.05) {
          if (f.alt.type === 'rush' ? (dist > 1.4 && dist < 3.6) : !m.hasProjectile(f)) { inp.d = 1; return this.tap(inp, 's'); }
        }
        if (this.keepAway > 0 && dist < 3.2) { inp[away] = 1; if (dist < 1.6 && R() < 0.04 * this.skill) return this.tap(inp, 'e'); break; }
        if (f.ch.special.type === 'projectile') { if (!m.hasProjectile(f) && R() < 0.22) return this.tap(inp, 's'); }
        else if (dist > 1.4 && dist < 3.6 && R() < 0.08) return this.tap(inp, 's');
        else if (dist < 1.4) inp[away] = 1;
        else inp[toward] = 1;
        break;
      case 'jumpin':
        if (dist < 3.6 && dist > 1.4) { inp.u = 1; inp[toward] = 1; this.intent = 'air'; this.intentT = 40; }
        else if (dist >= 3.6) inp[toward] = 1;
        else { this.intent = 'poke'; this.intentT = 12; }
        break;
      case 'retreat':
        inp[away] = 1; if (R() < 0.04) this.intentT = 0;
        if (dist < 2.2 && R() < 0.03 * this.skill) return this.tap(inp, 'e');
        break;
      case 'crouch':
        inp.d = 1; if (dist < 1.3 && R() < 0.12) return this.tap(inp, R() < 0.5 ? 'k' : 'p');
        break;
      case 'wait':
      default:
        break;
    }
    return inp;
  };
  AI.prototype.tap = function (inp, btn) {
    if (this.press === btn) return inp; // still holding previous press
    inp[btn] = 1; this.press = btn; this.pressT = 2;
    return inp;
  };
  AI.prototype.pickIntent = function (dist) {
    var L = this.L, r = R(), f = this.f;
    if (this.keepAway > 0) { this.intent = 'zone'; this.intentT = this.keepAway; return; }
    if ((f.ch.special.type === 'projectile' || (f.alt && f.alt.type === 'projectile')) && dist > 1.8 && R() < 0.4) { this.intent = 'zone'; this.intentT = L.think * 2; return; }
    this.intentT = L.think + ((R() * L.think) | 0);
    if (dist > 4.2) {
      if (r < 0.45) this.intent = 'zone'; else if (r < 0.85) this.intent = 'approach'; else this.intent = 'jumpin';
    } else if (dist > 1.8) {
      if (r < L.aggro * 0.6) this.intent = 'approach';
      else if (r < L.aggro * 0.6 + 0.2) this.intent = 'zone';
      else if (r < L.aggro * 0.6 + 0.35) this.intent = 'jumpin';
      else this.intent = R() < 0.5 ? 'wait' : 'retreat';
    } else {
      if (r < L.aggro * 0.5) this.intent = 'poke';
      else if (r < L.aggro * 0.8) this.intent = 'heavy';
      else if (r < L.aggro * 0.8 + 0.12) this.intent = 'crouch';
      else this.intent = R() < 0.5 ? 'retreat' : 'zone';
    }
  };
})();
