/* Knesset Combat 26' — fighters, frame data, hazards (projectiles/supers) and the match/round flow. */
(function () {
  var T = THREE, M = KC.Models;
  KC.PROJ_COOLDOWN = 60;      // reload: 1 s per charge, starts only once every charge is used
  KC.PROJ_MAX = 6;
  KC.GUARD_FRAMES = 150;      // 2.5 s of continuous blocking
  KC.METER_PER_DMG = 0.3;     // ~330 damage dealt fills the super meter
  var STAGE_BOUND = 8.2, MAX_SEP = 6.4, GRAVITY = 0.0115;
  KC.STAGE_BOUND = STAGE_BOUND;
  // Dashing: double-tap forward/back (or hold a direction + the dash key). Frames at 60 fps.
  KC.DASH_TAP = 14;          // max gap between the two taps
  KC.DASH_FRAMES = 16;       // forward dash length (attacks can cancel it from frame 5)
  KC.BACKDASH_FRAMES = 18;   // backdash length
  KC.BACKDASH_INVULN = 7;    // backdash is invincible for its first 7 frames
  KC.DASH_CD = 12;           // short cooldown so dashes can't be chained endlessly
  KC.RUSH_BLOCK_RECOVERY = 30;   // a blocked rush special leaves the charger open (was 18: nearly safe on block)

  /* ---------- frame data (60 fps). hb = [x0, x1, y0, y1] relative to fighter, scaled by height ---------- */
  var MOVES = KC.MOVES = {
    LP: { id: 'LP', anim: ['punchWind', 'punch'], startup: 4, active: 3, recovery: 9, dmg: 45, stun: 15, bstun: 10, push: 0.07, hb: [0.15, 0.98, 1.12, 1.62], level: 'mid', sfx: 'hitL', meter: 6, hitstop: 5, chain: 2 },
    HK: { id: 'HK', anim: ['kickWind', 'kick'], startup: 8, active: 4, recovery: 16, dmg: 76, stun: 19, bstun: 12, push: 0.11, hb: [0.25, 1.28, 0.7, 1.35], level: 'mid', sfx: 'hitH', meter: 9, hitstop: 8 },
    CP: { id: 'CP', anim: ['crouch', 'cpunch'], startup: 4, active: 3, recovery: 9, dmg: 38, stun: 14, bstun: 9, push: 0.06, hb: [0.15, 1.0, 0.45, 0.95], level: 'mid', sfx: 'hitL', meter: 5, hitstop: 5, crouch: true, chain: 2 },
    CK: { id: 'CK', anim: ['sweepWind', 'sweep'], startup: 9, active: 4, recovery: 22, dmg: 66, knockdown: true, bstun: 12, push: 0.1, hb: [0.25, 1.35, 0, 0.38], level: 'low', sfx: 'hitH', meter: 9, hitstop: 8, crouch: true },
    JP: { id: 'JP', anim: ['jump', 'jpunch'], startup: 4, active: 12, recovery: 0, dmg: 55, stun: 16, bstun: 10, push: 0.06, hb: [0.1, 0.95, 0.5, 1.3], level: 'high', sfx: 'hitL', meter: 6, hitstop: 6, air: true },
    JK: { id: 'JK', anim: ['jump', 'jkick'], startup: 6, active: 14, recovery: 0, dmg: 70, stun: 18, bstun: 11, push: 0.08, hb: [0.15, 1.1, -0.05, 0.8], level: 'high', sfx: 'hitH', meter: 8, hitstop: 7, air: true }
  };

  /* ---------- Fighter ---------- */
  var F = KC.Fighter = function (ch, slot, skin, rank, boost) {
    this.ch = ch; this.slot = slot; this.skin = skin;
    this.model = M.buildFighter(ch, { skin: skin });
    this.h = ch.look.height || 1; this.g = ch.look.girth || 1;
    this.stats = Object.assign({ speed: 1, power: 1, defense: 1, jump: 1, projSpeed: 1 }, ch.stats);
    this.pose = M.poses.idle(0);
    this.input = { l: 0, r: 0, u: 0, d: 0, p: 0, k: 0, s: 0, x: 0, e: 0 };
    this.prevInput = Object.assign({}, this.input);
    this.buf = { p: 99, k: 99, s: 99, x: 99, u: 99, e: 99 };
    this.lastTap = {}; this.inT = 0;
    this.maxHealth = 1000;
    this.meter = 0;
    this.yaw = 0;
    // rarity: number of abilities + small damage perk for lower tiers
    this.rar = KC.RARITY[ch.rarity] || KC.RARITY.rare;
    this.stats.power *= this.rar.power;
    this.hasSuper = KC.hasSuper(ch);
    this.alt = KC.hasAlt(ch) ? ch.special2 : null;
    this.passive = ch.passive ? ch.passive.id : null;
    this.survived = false;
    // upgrades (coins) and campaign level scaling for CPU opponents
    this.rank = rank || 0;
    var U = KC.UPGRADE, bst = boost || 1;
    this.stats.power *= (1 + this.rank * U.power) * bst;
    this.stats.defense *= (1 + this.rank * U.defense) * bst;
    this.maxHealth = 1000 + this.rank * U.health + (this.rar.hp || 0) + (ch.stats.hp || 0);   // rarity HP perk + per-fighter balance tuning
    this.projMax = Math.min(KC.PROJ_MAX, 3 + this.rank);
    this.comboMaster = this.rank >= KC.UPGRADE.max;   // Rank 5: Combo Mastery   // 3 on screen by default, +1 per rank, max 6
    this.reset(0, 1);
  };
  var FP = F.prototype;
  FP.reset = function (x, facing) {
    this.x = x; this.y = 0; this.vx = 0; this.vy = 0; this.facing = facing;
    this.health = this.maxHealth; this.state = 'idle'; this.st = 0; this.animT = 0;
    this.move = null; this.moveHit = false; this.stun = 0; this.invuln = 0; this.armor = 0;
    this.blockTime = 0; this.guardBroken = 0; this.ammo = this.projMax; this.reload = 0;
    this.combo = 0; this.comboTimer = 0; this.airUsed = false; this.chainCount = 0;
    this.sup = null; this.jitter = 0; this.lowHit = false; this.dmgTaken = 0; this.blockPose = false;
    this.noHitT = 0; this.curSpec = null; this.rushStop = 0; this.landLag = 0;
    this.dashDir = 0; this.dashCd = 0; this.dashReq = null; this.dashReqT = 0; this.airDashUsed = false; this.airDashT = 0;
    this.yaw = facing > 0 ? 1 : -1;
    this.model.root.position.set(x, 0, 0);
  };
  FP.hw = function () { return 0.3 + 0.12 * (this.g - 1); };
  FP.grounded = function () { return this.y <= 0.0001; };
  FP.isCrouching = function () {
    return this.state === 'crouch' || (this.state === 'blockstun' && this.lowBlock) || (this.state === 'attack' && this.move && this.move.crouch) || (this.state === 'hitstun' && this.lowHit);
  };
  FP.hurtbox = function () {
    var h = this.h, hw = this.hw();
    if (this.state === 'knockdown' || this.state === 'ko' || this.state === 'getup') return null;
    if (!this.grounded()) return { x0: this.x - hw, x1: this.x + hw, y0: this.y + 0.15 * h, y1: this.y + 1.6 * h };
    var top = this.isCrouching() ? 1.12 * h : 1.86 * h;
    if (this.state === 'super' && this.sup && this.sup.type === 'spin') top = 1.9 * h;
    return { x0: this.x - hw, x1: this.x + hw, y0: 0, y1: top };
  };
  FP.actionable = function () { return this.state === 'idle' || this.state === 'walk' || this.state === 'crouch'; };
  FP.setState = function (s) { this.state = s; this.st = 0; };
  FP.fwdHeld = function () { return this.facing > 0 ? this.input.r : this.input.l; };
  FP.backHeld = function () { return this.facing > 0 ? this.input.l : this.input.r; };

  FP.readInput = function (inp) {
    var pi = this.input;
    ['p', 'k', 's', 'x', 'u', 'e'].forEach(function (k) { this.buf[k] = (inp[k] && !pi[k]) ? 0 : this.buf[k] + 1; }, this);
    // double-tap a direction to dash (CPU fighters press the dash button instead)
    this.inT++;
    if (this.dashReqT > 0) { this.dashReqT--; if (this.dashReqT === 0) this.dashReq = null; }
    if ((inp.dl || inp.dr) && !inp.d) { this.dashReq = inp.dr ? 'r' : 'l'; this.dashReqT = 8; this.lastTap.l = this.lastTap.r = -99; }
    else if (!inp.ai) ['l', 'r'].forEach(function (dk) {
      if (inp[dk] && !pi[dk]) {
        if (this.inT - (this.lastTap[dk] || -99) <= KC.DASH_TAP && !inp.d) { this.dashReq = dk; this.dashReqT = 8; this.lastTap[dk] = -99; }
        else this.lastTap[dk] = this.inT;
        this.lastTap[dk === 'l' ? 'r' : 'l'] = -99;
      }
    }, this);
    this.prevInput = pi;
    this.input = inp;
  };
  FP.fresh = function (k) { return this.buf[k] <= 7; };
  FP.consume = function (k) { this.buf[k] = 99; };

  FP.faceOpp = function () {
    if (!this.opp) return;
    var d = this.opp.x - this.x;
    if (Math.abs(d) > 0.05) this.facing = d > 0 ? 1 : -1;
  };

  FP.startMove = function (mv) {
    this.move = mv; this.moveHit = false; this.setState('attack');
    this.atkId = (this.atkId || 0) + 1;   // unique id per attack (moves are shared objects)
    if (mv.air) this.airUsed = true;
    KC.Audio.play('whiff');
  };

  FP.tryAttack = function (m, cancel) {
    var air = !this.grounded();
    if (!air && this.fresh('x') && this.meter >= 100 && this.hasSuper) { this.consume('x'); this.startSuper(m); return true; }
    if (!air && this.fresh('s')) {
      var sp = (this.input.d && this.alt) ? this.alt : this.ch.special;
      if (sp.type === 'projectile' && m.hasProjectile(this)) { /* out of ammo: reloading */ }
      else { this.consume('s'); this.startSpecial(m, sp); return true; }
    }
    if (cancel === 'special') return false;
    var crouch = this.input.d;
    if (this.fresh('k')) {
      if (air) { if (this.airUsed) return false; this.consume('k'); this.startMove(MOVES.JK); return true; }
      if (cancel === 'chain' && (!this.comboMaster || this.chainCount >= 3)) return false;
      this.chainCount = cancel === 'chain' ? this.chainCount + 1 : 0;
      this.consume('k'); this.startMove(crouch ? MOVES.CK : MOVES.HK); return true;
    }
    if (this.fresh('p')) {
      if (air) { if (this.airUsed) return false; this.consume('p'); this.startMove(MOVES.JP); return true; }
      if (cancel === 'chain' && this.chainCount >= (this.comboMaster ? 3 : 2)) return false;
      this.consume('p');
      this.chainCount = cancel === 'chain' ? this.chainCount + 1 : 0;
      this.startMove(crouch ? MOVES.CP : MOVES.LP); return true;
    }
    return false;
  };

  FP.startSpecial = function (m, sp) {
    sp = sp || this.ch.special;
    this.curSpec = sp; this.moveHit = false;
    if (sp.type === 'rush') { this.setState('rush'); this.rushStop = 0; this.rushBlocked = false; this.armor = sp.armor ? 1 : 0; KC.Audio.play('rush'); }
    else if (sp.type === 'rising') { this.setState('rising'); this.vx = 0; this.invuln = Math.max(this.invuln, 10); KC.Audio.play('whiff'); }
    else if (sp.type === 'counter') { this.setState('counter'); this.vx = 0; KC.Audio.play('select'); }
    else this.setState('special');
    m.callout(this, sp.name, false);
  };
  FP.startSuper = function (m) {
    this.meter = 0;
    this.sup = { type: this.ch.super.type, t: 0, hits: 0, landed: false, phase: 0 };
    this.setState('super');
    this.invuln = 70;
    this.vx = 0;
    m.startSuperFreeze(this);
  };

  FP.jump = function () {
    var dir = this.fwdHeld() ? 1 : this.backHeld() ? -1 : 0;
    this.vx = dir * 0.072 * this.stats.speed * this.facing;
    this.vy = 0.19 * this.stats.jump;
    this.y = 0.001; this.airUsed = false;
    this.setState('jump'); this.jumpDir = dir; this.airDashUsed = false; this.airDashT = 0;
    KC.Audio.play('jump');
  };

  /* ---------- dashing ---------- */
  // returns 1 (forward), -1 (back) or 0
  FP.wantDash = function () {
    if (this.dashCd > 0) return 0;
    var raw = null;
    if (this.fresh('e')) raw = this.input.l ? 'l' : this.input.r ? 'r' : 'fwd';
    else if (this.dashReq) raw = this.dashReq;
    if (!raw) return 0;
    return raw === 'fwd' ? 1 : ((raw === 'r') === (this.facing > 0) ? 1 : -1);
  };
  FP.useDash = function () { this.consume('e'); this.dashReq = null; this.dashReqT = 0; };
  FP.startDash = function (m, dir) {
    this.useDash();
    this.dashDir = dir; this.blockPose = false; this.setState('dash');
    var sp = Math.min(1.15, this.stats.speed) * ((this.ch.dash && this.ch.dash.dist) || 1);
    this.vx = (dir > 0 ? 0.17 : -0.13) * sp * this.facing;
    if (dir < 0) this.invuln = Math.max(this.invuln, KC.BACKDASH_INVULN);
    m.fx.hit(this.x - this.facing * dir * 0.3, 0.1, '#d9cdb4', 6, -this.facing * dir);
    m.fx.ring(this.x, 0.06, dir > 0 ? '#ffffff' : '#9ad1ff', 0.8, false);
    KC.Audio.play('dash');
  };
  FP.startAirDash = function (m, dir) {
    this.useDash();
    this.airDashUsed = true; this.airDashT = 10; this.dashDir = dir; this.jumpDir = 0;
    this.vx = dir * 0.15 * Math.min(1.15, this.stats.speed) * ((this.ch.dash && this.ch.dash.dist) || 1) * this.facing;
    this.vy = Math.max(this.vy, 0);
    m.fx.ring(this.x, this.y + 1.0 * this.h, '#ffffff', 0.9, true);
    KC.Audio.play('dash');
  };

  /* ---------- per-frame logic ---------- */
  FP.step = function (m) {
    var inp = this.input;
    this.st++; this.animT += 1 / 60;
    if (this.invuln > 0) this.invuln--;
    if (this.dashCd > 0) this.dashCd--;
    if (this.comboTimer > 0) { this.comboTimer--; if (this.comboTimer === 0) this.combo = 0; }
    this.noHitT++;
    // Projectile ammo: mash all charges, then reload them all (1 s per charge) once you're empty
    if (this.reload > 0) { this.reload--; if (this.reload === 0) { this.ammo = this.projMax; if (m.phase === 'fight') m.callout(this, 'RELOADED', false); } }
    // Guard limit: holding block for more than 2.5 s (150 frames) breaks your guard
    if (this.guardBroken > 0) this.guardBroken--;
    var blocking = this.state === 'blockstun' || ((this.state === 'idle' || this.state === 'walk' || this.state === 'crouch') && this.blockPose);
    if (blocking) {
      this.blockTime = (this.blockTime || 0) + 1;
      if (this.blockTime >= KC.GUARD_FRAMES) {
        this.blockTime = 0; this.guardBroken = 60; this.blockPose = false;
        this.setState('hitstun'); this.stun = 36; this.lowHit = false; this.vx = -0.06 * this.facing;
        m.callout(this, 'GUARD BREAK!', true); m.fx.ring(this.x, 1.2 * this.h, '#ff5a5a', 1.4, true); m.fx.hit(this.x, 1.3 * this.h, '#ff8a8a', 18);
        KC.Audio.play('hitH'); m.shake(0.12);
      }
    } else if (!(this.backHeld() && this.grounded() && (this.state === 'idle' || this.state === 'walk' || this.state === 'crouch'))) this.blockTime = Math.max(0, (this.blockTime || 0) - 2);   // only recovers once you let go of block
    if (this.passive === 'regen' && this.noHitT > 120 && this.health > 0 && this.health < this.maxHealth * 0.6 && m.phase === 'fight') {
      this.health = Math.min(this.maxHealth * 0.6, this.health + 0.2);
    }
    var ground = this.grounded();

    switch (this.state) {
      case 'idle': case 'walk': case 'crouch': {
        this.faceOpp();
        if (m.phase !== 'fight') { this.vx *= 0.7; this.state = 'idle'; break; }
        if (this.tryAttack(m)) break;
        var dd = this.wantDash();
        if (dd) { this.startDash(m, dd); break; }
        if (inp.u) { this.jump(); break; }
        this.blockPose = false;
        if (inp.d) { if (this.state !== 'crouch') this.setState('crouch'); this.vx *= 0.6; this.blockPose = this.backHeld() && m.threatTo(this); }
        else if (this.fwdHeld()) { if (this.state !== 'walk') this.setState('walk'); this.walkDir = 1; this.vx = 0.055 * this.stats.speed * this.facing; }
        else if (this.backHeld()) {
          if (this.state !== 'walk') this.setState('walk'); this.walkDir = -1;
          this.blockPose = m.threatTo(this);
          this.vx = this.blockPose ? 0 : -0.045 * this.stats.speed * this.facing;
        }
        else { if (this.state !== 'idle') this.setState('idle'); this.vx *= 0.6; }
        break;
      }
      case 'jump': {
        if (this.tryAttack(m)) break;
        var ad = this.wantDash();
        if (ad && !this.airDashUsed && this.y > 0.35) this.startAirDash(m, ad);
        break;
      }
      case 'dash': {
        var fwdD = this.dashDir > 0, dlen = fwdD ? KC.DASH_FRAMES : KC.BACKDASH_FRAMES;
        if (this.st > (fwdD ? 7 : 9)) this.vx *= 0.82;
        if (this.st % 3 === 0 && this.st < dlen - 4) m.fx.hit(this.x - this.facing * this.dashDir * 0.3, 0.08, '#d9cdb4', 1, -this.facing * this.dashDir);
        // forward dash: cancel into an attack (dash-punch) or a running jump once it gets going
        if (fwdD && this.st >= ((this.ch.dash && this.ch.dash.cancel) || 5)) {
          if (this.tryAttack(m)) break;
          if (inp.u) { var keep = this.vx; this.jump(); if (this.jumpDir >= 0) this.vx = keep * 0.6 + this.vx * 0.4; break; }
        }
        if (this.st >= dlen) { this.dashCd = (this.ch.dash && this.ch.dash.cd) || KC.DASH_CD; this.setState(inp.d ? 'crouch' : 'idle'); }
        break;
      }
      case 'land': if (this.st >= (this.landLag || 4)) { this.landLag = 0; this.setState('idle'); } this.vx *= 0.6; break;
      case 'rising': {
        if (this.st === 4) {
          this.vy = 0.2 * Math.min(1.1, this.stats.jump); this.vx = 0.035 * this.facing; this.y = 0.001;
          m.fx.ring(this.x, 0.1, (this.curSpec && this.curSpec.color) || '#ffffff', 0.8, false); KC.Audio.play('rush');
        }
        if (this.st >= 4 && this.st <= 18) m.boxCheck(this, [-0.1, 0.85, 0.5, 2.1], { dmg: (this.curSpec && this.curSpec.dmg) || 92, knockdown: true, launch: true, chip: 8, bstun: 14, push: 0.06, hitstop: 9, level: 'mid', sfx: 'hitH', meter: 12 });
        if (this.st > 6 && this.st % 3 === 0 && this.y > 0.2) m.fx.hit(this.x + this.facing * 0.3, this.y + 1.9 * this.h, (this.curSpec && this.curSpec.color) || '#ffffff', 2, 0);
        if (this.st > 5 && this.grounded()) { this.setState('land'); this.landLag = 14; }
        break;
      }
      case 'counter': {
        this.vx *= 0.6;
        if (this.st % 6 === 0 && this.st < 27) m.fx.ring(this.x + this.facing * 0.35, 1.2 * this.h, '#9ad1ff', 0.35, true);
        if (this.st >= 27 + 16) this.setState('idle');
        break;
      }
      case 'counterHit': this.vx *= 0.7; if (this.st >= 24) this.setState('idle'); break;
      case 'attack': {
        var mv = this.move, total = mv.startup + mv.active + mv.recovery;
        if (!mv.air) this.vx *= 0.7;
        if (this.st > mv.startup && this.st <= mv.startup + mv.active) m.meleeCheck(this, mv);
        if (this.moveHit && this.st > mv.startup) {
          if (mv.id === 'LP' || mv.id === 'CP' || this.comboMaster) { if (this.tryAttack(m, 'chain')) break; }
          else if (!mv.air) { if (this.tryAttack(m, 'special')) break; }
        }
        if (!mv.air && this.st >= total) { this.setState(this.input.d ? 'crouch' : 'idle'); this.move = null; }
        if (mv.air && this.st >= mv.startup + mv.active) { /* keep falling in attack pose until landing */ }
        break;
      }
      case 'special': {
        this.vx *= 0.6;
        if (this.st === 13) m.spawnProjectile(this, this.curSpec);
        // Combo Mastery: cancel a special into your Super
        if (this.comboMaster && this.st > 13 && this.fresh('x') && this.meter >= 100 && this.hasSuper) { this.consume('x'); this.startSuper(m); break; }
        if (this.st >= 38) this.setState('idle');
        break;
      }
      case 'rush': {
        var spd = 0.2 * Math.min(1.15, this.stats.speed);
        if (this.st < 9) this.vx = 0;
        else if (this.st < 30 && !this.moveHit) {
          this.vx = spd * this.facing;
          if (m.boxCheck(this, [0.0, 0.85, 0.4, 1.7], { dmg: (this.curSpec && this.curSpec.dmg) || 95, knockdown: true, chip: 10, bstun: 16, push: 0.12, hitstop: 9, level: 'mid', sfx: 'hitH', meter: 12 }) === 'block') this.rushBlocked = true;
          if (this.st % 3 === 0) m.fx.hit(this.x - this.facing * 0.3, 0.1, '#d9cdb4', 2, -this.facing);
        } else if (this.comboMaster && this.moveHit && this.fresh('x') && this.meter >= 100 && this.hasSuper) { this.consume('x'); this.startSuper(m); break;
        } else {
          this.vx *= 0.7; this.armor = 0;
          if (!this.rushStop) this.rushStop = this.st;
          if (this.st - this.rushStop >= (this.rushBlocked ? KC.RUSH_BLOCK_RECOVERY : 18)) { this.rushStop = 0; this.setState('idle'); }   // a blocked charge is punishable
        }
        break;
      }
      case 'super': m.superStep(this); break;
      case 'recover': this.vx *= 0.7; if (this.st >= this.recoverFor) { this.setState('idle'); this.sup = null; } break;
      case 'hitstun': case 'blockstun': {
        this.vx *= 0.85;
        this.stun--;
        if (this.state === 'blockstun' && this.backHeld()) this.lowBlock = this.input.d;
        if (this.stun <= 0) this.setState(this.input.d ? 'crouch' : 'idle');
        break;
      }
      case 'airhit': break;
      case 'knockdown': this.vx *= 0.8; if (this.st >= 38 && m.phase === 'fight') { this.setState('getup'); this.invuln = 24; } break;
      case 'getup': if (this.st >= 18) this.setState('idle'); break;
      case 'ko': this.vx *= 0.85; break;
      default: break;
    }

    // physics
    if (!this.grounded() || this.state === 'jump' || this.state === 'airhit' || (this.state === 'attack' && this.move && this.move.air) || this.vy > 0) {
      this.vy -= GRAVITY;
      if (this.airDashT > 0) { this.airDashT--; this.vy = Math.max(this.vy, 0); }   // air dash: hold altitude briefly
      this.y += this.vy;
      if (this.y <= 0) {
        this.y = 0; this.vy = 0;
        if (this.state === 'airhit') { this.setState(this.health <= 0 ? 'ko' : 'knockdown'); this.vx *= 0.4; KC.Audio.play('land'); m.fx.hit(this.x, 0.1, '#d9cdb4', 6); m.shake(0.08); }
        else if (this.state === 'ko') { }
        else if (this.state === 'jump' || this.state === 'attack') { this.setState('land'); this.move = null; this.vx = 0; KC.Audio.play('land'); }
      }
    }
    this.x += this.vx;
    if (this.x < -STAGE_BOUND) { this.x = -STAGE_BOUND; if (this.vx < 0) this.vx = 0; }
    if (this.x > STAGE_BOUND) { this.x = STAGE_BOUND; if (this.vx > 0) this.vx = 0; }
  };

  /* ---------- animation ---------- */
  FP.animate = function (m, dt) {
    var P = M.poses, t = this.animT, target, k = 0.3;
    switch (this.state) {
      case 'idle': target = this.blockPose ? P.block() : P.idle(t); k = 0.22; break;
      case 'walk': target = this.blockPose ? P.block() : P.walk(t, this.walkDir || 1); k = 0.25; break;
      case 'crouch': target = this.blockPose ? P.crouchBlock() : P.crouch(t); k = 0.35; break;
      case 'jump': target = this.airDashT > 0 ? P.dash(t) : (this.jumpDir !== 0 && this.vy > -0.05) ? P.flip(t) : P.jump(t); k = this.airDashT > 0 ? 0.45 : 0.25; break;
      case 'dash': target = this.dashDir > 0 ? P.dash(t) : P.backdash(t); k = 0.45; break;
      case 'land': target = P.crouch(0); target.hipsY = -0.2; k = 0.5; break;
      case 'attack': {
        var mv = this.move;
        if (!mv) { target = P.idle(t); break; }
        target = this.st <= mv.startup ? P[mv.anim[0]](t) : P[mv.anim[1]](t);
        k = this.st <= mv.startup ? 0.5 : 0.75;
        if (this.st > mv.startup + mv.active + 2 && !mv.air) { k = 0.2; target = mv.crouch ? P.crouch(t) : P.idle(t); }
        break;
      }
      case 'special': target = this.st < 13 ? P.throwWind() : P.throw(); k = this.st < 13 ? 0.35 : 0.6; break;
      case 'rising': target = this.st < 4 ? P.crouch(0) : P.uppercut(); k = this.st < 4 ? 0.6 : 0.5; break;
      case 'counter': target = P.counterStance(t); k = 0.5; break;
      case 'counterHit': target = this.st < 12 ? P.punch() : P.idle(t); k = 0.6; break;
      case 'rush': target = this.st < 9 ? P.crouch(0) : (this.st < 30 && !this.moveHit ? P.rush(t) : P.idle(t)); k = 0.4; break;
      case 'super': target = this.superPose(m, t); k = 0.45; break;
      case 'recover': target = P.idle(t); k = 0.15; break;
      case 'hitstun': target = this.lowHit ? P.hitLow() : P.hit(t); k = 0.6; break;
      case 'blockstun': target = this.lowBlock ? P.crouchBlock() : P.block(); k = 0.6; break;
      case 'airhit': target = P.airHit(); k = 0.3; break;
      case 'knockdown': case 'ko': target = P.lying(); k = 0.25; break;
      case 'getup': target = P.getup(); k = 0.2; break;
      case 'victory': target = P.victory(this.ch.victory, t); k = 0.18; break;
      case 'defeat': target = P.defeated(t); k = 0.1; break;
      case 'intro': target = P.victory(this.ch.victory, t); k = 0.15; break;
      default: target = P.idle(t);
    }
    M.lerpPose(this.pose, target, Math.min(1, k * dt * 60));
    if (target.bodyRy !== undefined && this.state === 'super' && this.sup && this.sup.type === 'spin') this.pose.bodyRy = target.bodyRy;
    M.applyPose(this.model, this.pose);
    // root transform
    var r = this.model.root;
    var jit = this.jitter > 0 ? (Math.random() - 0.5) * 0.06 : 0;
    r.position.set(this.x + jit, this.y, 0);
    var face = (this.state === 'victory' || this.state === 'intro' || this.state === 'defeat') ? 0.3 * this.facing : this.facing;
    this.yaw += (face - this.yaw) * Math.min(1, dt * 14);
    r.rotation.y = this.yaw * (Math.PI / 2 - 0.32);
  };
  FP.superPose = function (m, t) {
    var P = M.poses, s = this.sup;
    if (m.superFreeze > 0 && m.superUser === this) return P.power(t);
    switch (s.type) {
      case 'spin': var hs = P.headstand(t); hs.bodyRy = s.t * 0.55; return hs;
      case 'flurry': return s.phase === 0 ? P.rush(t) : P.flurry(t);
      case 'wave': return s.t < 10 ? P.throwWind() : P.throw();
      case 'beam': return P.power(t);   // calls the beam down from the sky
      case 'rain': return P.power(t);
      case 'drop': case 'vehicle': return P.victory('point', t);
      case 'reflect': return P.counterStance(t);
    }
    return P.idle(t);
  };

  /* ---------- hazards (projectiles + super effects) ---------- */
  function Hazard(o) { Object.assign(this, { alive: true, t: 0, cd: 0, hits: 1, interval: 6, hitCount: 0, y0: 0, y1: 0.5, hw: 0.25, vx: 0, vy: 0, kind: 'proj' }, o); }

  /* ---------- Match ---------- */
  var Match = KC.Match = function (game, opts) {
    this.game = game; this.scene = game.scene; this.camera = game.camera; this.stage = game.stage;
    this.opts = opts;
    this.fx = game.fx;
    var rk = opts.ranks || [0, 0], bo = opts.boosts || [1, 1];
    var a = new F(opts.chars[0], 0, opts.skins[0], rk[0], bo[0]), b = new F(opts.chars[1], 1, opts.skins[1], rk[1], bo[1]);
    a.opp = b; b.opp = a;
    this.f = [a, b];
    this.scene.add(a.model.root); this.scene.add(b.model.root);
    this.hazards = [];
    this.round = 1; this.wins = [0, 0];
    this.roundsToWin = opts.roundsToWin || 2;
    this.timerMax = opts.timer || 99;
    this.result = { supers: [0, 0], perfects: [0, 0], superKO: false, roundWinners: [] };
    this.hitstop = 0; this.superFreeze = 0; this.timeScale = 1; this.shakeAmt = 0;
    this.camPos = new T.Vector3(0, 3, 10); this.camLook = new T.Vector3(0, 1.2, 0);
    this.paused = false;
    this.stage.setMode(opts.stageMode || 'day');
    this.setPhase('intro');
    this.positionFighters();
    KC.HUD.setup(this);
  };
  var MP = Match.prototype;
  MP.positionFighters = function () {
    this.f[0].reset(-2.2, 1); this.f[1].reset(2.2, -1);
    this.hazards.forEach(function (h) { if (h.mesh) h.mesh.parent && h.mesh.parent.remove(h.mesh); });
    this.hazards = [];
    this.fx.clear();
  };
  MP.setPhase = function (p) { this.phase = p; this.pt = 0; };
  MP.destroy = function () {
    var sc = this.scene;
    this.f.forEach(function (f) { sc.remove(f.model.root); });
    this.hazards.forEach(function (h) { if (h.mesh) sc.remove(h.mesh); });
    this.hazards = [];
    this.fx.clear();
  };

  MP.callout = function (f, text, isSuper) { KC.HUD.callout(f.slot, text, isSuper); };
  MP.shake = function (a) { this.shakeAmt = Math.max(this.shakeAmt, a); };
  MP.threatTo = function (f) {
    var o = f.opp, d = Math.abs(o.x - f.x);
    if ((o.state === 'attack' || o.state === 'rush' || o.state === 'super' || o.state === 'rising') && d < 2.6) return true;
    for (var i = 0; i < this.hazards.length; i++) { var h = this.hazards[i]; if (h.owner === o && Math.abs(h.x - f.x) < 3.5) return true; }
    return false;
  };
  MP.hasProjectile = function (f) { return f.ammo <= 0; };   // true = can't throw (empty, reloading)


  /* ---- hit resolution ---- */
  MP.boxHits = function (att, box, def) {
    var h = att.h, x0, x1;
    if (att.facing > 0) { x0 = att.x + box[0] * h; x1 = att.x + box[1] * h; } else { x0 = att.x - box[1] * h; x1 = att.x - box[0] * h; }
    var y0 = att.y + box[2] * h, y1 = att.y + box[3] * h;
    var hb = def.hurtbox(); if (!hb) return false;
    return x0 < hb.x1 && x1 > hb.x0 && y0 < hb.y1 && y1 > hb.y0;
  };
  MP.meleeCheck = function (att, mv) {
    if (att.moveHit) return;
    var def = att.opp;
    if (def.invuln > 0) return;
    if (this.boxHits(att, mv.hb, def)) {
      var r = this.resolveHit(att, def, mv, att.x, true);
      if (r) att.moveHit = true;
    }
  };
  MP.boxCheck = function (att, box, hit) {
    if (att.moveHit) return false;
    var def = att.opp;
    if (def.invuln > 0) return false;
    if (this.boxHits(att, box, def)) { var r = this.resolveHit(att, def, hit, att.x, true); if (r) { att.moveHit = true; return r; } }
    return false;
  };
  MP.canBlock = function (def, hit, srcX) {
    if (!def.grounded()) return false;
    var okState = def.state === 'idle' || def.state === 'walk' || def.state === 'crouch' || def.state === 'blockstun';
    if (!okState) return false;
    var awayHeld = srcX > def.x ? def.input.l : def.input.r;
    if (!awayHeld) return false;
    if (def.guardBroken > 0) return false;   // guard break cooldown
    var crouching = !!def.input.d;
    if (hit.level === 'low' && !crouching) return false;
    if (hit.level === 'high' && crouching) return false;
    return true;
  };
  MP.resolveHit = function (att, def, hit, srcX, melee) {
    if (def.state === 'ko' || def.state === 'knockdown' || def.state === 'getup' || def.invuln > 0) return null;
    if (this.phase !== 'fight' && this.phase !== 'ko') return null;
    var dir = srcX <= def.x ? 1 : -1;
    if (Math.abs(srcX - def.x) < 0.01) dir = att.facing;
    var cx = def.x - dir * def.hw() * 0.8, cy = Math.min(def.y + 1.3 * def.h, def.y + ((hit.hb ? (hit.hb[2] + hit.hb[3]) / 2 : 1.2) * att.h));
    def.noHitT = 0;
    // counter stance (Down + Special for some Epic/Legendary fighters)
    if (def.state === 'counter' && def.st >= 3 && def.st <= 26) {
      def.setState('counterHit'); def.invuln = 22; def.facing = att.x >= def.x ? 1 : -1;
      this.hitstop = 10;
      this.fx.ring(def.x, 1.2 * def.h, '#9ad1ff', 1.4, true); this.fx.hit(cx, cy, '#9ad1ff', 18, -dir);
      KC.Audio.play('gavel'); this.shake(0.15);
      this.callout(def, 'COUNTER!', true);
      this.addMeter(def, 15);
      if (melee && Math.abs(att.x - def.x) < 2.8) this.resolveHit(def, att, { dmg: (def.curSpec && def.curSpec.dmg) || 110, knockdown: true, hitstop: 12, sfx: 'hitS', meter: 8, level: 'mid' }, def.x, true);
      return 'countered';
    }
    // armor (rush specials)
    if (def.armor > 0 && def.state === 'rush' && def.st < 30) {
      def.armor--;
      def.health -= Math.round(hit.dmg * 0.5 * att.stats.power / def.stats.defense);
      this.hitstop = 6; def.jitter = 6;
      this.fx.hit(cx, cy, '#9ad1ff', 10, dir); this.fx.ring(cx, cy, '#9ad1ff', 0.7, true);
      KC.Audio.play('block');
      if (def.health <= 0) { def.health = 0; this.koFighter(att, def, dir, hit); }
      return 'armor';
    }
    if (this.canBlock(def, hit, srcX)) {
      var chip = Math.round((hit.chip || 0) * att.stats.power / def.stats.defense * (def.passive === 'thickskin' ? 0.88 : 1));
      def.health -= chip;
      this.survive(def);
      def.setState('blockstun'); def.stun = hit.bstun || 10; def.lowBlock = !!def.input.d;
      def.vx = (hit.push || 0.06) * dir * 1.1;
      if (melee && Math.abs(def.x) > STAGE_BOUND - 0.15) att.vx = -(hit.push || 0.06) * dir * 0.9;
      // blocked: the attacker's super does not charge
      this.hitstop = Math.max(this.hitstop, 4);
      this.fx.hit(cx, cy, '#7fc4ff', 6, dir);
      KC.Audio.play('block');
      if (def.health <= 0) { def.health = 0; this.koFighter(att, def, dir, hit); }
      return 'block';
    }
    // clean hit
    var comboing = def.state === 'hitstun' || def.state === 'airhit';
    def.combo = comboing ? def.combo + 1 : 1; def.comboTimer = 50;
    var scale = Math.max(hit.superHit ? 0.6 : 0.4, 1 - 0.1 * (def.combo - 1));
    var mastery = att.comboMaster && def.combo >= 4 ? 1.15 : 1;   // Combo Mastery: +15% from the 4th hit on
    var dmg = Math.max(1, Math.round(hit.dmg * att.stats.power / def.stats.defense * scale * mastery * (def.passive === 'thickskin' ? 0.88 : 1)));
    def.health -= dmg; def.dmgTaken += dmg;
    this.survive(def);
    if (!hit.superHit) this.addMeter(att, dmg * KC.METER_PER_DMG);   // super charges by damage dealt (supers never charge it)
    this.addMeter(def, dmg * 0.04);
    if (hit.superHit && att.sup) att.sup.landed = true;
    def.move = null; def.armor = 0;
    var heavy = (hit.hitstop || 5) >= 8;
    if (def.health <= 0) {
      def.health = 0;
      this.koFighter(att, def, dir, hit);
    } else if (hit.knockdown || !def.grounded() || hit.launch) {
      def.setState('airhit'); def.vy = hit.knockdown ? 0.14 : 0.11; def.vx = 0.05 * dir; def.y = Math.max(def.y, 0.01);
    } else {
      def.lowHit = def.isCrouching();
      def.setState('hitstun'); def.stun = hit.stun || 14;
      def.vx = (hit.push || 0.06) * dir * (att.comboMaster && !hit.superHit ? 0.45 : 1);   // mastery strings keep the target close
      if (melee && Math.abs(def.x) > STAGE_BOUND - 0.15) att.vx = -(hit.push || 0.06) * dir * 0.9;
    }
    this.hitstop = Math.max(this.hitstop, hit.hitstop || 5);
    def.jitter = this.hitstop;
    this.fx.hit(cx, cy, heavy ? '#ffb347' : '#ffe08a', heavy ? 16 : 9, dir);
    this.fx.papers_(cx, cy, heavy ? 6 : 3, dir);
    if (heavy) this.fx.ring(cx, cy, '#ffffff', 0.8, true);
    this.shake(heavy ? 0.12 : 0.05);
    KC.Audio.play(hit.sfx || 'hitL');
    if (def.combo >= 2) KC.HUD.combo(att.slot, def.combo, att.comboMaster && def.combo >= 4);
    if (heavy || def.combo >= 3) { this.stage.cheer(heavy ? 0.25 : 0.15, def.x); }
    return 'hit';
  };
  MP.addMeter = function (f, v) {
    if (!f.hasSuper) { f.meter = 0; return; }
    if (f.passive === 'momentum') v *= 1.35;
    f.meter = Math.min(100, f.meter + v);
  };
  MP.survive = function (def) {
    if (def.health <= 0 && def.passive === 'survivor' && !def.survived && this.phase === 'fight') {
      def.health = 1; def.survived = true;
      this.callout(def, 'SURVIVOR!', true);
      this.fx.ring(def.x, 1.2 * def.h, '#f2c14e', 1.6, true);
      KC.Audio.say('Survivor!');
    }
  };
  MP.koFighter = function (att, def, dir, hit) {
    def.setState('airhit'); def.vy = 0.17; def.vx = 0.07 * dir; def.y = Math.max(def.y, 0.01);
    def.health = 0;
    if (this.phase === 'fight') {
      this.koBy = att; this.koVictim = def;
      if (hit.superHit) this.result.superKO = true;
      this.setPhase('ko');
      this.hitstop = 16; this.timeScale = 0.3;
      KC.Audio.play('ko'); this.shake(0.3);
      this.stage.cheer(1, def.x); KC.Audio.play('cheer', 1.3);
    }
  };

  /* ---- projectiles + supers ---- */
  MP.addHazard = function (o) { var h = new Hazard(o); if (h.mesh) this.scene.add(h.mesh); this.hazards.push(h); return h; };
  MP.spawnProjectile = function (f, spec) {
    f.ammo = Math.max(0, f.ammo - 1);
    if (f.ammo === 0) f.reload = KC.PROJ_COOLDOWN * f.projMax;
    var sp = spec || f.ch.special, mesh = M.buildProp(sp.proj, f.ch.super ? f.ch.super.color : null);
    var y = 1.22 * f.h;
    mesh.position.set(f.x + f.facing * 0.7, y, 0.05);
    if (f.facing < 0) mesh.rotation.y += Math.PI;
    this.addHazard({ kind: 'proj', owner: f, x: f.x + f.facing * 0.7, y: y, y0: -0.25, y1: 0.25, hw: 0.22, vx: 0.13 * f.stats.projSpeed * f.facing,
      mesh: mesh, hit: { dmg: sp.dmg || 82, stun: 18, bstun: 14, chip: 12, push: 0.09, hitstop: 7, level: 'mid', sfx: 'hitH', meter: 8 }, life: 160 });
    KC.Audio.play('proj');
  };
  MP.startSuperFreeze = function (f) {
    this.superFreeze = 48; this.superUser = f;
    KC.Audio.play('super');
    KC.HUD.superCut(f);
    this.callout(f, f.ch.super.name, true);
    this.fx.ring(f.x, 1.0 * f.h, f.ch.super.color, 1.5, true);
    this.stage.cheer(0.5, f.x);
  };
  MP.superHit = function (f, extra) {
    var base = Object.assign({ dmg: 30, stun: 16, bstun: 8, chip: 5, push: 0.02, hitstop: 3, level: 'mid', sfx: 'hitL', meter: 0, superHit: true }, extra || {});
    var mult = (f.ch.super && f.ch.super.mult) || 1;   // per-fighter super tuning
    if (mult !== 1) { base.dmg = Math.round(base.dmg * mult); base.chip = Math.round(base.chip * mult); }
    return base;
  };
  MP.superStep = function (f) {
    var s = f.sup, o = f.opp, self = this;
    s.t++;
    var col = f.ch.super.color;
    function finish(n) { f.setState('recover'); f.recoverFor = n; f.pose.bodyRy = f.pose.bodyRy % (Math.PI * 2); if (s.landed) self.result.supers[f.slot]++; }
    switch (s.type) {
      case 'spin': {
        if (s.t < 56) {
          f.vx = 0.19 * f.facing;
          if (Math.abs(f.x) >= STAGE_BOUND - 0.01) f.vx = 0;
          if (s.t % 6 === 0 && o.invuln <= 0 && this.boxHits(f, [-0.5, 0.95, 0, 1.9], o)) {
            var last = s.hits >= 5;
            var r = this.resolveHit(f, o, this.superHit(f, last ? { dmg: 70, knockdown: true, hitstop: 10, sfx: 'hitS' } : { dmg: 36 }), f.x - f.facing * 0.2, false);
            if (r) s.hits++;
            if (last) s.t = 56;
          }
          if (s.t % 4 === 0) this.fx.hit(f.x, 1.0, col, 3, 0);
        } else { f.vx = 0; finish(20); }
        break;
      }
      case 'flurry': {
        if (s.phase === 0) {
          f.vx = 0.24 * f.facing;
          if (Math.abs(o.x - f.x) < 1.05 + o.hw() && o.invuln <= 0 && o.state !== 'knockdown') {
            var r0 = this.resolveHit(f, o, this.superHit(f, { dmg: 25, stun: 30 }), f.x, true);
            f.vx = 0;
            if (r0 === 'hit') { s.phase = 1; s.t = 0; } else { finish(26); }
          } else if (s.t > 18) { f.vx = 0; finish(26); }
        } else {
          f.vx = 0;
          if (o.state === 'hitstun') { o.stun = Math.max(o.stun, 10); o.x = f.x + f.facing * (0.85 + o.hw()); o.x = Math.max(-STAGE_BOUND, Math.min(STAGE_BOUND, o.x)); }
          if (s.t % 4 === 0 && s.hits < 10 && o.state === 'hitstun') {
            this.resolveHit(f, o, this.superHit(f, { dmg: 22, stun: 30, push: 0, hitstop: 2 }), f.x, true); s.hits++;
          }
          if (s.hits >= 10 || o.state !== 'hitstun') {
            if (o.state === 'hitstun') this.resolveHit(f, o, this.superHit(f, { dmg: 65, knockdown: true, hitstop: 12, sfx: 'hitS' }), f.x, true);
            finish(22);
          }
        }
        break;
      }
      case 'wave': {
        f.vx = 0;
        if (s.t === 10) {
          var wm = new T.Group();
          var core = new T.Mesh(new T.SphereGeometry(1, 14, 10, 0, Math.PI * 2, 0, Math.PI / 2), M.glow(col, 0.38)); core.scale.set(0.9, 2.1, 0.9); wm.add(core);
          var shell = new T.Mesh(new T.SphereGeometry(1, 14, 10, 0, Math.PI * 2, 0, Math.PI / 2), M.glow('#ffffff', 0.08)); shell.scale.set(1.1, 2.4, 1.1); wm.add(shell);
          for (var i = 0; i < 3; i++) { var rr = new T.Mesh(new T.TorusGeometry(0.9 + i * 0.25, 0.05, 6, 24), M.glow(col, 0.7)); rr.rotation.y = Math.PI / 2; rr.position.y = 0.9; rr.position.x = -i * 0.35 * f.facing; wm.add(rr); }
          wm.position.set(f.x + f.facing * 0.9, 0, 0);
          this.addHazard({ kind: 'wave', owner: f, x: f.x + f.facing * 0.9, y: 0, y0: 0, y1: 2.2, hw: 0.75, vx: 0.17 * f.facing, mesh: wm, hits: 5, interval: 3, carry: true,
            hit: this.superHit(f, { dmg: 50, chip: 8 }), lastHit: this.superHit(f, { dmg: 60, knockdown: true, chip: 10, hitstop: 12, sfx: 'hitS' }), life: 120, pierce: true });
          KC.Audio.play('boom'); this.shake(0.15);
        }
        if (s.t >= 38) finish(12);
        break;
      }
      case 'rain': {
        f.vx = 0;
        if (s.t >= 8 && s.t <= 78 && (s.t - 8) % 9 === 0) {
          var n = (s.t - 8) / 9, tx = o.x + (Math.random() - 0.5) * 1.1;
          var cash = f.ch.super.obj === 'moneybag';
          var obj = M.buildProp(f.ch.super.obj, col, cash ? { cash: n % 2 === 1 && n < 7 } : null); obj.scale.multiplyScalar(cash && n >= 7 ? 2.4 : 1.5);
          obj.position.set(tx, 7.5, 0);
          this.addHazard({ kind: 'fall', owner: f, x: tx, y: 7.5, vy: -0.24, y0: -0.25, y1: 0.25, hw: 0.32, mesh: obj, hits: 1,
            hit: n >= 7 ? this.superHit(f, { dmg: 50, knockdown: true, chip: 8, hitstop: 10, level: 'high', sfx: 'hitS' }) : this.superHit(f, { dmg: 32, chip: 6, hitstop: 4, level: 'high' }), life: 80, spin: true });
        }
        if (s.t >= 86) finish(10);
        break;
      }
      case 'beam': {
        // Sky beam: a targeting reticle chases the opponent, locks on, then a beam crashes down from the sky
        f.vx = 0;
        if (s.t === 1) {
          var SKY = 14, bg = new T.Group();
          var ret = new T.Group();
          var rRing = new T.Mesh(new T.TorusGeometry(0.75, 0.06, 6, 28), M.glow(col, 0.9)); rRing.rotation.x = Math.PI / 2; ret.add(rRing);
          var rDisc = new T.Mesh(new T.CircleGeometry(0.6, 24), M.glow(col, 0.22)); rDisc.rotation.x = -Math.PI / 2; ret.add(rDisc);
          for (var ci = 0; ci < 4; ci++) { var tick = new T.Mesh(new T.BoxGeometry(0.34, 0.02, 0.07), M.glow('#ffffff', 0.9)); var ang = ci * Math.PI / 2; tick.position.set(Math.cos(ang) * 0.95, 0, Math.sin(ang) * 0.95); tick.rotation.y = -ang; ret.add(tick); }
          var guide = new T.Mesh(new T.CylinderGeometry(0.035, 0.035, SKY, 6, 1, true), M.glow(col, 0.28)); guide.position.y = SKY / 2; ret.add(guide);
          ret.position.y = 0.05; bg.add(ret);
          var bm = new T.Group();
          var outer = new T.Mesh(new T.CylinderGeometry(0.62, 0.62, SKY, 16, 1, true), M.glow(col, 0.6)); outer.geometry.translate(0, -SKY / 2, 0); bm.add(outer);
          var inner = new T.Mesh(new T.CylinderGeometry(0.24, 0.24, SKY, 10, 1, true), M.glow('#ffffff', 0.92)); inner.geometry.translate(0, -SKY / 2, 0); bm.add(inner);
          var splash = new T.Mesh(new T.CircleGeometry(1.15, 28), M.glow(col, 0.5)); splash.rotation.x = -Math.PI / 2; splash.position.y = -SKY + 0.06; bm.add(splash);
          bm.position.y = SKY; bm.scale.y = 0.001; bm.visible = false; bg.add(bm);
          bg.position.set(o.x, 0, 0);
          this.addHazard({ kind: 'beam', sky: true, owner: f, x: o.x, y: 0, y0: 0, y1: SKY, hw: 0.62, vx: 0, mesh: bg, ret: ret, bm: bm, hits: 10, interval: 5, armed: false,
            hit: this.superHit(f, { dmg: 29, chip: 4 }), lastHit: this.superHit(f, { dmg: 45, knockdown: true, chip: 6, hitstop: 12, sfx: 'hitS' }), life: 102, beam: true });   // +11% vs. the old sideways beam: it can be dodged now
          KC.Audio.play('beam');
        }
        if (s.t >= 52) finish(14);
        break;
      }
      case 'drop': {
        f.vx = 0;
        if (s.t === 1) {
          var dm = M.buildProp(f.ch.super.obj === 'crown' ? 'bigcrown' : f.ch.super.obj === 'gavel' ? 'biggavel' : f.ch.super.obj, col);
          var shadow = new T.Mesh(new T.CircleGeometry(1.0, 24), new T.MeshBasicMaterial({ color: '#000000', transparent: true, opacity: 0.35, depthWrite: false }));
          shadow.rotation.x = -Math.PI / 2; shadow.position.set(o.x, 0.03, 0); this.scene.add(shadow);
          dm.position.set(o.x, 9, 0);
          this.addHazard({ kind: 'drop', owner: f, x: o.x, y: 9, vy: 0, y0: 0, y1: 1.6, hw: 1.0, mesh: dm, shadow: shadow, hits: 1, armed: false,
            hit: this.superHit(f, { dmg: 255, knockdown: true, chip: 40, hitstop: 14, level: 'high', sfx: 'hitS' }), life: 90 });
        }
        if (s.t >= 50) finish(10);
        break;
      }
      case 'reflect': {
        // Mirror shield: for 4 seconds every enemy projectile that reaches it flies back faster and harder
        f.vx = 0;
        if (s.t === 1) {
          var mg = new T.Group();
          var shell = new T.Mesh(new T.SphereGeometry(1.15, 20, 14), M.glow(col, 0.22)); shell.scale.set(0.75, 1.15, 0.75); shell.position.y = 1.0; mg.add(shell);
          for (var ri = 0; ri < 3; ri++) { var ring = new T.Mesh(new T.TorusGeometry(0.95 - ri * 0.12, 0.025, 6, 30), M.glow('#ffffff', 0.6)); ring.position.y = 0.5 + ri * 0.5; ring.rotation.x = Math.PI / 2; mg.add(ring); }
          mg.position.set(f.x, 0, 0);
          this.addHazard({ kind: 'mirror', owner: f, x: f.x, y: 0, y0: 0, y1: 2.2, hw: 1.0, mesh: mg, cd: 99999, life: 240, reflected: 0 });
          KC.Audio.play('beam'); this.fx.ring(f.x, 1.1, col, 2, true);
        }
        if (s.t >= 16) finish(6);
        break;
      }
      case 'vehicle': {
        f.vx = 0;
        if (s.t === 1) {
          var vm = M.buildProp(f.ch.super.obj, col);
          var sx = f.x - f.facing * 6;
          vm.position.set(sx, 0, 0.45);
          if (f.facing < 0) vm.rotation.y = Math.PI;
          var vhw = f.ch.super.obj === 'tram' ? 2.1 : f.ch.super.obj === 'bulldozer' ? 1.15 : 0.85;
          this.addHazard({ kind: 'vehicle', owner: f, x: sx, y: 0, y0: 0, y1: 2.2, hw: vhw, vx: 0.3 * f.facing, mesh: vm, hits: 1,
            hit: this.superHit(f, { dmg: 250, knockdown: true, chip: 40, hitstop: 12, sfx: 'hitS' }), life: 80, pierce: true });
          KC.Audio.play('rush');
        }
        if (s.t >= 48) finish(10);
        break;
      }
    }
  };

  MP.updateHazards = function () {
    var self = this;
    // mirror shields (reflect super): bounce enemy projectiles back at their thrower
    this.hazards.forEach(function (mr) {
      if (!mr.alive || mr.kind !== 'mirror') return;
      mr.t++; mr.x = mr.owner.x;
      if (mr.mesh) { mr.mesh.position.x = mr.x; mr.mesh.rotation.y += 0.08; var fade = mr.t > mr.life - 30 ? (mr.life - mr.t) / 30 : 1; mr.mesh.scale.setScalar(0.9 + Math.sin(mr.t * 0.3) * 0.04); mr.mesh.visible = fade > 0.05 && (fade > 0.4 || mr.t % 4 < 2); }
      if (mr.t > mr.life || mr.owner.state === 'ko') { mr.alive = false; return; }
      self.hazards.forEach(function (h) {
        if (!h.alive || h.owner === mr.owner || (h.kind !== 'proj' && h.kind !== 'wave' && h.kind !== 'fall')) return;
        if (Math.abs(h.x - mr.x) > mr.hw + h.hw) return;
        if (h.kind === 'fall') { h.alive = false; self.fx.hit(h.x, h.y, '#9ad1ff', 10); KC.Audio.play('block'); return; }
        var thrower = h.owner;
        h.owner = mr.owner; h.vx = -h.vx * 1.35; h.t = 0; h.cd = 0; h.hitCount = 0;
        h.hit = Object.assign({}, h.hit, { dmg: Math.round(h.hit.dmg * 1.5), superHit: true });
        if (h.lastHit) h.lastHit = Object.assign({}, h.lastHit, { dmg: Math.round(h.lastHit.dmg * 1.5), superHit: true });
        h.x = mr.x + (h.vx > 0 ? 1 : -1) * (mr.hw + h.hw + 0.05);
        if (h.mesh) { h.mesh.rotation.y += Math.PI; h.mesh.position.x = h.x; }
        mr.reflected++;
        self.fx.ring(mr.x + (thrower.x > mr.x ? 0.9 : -0.9), h.y + 0.3, '#9ad1ff', 1.1, true); self.fx.hit(h.x, h.y + 0.3, '#ffffff', 12);
        KC.Audio.play('block'); KC.Audio.play('proj');
        self.callout(mr.owner, 'REFLECTED!', true);
      });
    });
    this.hazards.forEach(function (h) {
      if (!h.alive || h.kind === 'mirror') return;
      h.t++; if (h.cd > 0) h.cd--;
      var o = h.owner.opp;
      switch (h.kind) {
        case 'proj': case 'wave': case 'vehicle':
          h.x += h.vx;
          if (h.mesh) {
            h.mesh.position.x = h.x;
            if (h.kind === 'proj') {
              h.mesh.position.y = h.y + Math.sin(h.t * 0.3) * 0.03;
              var spin = h.mesh.userData.spin;
              if (spin) h.mesh.rotation[spin] += 0.25;
            }
            if (h.kind === 'vehicle' && h.mesh.userData.gallop) {
              h.mesh.children.forEach(function (c) { if (c.userData.leg !== undefined) c.rotation.z = Math.sin(h.t * 0.6 + c.userData.leg * 1.6) * 0.6; });
              h.mesh.position.y = Math.abs(Math.sin(h.t * 0.6)) * 0.15;
            }
            if (h.kind === 'wave') h.mesh.scale.setScalar(1 + Math.sin(h.t * 0.5) * 0.05);
          }
          if (Math.abs(h.x - h.owner.x) > 18 || h.t > (h.life || 200)) h.alive = false;
          break;
        case 'fall':
          h.y += h.vy;
          if (h.mesh) { h.mesh.position.y = h.y; h.mesh.rotation.z += 0.15; h.mesh.rotation.x += 0.1; }
          if (h.y <= 0.15) { h.alive = false; self.fx.hit(h.x, 0.2, '#ffffff', 8); KC.Audio.play('block'); }
          break;
        case 'beam':
          if (h.sky) {
            // aim (tracks the target for 30 frames, locks for 12), then the beam drops and slowly drifts after them
            var LOCK = 30, DROP = 42;
            if (h.t < LOCK) h.x += Math.max(-0.075, Math.min(0.075, o.x - h.x));
            else if (h.t > DROP + 6) h.x += Math.max(-0.028, Math.min(0.028, o.x - h.x));
            h.x = Math.max(-STAGE_BOUND, Math.min(STAGE_BOUND, h.x));
            h.mesh.position.x = h.x;
            if (h.t < DROP) {
              h.ret.rotation.y += h.t < LOCK ? 0.1 : 0.3;
              h.ret.children[0].scale.setScalar(h.t < LOCK ? 1 + 0.12 * Math.sin(h.t * 0.6) : 0.8);
              h.ret.visible = h.t < LOCK || h.t % 4 < 2;   // flashes once locked: last chance to dash away
              if (h.t === LOCK) KC.Audio.play('tick');
            } else {
              if (h.t === DROP) { h.ret.visible = false; h.bm.visible = true; KC.Audio.play('boom'); }
              var k = Math.min(1, (h.t - DROP + 1) / 6);
              h.bm.scale.set(1 + Math.sin(h.t * 0.9) * 0.12, k, 1 + Math.sin(h.t * 0.9) * 0.12);
              if (k >= 1 && !h.armed) { h.armed = true; self.shake(0.3); self.fx.ring(h.x, 0.1, '#ffffff', 2.2, false); self.fx.hit(h.x, 0.3, '#ffffff', 18); }
              if (h.armed && h.t % 3 === 0) self.fx.hit(h.x + (Math.random() - 0.5) * 0.8, 0.15, h.owner.ch.super.color, 3);
              if (h.t > h.life - 14) { h.armed = false; h.bm.scale.x = h.bm.scale.z = Math.max(0.05, (h.life - h.t) / 14); }
            }
            if (h.t > h.life) h.alive = false;
            break;
          }
          if (h.mesh) { var sc = 1 + Math.sin(h.t * 0.9) * 0.15; h.mesh.children[0].scale.set(sc, 1, sc); h.mesh.position.x = h.owner.x + h.owner.facing * 0.55; }
          h.x = h.owner.x;
          if (h.t > h.life) h.alive = false;
          break;
        case 'drop':
          if (h.t < 16) { h.mesh.position.x = h.x + Math.sin(h.t * 0.8) * 0.05; if (h.shadow) h.shadow.scale.setScalar(0.5 + h.t / 32); }
          else if (!h.landed) {
            h.vy -= 0.035; h.y += h.vy; h.mesh.position.y = Math.max(0, h.y);
            if (h.y <= 0) {
              h.landed = true; h.armed = true; h.y = 0;
              KC.Audio.play('boom'); self.shake(0.4); self.fx.hit(h.x, 0.3, '#ffffff', 20); self.fx.ring(h.x, 0.1, '#ffd166', 2.2, false);
              self.fx.papers_(h.x, 0.5, 10, 0);
            }
          } else {
            h.armed = false;
            if (h.t > 70) { h.mesh.position.y -= 0.05; if (h.shadow) h.shadow.material.opacity *= 0.9; }
          }
          if (h.t > h.life) h.alive = false;
          break;
      }
      // collision with opponent
      if (h.alive && h.cd <= 0 && o.invuln <= 0 && (h.kind !== 'drop' || h.armed) && (!h.sky || h.armed)) {
        var hb = o.hurtbox();
        if (hb) {
          var x0, x1;
          if (h.kind === 'beam' && !h.sky) { if (h.owner.facing > 0) { x0 = h.owner.x; x1 = h.owner.x + h.hw; } else { x0 = h.owner.x - h.hw; x1 = h.owner.x; } }
          else { x0 = h.x - h.hw; x1 = h.x + h.hw; }
          var y0 = h.y + h.y0, y1 = h.y + h.y1;
          if (x0 < hb.x1 && x1 > hb.x0 && y0 < hb.y1 && y1 > hb.y0) {
            var isLast = h.lastHit && h.hitCount >= h.hits - 1;
            var r = self.resolveHit(h.owner, o, isLast ? h.lastHit : h.hit, h.x - (h.vx || 0) * 3, false);
            if (r) {
              h.hitCount++; h.cd = h.interval;
              if (h.carry && o.state !== 'airhit') o.vx = h.vx * 0.9;
              if (h.hitCount >= h.hits) { if (h.kind === 'proj' || h.kind === 'fall') h.alive = false; else h.spent = true; }
              if (h.kind === 'proj') self.fx.hit(h.x, h.y, '#ffffff', 8);
            }
          }
        }
      }
      if (h.spent && h.kind !== 'vehicle') { h.cd = 9999; }
      if (h.spent && h.kind === 'vehicle') h.cd = 9999;
    });
    // projectile clashes
    for (var i = 0; i < this.hazards.length; i++) for (var j = i + 1; j < this.hazards.length; j++) {
      var a = this.hazards[i], b = this.hazards[j];
      if (!a.alive || !b.alive || a.owner === b.owner) continue;
      if (Math.abs(a.x - b.x) < a.hw + b.hw && (a.kind === 'proj' || b.kind === 'proj') && a.kind !== 'beam' && b.kind !== 'beam' && a.kind !== 'drop' && b.kind !== 'drop' && a.kind !== 'fall' && b.kind !== 'fall' && a.kind !== 'mirror' && b.kind !== 'mirror') {
        if (Math.abs(a.y - b.y) > 1.5 && a.kind === 'proj' && b.kind === 'proj') continue;
        if (a.kind === 'proj') a.alive = false;
        if (b.kind === 'proj') b.alive = false;
        this.fx.hit((a.x + b.x) / 2, a.y || 1.2, '#ffffff', 14); this.fx.ring((a.x + b.x) / 2, a.y || 1.2, '#ffffff', 0.8, true);
        KC.Audio.play('block');
      }
    }
    this.hazards = this.hazards.filter(function (h) {
      if (!h.alive) { if (h.mesh) self.scene.remove(h.mesh); if (h.shadow) self.scene.remove(h.shadow); }
      return h.alive;
    });
  };

  MP.separate = function () {
    var a = this.f[0], b = this.f[1];
    var minD = a.hw() + b.hw();
    var dx = b.x - a.x;
    var vOverlap = Math.abs(a.y - b.y) < 1.4;
    if (vOverlap && Math.abs(dx) < minD && a.state !== 'knockdown' && b.state !== 'knockdown' && a.state !== 'ko' && b.state !== 'ko') {
      var push = (minD - Math.abs(dx)) / 2, s = dx >= 0 ? 1 : -1;
      if (Math.abs(dx) < 0.001) s = a.facing;
      a.x -= push * s; b.x += push * s;
      [a, b].forEach(function (f) { f.x = Math.max(-STAGE_BOUND, Math.min(STAGE_BOUND, f.x)); });
      if (Math.abs(b.x - a.x) < minD - 0.01) { // wall: push the other one
        if (Math.abs(a.x) >= STAGE_BOUND - 0.001) b.x = a.x + s * minD; else a.x = b.x - s * minD;
      }
    }
    var sep = b.x - a.x;
    if (Math.abs(sep) > MAX_SEP) {
      var ex = (Math.abs(sep) - MAX_SEP), sg = sep > 0 ? 1 : -1;
      var aOut = a.vx * -sg > 0, bOut = b.vx * sg > 0;
      if (aOut && !bOut) a.x += ex * sg; else if (bOut && !aOut) b.x -= ex * sg; else { a.x += ex / 2 * sg; b.x -= ex / 2 * sg; }
    }
  };

  /* ---------- main tick (60 Hz) ---------- */
  MP.tick = function () {
    if (this.paused) return;
    this.pt++;
    var a = this.f[0], b = this.f[1];
    // banners/phases
    switch (this.phase) {
      case 'intro':
        a.state = b.state = 'intro';
        if (this.pt === 1) KC.HUD.vs(a.ch, b.ch);
        if (this.pt > 170 || (this.pt > 30 && this.game.skipPressed())) { KC.HUD.hideVs(); this.startRound(); }
        break;
      case 'round':
        if (this.pt === 1) { KC.HUD.banner(this.round === this.finalRoundNo() ? 'FINAL ROUND' : 'ROUND ' + this.round, '', 'round'); KC.Audio.say(this.round === this.finalRoundNo() ? 'Final round' : 'Round ' + this.round); }
        if (this.pt === 70) { KC.HUD.banner('FIGHT!', 'ORDER IN THE CHAMBER', 'fight'); KC.Audio.play('gavel'); KC.Audio.say('Fight!'); }
        if (this.pt === 100) { this.setPhase('fight'); KC.HUD.banner(null); this.timerFrames = 0; }
        break;
      case 'fight':
        if (this.timerMax < 1000) {
          this.timerFrames++;
          if (this.timerFrames % 60 === 0) {
            this.timeLeft--;
            if (this.timeLeft <= 5 && this.timeLeft > 0) KC.Audio.play('tick');
            if (this.timeLeft <= 0) { this.timeLeft = 0; this.timeUp(); }
          }
        }
        break;
      case 'ko':
        if (this.pt === 1) { KC.HUD.banner('K.O.', '', 'ko'); KC.Audio.say('K.O.!'); }
        if (this.pt > 50) this.timeScale = 1;
        if (this.pt > 130 && this.f.every(function (f) { return f.grounded() && f.state !== 'airhit' && f.state !== 'attack' && f.state !== 'super' && f.state !== 'rush'; })) this.endRound();
        break;
      case 'timeup':
        if (this.pt > 100) this.endRound();
        break;
      case 'roundEnd':
        if (this.pt > 170 || (this.pt > 60 && this.game.skipPressed())) this.nextRound();
        break;
      case 'matchEnd':
        if (this.pt > 260 || (this.pt > 80 && this.game.skipPressed())) { if (!this.ended) { this.ended = true; this.game.onMatchEnd(this); } }
        break;
    }

    if (this.superFreeze > 0) {
      this.superFreeze--;
      if (this.superFreeze === 0) { KC.HUD.superCutHide(); }
      return;
    }
    if (this.hitstop > 0) {
      this.hitstop--;
      this.f.forEach(function (f) { if (f.jitter > 0) f.jitter--; });
      return;
    }
    var controllable = this.phase === 'fight';
    for (var i = 0; i < 2; i++) {
      var f = this.f[i];
      var inp = controllable ? this.game.getInput(i, this) : { l: 0, r: 0, u: 0, d: 0, p: 0, k: 0, s: 0, x: 0 };
      f.readInput(inp);
    }
    a.step(this); b.step(this);
    this.separate();
    this.updateHazards();

    if (this.phase === 'fight' || this.phase === 'ko') {
      if (this.pt % 6 === 0) this.stage.setVotes(a.ch.short, a.health / a.maxHealth, b.ch.short, b.health / b.maxHealth);
    }
  };
  MP.finalRoundNo = function () { return this.roundsToWin * 2 - 1; };
  MP.startRound = function () {
    this.positionFighters();
    this.timeLeft = this.timerMax >= 1000 ? Infinity : this.timerMax;
    this.timerFrames = 0;
    this.f.forEach(function (f) { f.state = 'idle'; f.dmgTaken = 0; });
    this.setPhase('round');
    this.stage.setVotes(this.f[0].ch.short, 1, this.f[1].ch.short, 1);
    KC.HUD.show(true);
  };
  MP.timeUp = function () {
    this.setPhase('timeup');
    KC.HUD.banner('TIME!', '', 'ko'); KC.Audio.say('Time!');
  };
  MP.endRound = function () {
    var a = this.f[0], b = this.f[1], w;
    if (a.health > b.health) w = 0; else if (b.health > a.health) w = 1; else w = -1;
    this.result.roundWinners.push(w);
    var title, sub = '';
    if (w >= 0) {
      this.wins[w]++;
      var wf = this.f[w], lf = this.f[1 - w];
      wf.setState('victory'); wf.animT = 0;
      if (lf.state !== 'ko' && lf.state !== 'knockdown') lf.setState('defeat');
      title = wf.ch.short + ' WINS';
      if (wf.dmgTaken === 0) { sub = 'PERFECT!'; this.result.perfects[w]++; KC.Audio.say('Perfect!'); this.stage.cheer(1, wf.x); }
      else if (wf.health / wf.maxHealth < 0.12) sub = 'BY A SINGLE MANDATE';
      else sub = this.phase === 'timeup' ? 'ON POINTS' : 'MOTION PASSED';
    } else { title = 'DRAW'; sub = 'HUNG PARLIAMENT'; a.setState('defeat'); b.setState('defeat'); }
    KC.HUD.banner(title, sub, 'win');
    KC.HUD.updatePips(this);
    this.timeScale = 1;
    this.setPhase('roundEnd');
  };
  MP.nextRound = function () {
    if (this.wins[0] >= this.roundsToWin || this.wins[1] >= this.roundsToWin || this.round >= 9) {
      var w = this.wins[0] > this.wins[1] ? 0 : this.wins[1] > this.wins[0] ? 1 : -1;
      this.winner = w;
      this.setPhase('matchEnd');
      if (w >= 0) {
        var wf = this.f[w];
        wf.setState('victory'); wf.animT = 0;
        KC.HUD.banner(wf.ch.short, '“' + wf.ch.quote + '”', 'match');
        KC.Audio.say(wf.ch.name + ' wins!');
        this.stage.cheer(1, wf.x);
        KC.Audio.play('cheer', 1.5);
      } else KC.HUD.banner('DRAW', 'NEW ELECTIONS CALLED', 'match');
      KC.HUD.show(false);
      return;
    }
    this.round++;
    this.startRound();
  };

  /* ---------- camera ---------- */
  MP.updateCamera = function (dt) {
    var a = this.f[0], b = this.f[1], cam = this.camera;
    var mid = (a.x + b.x) / 2, sep = Math.abs(a.x - b.x);
    var tp = new T.Vector3(), tl = new T.Vector3();
    var k = Math.min(1, dt * 5);
    if (this.phase === 'intro') {
      var u = Math.min(1, this.pt / 170);
      var foc = u < 0.5 ? a : b, side = u < 0.5 ? -1 : 1, lu = (u % 0.5) * 2;
      tp.set(foc.x + side * (1.2 - lu * 0.4), 1.45 + lu * 0.1, 2.6 - lu * 0.3);
      tl.set(foc.x, 1.35 * foc.h, 0);
      if (this.pt < 3) { this.camPos.copy(tp); this.camLook.copy(tl); }
      k = Math.min(1, dt * 3);
    } else if (this.superFreeze > 0 && this.superUser) {
      var su = this.superUser;
      tp.set(su.x + su.facing * 1.6, 1.4, 3.0); tl.set(su.x, 1.2 * su.h, 0);
      k = Math.min(1, dt * 8);
    } else if (this.phase === 'matchEnd' && this.winner >= 0) {
      var wf = this.f[this.winner];
      tp.set(wf.x + wf.facing * 0.8, 1.5, 3.4); tl.set(wf.x, 1.2 * wf.h, 0);
      k = Math.min(1, dt * 2.5);
    } else if (this.phase === 'ko' && this.koVictim && this.pt < 60) {
      tp.set(mid, 1.8, 4.4 + sep * 0.35); tl.set(this.koVictim.x * 0.6 + mid * 0.4, 0.9, 0);
      k = Math.min(1, dt * 4);
    } else {
      var hy = Math.max(a.y, b.y);
      var dist = 5.6 + Math.max(0, sep - 1.5) * 0.62 + hy * 0.9;
      tp.set(mid, 1.75 + hy * 0.45, dist); tl.set(mid, 1.15 + hy * 0.5, 0);
    }
    this.camPos.lerp(tp, k); this.camLook.lerp(tl, k);
    cam.position.copy(this.camPos);
    if (this.shakeAmt > 0.001) {
      cam.position.x += (Math.random() - 0.5) * this.shakeAmt; cam.position.y += (Math.random() - 0.5) * this.shakeAmt;
      this.shakeAmt *= Math.pow(0.02, dt);
    }
    cam.lookAt(this.camLook);
    this.stage.followShadow(mid);
  };

  MP.render = function (dt) {
    var self = this;
    this.f.forEach(function (f) {
      var frozen = (self.superFreeze > 0 && self.superUser !== f) || (self.hitstop > 0);
      if (!frozen || (self.superFreeze > 0 && self.superUser === f)) f.animate(self, dt);
      else if (f.jitter > 0) { f.model.root.position.x = f.x + (Math.random() - 0.5) * 0.06; }
    });
    this.updateCamera(dt);
    var focus = (this.f[0].x + this.f[1].x) / 2;
    this.stage.update(dt, focus);
    KC.HUD.update(this);
  };
})();
