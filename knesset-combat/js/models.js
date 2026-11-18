/* Knesset Combat 26' — procedural low-poly, cel-shaded models + pose library. */
(function () {
  var T = THREE;
  if (T.ColorManagement) T.ColorManagement.legacyMode = false;
  var M = KC.Models = {};

  /* ---------- materials ---------- */
  var gradTex = null;
  function gradientMap() {
    if (gradTex) return gradTex;
    var steps = [70, 150, 215, 255];
    var data = new Uint8Array(steps.length * 4);
    steps.forEach(function (v, i) { data[i * 4] = data[i * 4 + 1] = data[i * 4 + 2] = v; data[i * 4 + 3] = 255; });
    gradTex = new T.DataTexture(data, steps.length, 1, T.RGBAFormat);
    gradTex.minFilter = gradTex.magFilter = T.NearestFilter;
    gradTex.generateMipmaps = false;
    gradTex.needsUpdate = true;
    return gradTex;
  }
  var matCache = {};
  M.toon = function (color, emissive) {
    var k = color + '|' + (emissive || '');
    if (!matCache[k]) {
      var o = { color: new T.Color(color), gradientMap: gradientMap() };
      if (emissive) { o.emissive = new T.Color(emissive); o.emissiveIntensity = 0.6; }
      matCache[k] = new T.MeshToonMaterial(o);
    }
    return matCache[k];
  };
  M.glow = function (color, opacity) {
    var k = 'glow' + color + (opacity || 1);
    if (!matCache[k]) {
      matCache[k] = new T.MeshBasicMaterial({ color: new T.Color(color), transparent: true, opacity: opacity == null ? 0.8 : opacity, blending: T.AdditiveBlending, depthWrite: false, side: T.DoubleSide });
    }
    return matCache[k];
  };
  function makeOutline(color, thick) {
    var m = new T.MeshBasicMaterial({ color: new T.Color(color), side: T.BackSide });
    m.onBeforeCompile = function (s) {
      s.vertexShader = s.vertexShader.replace('#include <begin_vertex>', 'vec3 transformed = position + normalize(normal) * ' + thick.toFixed(4) + ';');
    };
    return m;
  }
  M.outlineMat = makeOutline('#14100c', 0.013);
  M.outlineSil = makeOutline('#4f7cff', 0.02);
  M.silMat = new T.MeshBasicMaterial({ color: new T.Color('#0b1020') });

  /* ---------- geometry helpers ---------- */
  function flat(geo) { var g = geo.index ? geo.toNonIndexed() : geo.clone(); g.computeVertexNormals(); return g; }
  var box = function (w, h, d) { return new T.BoxGeometry(w, h, d); };
  var cyl = function (rt, rb, h, s) { return new T.CylinderGeometry(rt, rb, h, s || 8); };
  var sph = function (r, ws, hs) { return new T.SphereGeometry(r, ws || 10, hs || 8); };
  var hemi = function (r) { return new T.SphereGeometry(r, 12, 5, 0, Math.PI * 2, 0, Math.PI / 2); };
  M.geo = { box: box, cyl: cyl, sph: sph, hemi: hemi };

  var buildCtx = { sil: false, outline: true };
  function part(geo, color, x, y, z, outline) {
    var mesh;
    if (buildCtx.sil) mesh = new T.Mesh(geo, M.silMat);
    else mesh = new T.Mesh(flat(geo), M.toon(color));
    mesh.castShadow = true;
    if (x !== undefined) mesh.position.set(x, y, z);
    if (outline !== false && buildCtx.outline) {
      var o = new T.Mesh(geo, buildCtx.sil ? M.outlineSil : M.outlineMat);
      o.castShadow = false;
      mesh.add(o);
    }
    return mesh;
  }
  M.part = function (geo, color, x, y, z, outline) {
    var prev = buildCtx.sil; buildCtx.sil = false;
    var p = part(geo, color, x, y, z, outline);
    buildCtx.sil = prev; return p;
  };
  function grp(x, y, z) { var g = new T.Group(); g.position.set(x || 0, y || 0, z || 0); return g; }
  function shade(hex, f) { var c = new T.Color(hex); c.multiplyScalar(f); return '#' + c.getHexString(); }
  M.shade = shade;

  /* ---------- fighter ---------- */
  M.buildFighter = function (ch, opts) {
    opts = opts || {};
    var L = Object.assign({}, ch.look);
    if (opts.skin) {
      var s = opts.skin;
      if (L.outfit === 'dress') { L.top = s.dress; L.pants = s.dress; L.shirt = s.dress; }
      else { L.top = s.top; L.pants = s.pants; L.shirt = s.shirt; if (L.tie) L.tie = s.tie; else if (L.outfit === 'shirt') L.shirt = s.top; }
    }
    buildCtx.sil = !!opts.silhouette;
    buildCtx.outline = opts.outline !== false;
    var g = L.girth || 1, h = L.height || 1;
    var root = new T.Group();
    var body = new T.Group();
    root.add(body);
    body.scale.setScalar(h);
    var J = { body: body };

    var hips = grp(0, 0.95, 0); body.add(hips); J.hips = hips;
    hips.add(part(box(0.36 * g, 0.2, 0.24 * g), L.pants, 0, -0.02, 0));
    // belt
    hips.add(part(box(0.37 * g, 0.04, 0.25 * g), '#1b1714', 0, 0.07, 0, false));

    var torso = grp(0, 0.06, 0); hips.add(torso); J.torso = torso;
    var chestGeo = cyl(0.25 * g, 0.21 * g, 0.56, 8); chestGeo.scale(1, 1, 0.64);
    torso.add(part(chestGeo, L.top, 0, 0.3, 0));
    var front = 0.155 * g;
    if (g > 1.18) { // belly
      var bel = sph(0.2 * g, 10, 8); bel.scale(1, 0.85, 0.75);
      torso.add(part(bel, L.top, 0, 0.17, 0.05 * g));
      front += 0.04 * g;
    }
    if (L.outfit === 'suit' || L.outfit === 'open') {
      var vGeo = new T.CylinderGeometry(0.085, 0.0, 0.24, 3); vGeo.rotateY(Math.PI); vGeo.scale(1, 1, 0.25);
      torso.add(part(vGeo, L.shirt, 0, 0.45, front - 0.005, false));
      if (L.tie) {
        if (L.longTie) torso.add(part(box(0.06, 0.4, 0.02), L.tie, 0, 0.29, front + 0.012, false));
        else torso.add(part(box(0.05, 0.26, 0.02), L.tie, 0, 0.36, front + 0.012, false));
        torso.add(part(box(0.06, 0.04, 0.025), L.tie, 0, 0.5, front + 0.012, false));
      } else {
        torso.add(part(box(0.11, 0.03, 0.03), L.shirt, 0, 0.56, front - 0.02, false));
      }
      // buttons
      torso.add(part(box(0.03, 0.03, 0.02), shade(L.top, 0.55), 0, 0.2, front + 0.005, false));
      torso.add(part(box(0.03, 0.03, 0.02), shade(L.top, 0.55), 0, 0.1, front + 0.005, false));
      // lapels
      var lap = box(0.06, 0.26, 0.02);
      var lapL = part(lap, shade(L.top, 0.8), 0.07, 0.43, front + 0.006, false); lapL.rotation.z = -0.35; torso.add(lapL);
      var lapR = part(lap, shade(L.top, 0.8), -0.07, 0.43, front + 0.006, false); lapR.rotation.z = 0.35; torso.add(lapR);
    } else if (L.outfit === 'shirt') {
      var neckV = new T.CylinderGeometry(0.06, 0.0, 0.14, 3); neckV.rotateY(Math.PI); neckV.scale(1, 1, 0.25);
      torso.add(part(neckV, L.skin, 0, 0.5, front - 0.004, false));
      torso.add(part(box(0.08, 0.08, 0.02), shade(L.top, 0.85), 0.09, 0.4, front, false));
      torso.add(part(box(0.08, 0.08, 0.02), shade(L.top, 0.85), -0.09, 0.4, front, false));
      // collar wings
      var cw = box(0.09, 0.03, 0.06);
      var c1 = part(cw, L.top, 0.07, 0.57, front - 0.04, false); c1.rotation.z = -0.4; torso.add(c1);
      var c2 = part(cw, L.top, -0.07, 0.57, front - 0.04, false); c2.rotation.z = 0.4; torso.add(c2);
    } else if (L.outfit === 'dress') {
      torso.add(part(box(0.1, 0.03, 0.03), '#e8e2d0', 0, 0.56, front - 0.02, false)); // collar
      var brooch = part(sph(0.025, 6, 4), '#d4a017', 0.08, 0.45, front, false); torso.add(brooch);
      var skirt = cyl(0.22 * g, 0.31 * g, 0.55, 10); skirt.scale(1, 1, 0.8);
      hips.add(part(skirt, L.top, 0, -0.27, 0));
    }

    // neck + head
    var neck = grp(0, 0.6, 0); torso.add(neck); J.neck = neck;
    neck.add(part(cyl(0.058, 0.064, 0.12, 8), L.skin, 0, 0.03, 0));
    var head = grp(0, 0.08, 0.01); neck.add(head); J.head = head;
    var skull = sph(0.135, 10, 8); skull.scale(1, 1.1, 1.05);
    head.add(part(skull, L.skin, 0, 0.12, 0));
    var dark = '#1a1410';
    // ears
    var ear = sph(0.03, 6, 5); ear.scale(0.5, 1, 0.8);
    head.add(part(ear, L.skin, 0.135, 0.12, 0, false));
    head.add(part(ear, L.skin, -0.135, 0.12, 0, false));
    // face
    if (!buildCtx.sil) {
      head.add(part(sph(0.022, 6, 5), '#ffffff', 0.046, 0.14, 0.118, false));
      head.add(part(sph(0.022, 6, 5), '#ffffff', -0.046, 0.14, 0.118, false));
      head.add(part(sph(0.012, 6, 5), dark, 0.046, 0.14, 0.137, false));
      head.add(part(sph(0.012, 6, 5), dark, -0.046, 0.14, 0.137, false));
      var browCol = L.hair === 'bald' ? shade(L.skin, 0.55) : shade(L.hairColor, 0.8);
      var b1 = part(box(0.055, 0.014, 0.015), browCol, 0.048, 0.178, 0.128, false); b1.rotation.z = -0.12; head.add(b1);
      var b2 = part(box(0.055, 0.014, 0.015), browCol, -0.048, 0.178, 0.128, false); b2.rotation.z = 0.12; head.add(b2);
      head.add(part(box(0.032, 0.05, 0.04), shade(L.skin, 0.9), 0, 0.112, 0.142, false));
      head.add(part(box(0.05, 0.011, 0.012), '#7a2e2a', 0, 0.062, 0.13, false));
    }
    if (L.beard) {
      var bg = sph(0.115, 8, 6); bg.scale(1.05, 0.75, 0.85);
      head.add(part(bg, L.beard, 0, 0.055, 0.035));
      head.add(part(box(0.09, 0.025, 0.03), L.beard, 0, 0.085, 0.135, false));
    }
    if (L.mustache) {
      head.add(part(box(L.bushy ? 0.1 : 0.075, L.bushy ? 0.035 : 0.022, 0.03), L.mustacheColor, 0, 0.083, 0.138, false));
    }
    if (L.eyepatch) {
      var ep = sph(0.032, 8, 6); ep.scale(1, 0.85, 0.4);
      head.add(part(ep, '#0d0d0d', 0.047, 0.142, 0.135, false));
      var strap = new T.TorusGeometry(0.142, 0.006, 4, 24); strap.rotateX(Math.PI / 2); strap.rotateZ(-0.35);
      head.add(part(strap, '#0d0d0d', 0, 0.16, 0.0, false));
    }
    if (L.glasses) {
      var gr = L.glasses === 'round' ? 0.034 : 0.03, tube = L.glasses === 'thick' ? 0.011 : 0.006;
      var ring = new T.TorusGeometry(gr, tube, 6, 14);
      head.add(part(ring, L.glassesColor, 0.047, 0.14, 0.142, false));
      head.add(part(ring, L.glassesColor, -0.047, 0.14, 0.142, false));
      head.add(part(box(0.03, tube * 1.4, tube * 1.4), L.glassesColor, 0, 0.145, 0.142, false));
      var arm = box(tube * 1.4, tube * 1.4, 0.13);
      head.add(part(arm, L.glassesColor, 0.135, 0.145, 0.08, false));
      head.add(part(arm, L.glassesColor, -0.135, 0.145, 0.08, false));
    }
    buildHair(head, L);

    // arms
    function makeArm(side) {
      var sh = grp(side * (0.25 * g + 0.035), 0.5, 0);
      sh.add(part(sph(0.078, 8, 6), L.top, 0, 0, 0));
      sh.add(part(cyl(0.066, 0.056, 0.3, 8), L.top, 0, -0.15, 0));
      var el = grp(0, -0.3, 0); sh.add(el);
      el.add(part(cyl(0.056, 0.047, 0.25, 8), L.top, 0, -0.125, 0));
      el.add(part(cyl(0.049, 0.049, 0.035, 8), L.outfit === 'dress' ? L.top : L.shirt, 0, -0.255, 0, false));
      var hand = sph(0.055, 8, 6); hand.scale(0.9, 1, 1.1);
      el.add(part(hand, L.skin, 0, -0.31, 0));
      return { sh: sh, el: el };
    }
    var la = makeArm(1), ra = makeArm(-1);
    torso.add(la.sh); torso.add(ra.sh);
    J.lSh = la.sh; J.lEl = la.el; J.rSh = ra.sh; J.rEl = ra.el;

    // legs
    function makeLeg(side) {
      var hp = grp(side * 0.1 * g, -0.06, 0);
      var legCol = L.outfit === 'dress' ? '#caa286' : L.pants;
      hp.add(part(cyl(0.085 * Math.min(g, 1.2), 0.07, 0.42, 8), legCol, 0, -0.21, 0));
      var kn = grp(0, -0.42, 0); hp.add(kn);
      kn.add(part(cyl(0.068, 0.056, 0.42, 8), legCol, 0, -0.21, 0));
      kn.add(part(box(0.115, 0.08, 0.25), L.shoes, 0, -0.44, 0.05));
      return { hp: hp, kn: kn };
    }
    var ll = makeLeg(1), rl = makeLeg(-1);
    hips.add(ll.hp); hips.add(rl.hp);
    J.lHip = ll.hp; J.lKnee = ll.kn; J.rHip = rl.hp; J.rKnee = rl.kn;

    // props
    if (L.prop === 'handbag') {
      var bag = grp(0, -0.42, 0.02);
      bag.add(part(box(0.2, 0.15, 0.08), L.propColor, 0, 0, 0));
      bag.add(part(new T.TorusGeometry(0.06, 0.01, 5, 10, Math.PI), L.propColor, 0, 0.075, 0, false));
      bag.add(part(box(0.04, 0.03, 0.09), '#d4a017', 0, 0.04, 0, false));
      la.el.add(bag);
      J.prop = bag;
    } else if (L.prop === 'gavel') {
      var gav = grp(0, -0.31, 0.02);
      var handle = part(cyl(0.018, 0.018, 0.34, 6), L.propColor, 0, 0, 0.12); handle.rotation.x = Math.PI / 2; gav.add(handle);
      var gh = part(cyl(0.05, 0.05, 0.17, 8), shade(L.propColor, 1.2), 0, 0, 0.29); gh.rotation.z = Math.PI / 2; gav.add(gh);
      var band = part(cyl(0.053, 0.053, 0.02, 8), '#d4a017', 0.06, 0, 0.29, false); band.rotation.z = Math.PI / 2; gav.add(band);
      ra.el.add(gav);
      J.prop = gav;
    }

    buildCtx.sil = false; buildCtx.outline = true;
    return { root: root, body: body, J: J, ch: ch, scale: h, height: 1.86 * h, girth: g };
  };

  function buildHair(head, L) {
    var c = L.hairColor;
    var cap;
    switch (L.hair) {
      case 'tufts': {
        var t = sph(0.085, 8, 6); t.scale(0.85, 1.05, 1.3);
        var a = part(t, c, 0.13, 0.135, -0.02); a.rotation.z = -0.25; head.add(a);
        var b = part(t, c, -0.13, 0.135, -0.02); b.rotation.z = 0.25; head.add(b);
        var back = sph(0.09, 8, 6); back.scale(1.45, 0.75, 0.7);
        head.add(part(back, c, 0, 0.1, -0.11));
        var top1 = sph(0.04, 6, 5); top1.scale(1, 0.6, 1);
        head.add(part(top1, c, 0.09, 0.22, -0.02, false));
        head.add(part(top1, c, -0.09, 0.22, -0.02, false));
        break;
      }
      case 'fringe': {
        var tg = new T.TorusGeometry(0.133, 0.038, 6, 14, Math.PI * 1.25);
        tg.rotateX(Math.PI / 2); tg.rotateY(Math.PI * 1.125);
        head.add(part(tg, c, 0, 0.115, -0.005));
        break;
      }
      case 'combed':
        cap = part(hemi(0.148), c, 0, 0.13, -0.008); cap.scale.set(1.03, 0.9, 1.06); cap.rotation.x = -0.35; head.add(cap);
        var q = sph(0.07, 8, 6); q.scale(1.6, 0.55, 1.0);
        head.add(part(q, c, 0.02, 0.255, 0.07));
        break;
      case 'parted':
        cap = part(hemi(0.149), c, 0, 0.13, -0.008); cap.scale.set(1.04, 0.85, 1.05); cap.rotation.x = -0.35; head.add(cap);
        var sw = sph(0.065, 8, 6); sw.scale(1.8, 0.5, 1.0);
        var swm = part(sw, c, -0.03, 0.245, 0.07); swm.rotation.z = 0.25; head.add(swm);
        break;
      case 'short':
        cap = part(hemi(0.147), c, 0, 0.13, -0.006); cap.scale.set(1.02, 0.75, 1.04); cap.rotation.x = -0.4; head.add(cap);
        break;
      case 'full':
        cap = part(hemi(0.156), c, 0, 0.125, -0.008); cap.scale.set(1.07, 1.0, 1.09); cap.rotation.x = -0.3; head.add(cap);
        var vol = sph(0.08, 8, 6); vol.scale(1.7, 0.6, 1.2);
        head.add(part(vol, c, 0, 0.26, 0.04));
        break;
      case 'bun':
        cap = part(hemi(0.15), c, 0, 0.13, -0.008); cap.scale.set(1.04, 0.92, 1.06); cap.rotation.x = -0.3; head.add(cap);
        head.add(part(sph(0.07, 8, 6), c, 0, 0.17, -0.155));
        break;
      case 'swoop': {
        cap = part(hemi(0.156), c, 0, 0.13, -0.01); cap.scale.set(1.06, 0.95, 1.1); cap.rotation.x = -0.3; head.add(cap);
        var sw1 = sph(0.09, 10, 8); sw1.scale(1.9, 0.7, 1.25);
        var swm1 = part(sw1, c, -0.02, 0.255, 0.07); swm1.rotation.z = 0.18; swm1.rotation.x = 0.25; head.add(swm1);
        var sw2 = sph(0.07, 8, 6); sw2.scale(1.2, 0.9, 1.5);
        head.add(part(sw2, c, 0.1, 0.2, -0.02));
        head.add(part(sw2, c, -0.11, 0.19, -0.03));
        break;
      }
      case 'bob': {
        cap = part(hemi(0.153), c, 0, 0.13, -0.008); cap.scale.set(1.05, 0.95, 1.07); cap.rotation.x = -0.25; head.add(cap);
        var bb = sph(0.15, 10, 8); bb.scale(1.1, 0.78, 0.95);
        head.add(part(bb, c, 0, 0.075, -0.05));
        var fr = sph(0.06, 8, 6); fr.scale(1.9, 0.6, 1.0);
        var frm = part(fr, c, 0.03, 0.235, 0.075); frm.rotation.z = -0.2; head.add(frm);
        break;
      }
      case 'bald':
      default: {
        var side = sph(0.05, 6, 5); side.scale(0.5, 0.9, 1.4);
        head.add(part(side, c, 0.128, 0.12, -0.04, false));
        head.add(part(side, c, -0.128, 0.12, -0.04, false));
        break;
      }
    }
    if (L.kippah) {
      var k = part(cyl(0.075, 0.08, 0.018, 12), L.kippah, 0, 0.268, -0.035); k.rotation.x = -0.35; head.add(k);
    }
  }

  /* ---------- pose system ---------- */
  var KEYS = ['hipsY', 'hipsRy', 'torsoRx', 'torsoRy', 'torsoRz', 'headRx', 'headRy', 'lShRx', 'lShRz', 'lElRx', 'rShRx', 'rShRz', 'rElRx',
    'lHipRx', 'lHipRz', 'lKneeRx', 'rHipRx', 'rHipRz', 'rKneeRx', 'bodyRx', 'bodyRy', 'bodyRz', 'bodyLift'];
  M.POSE_KEYS = KEYS;
  M.zeroPose = function () { var p = {}; KEYS.forEach(function (k) { p[k] = 0; }); return p; };
  function P(o) { var p = M.zeroPose(); for (var k in o) p[k] = o[k]; return p; }
  M.mergePose = function (base, o) { var p = Object.assign({}, base); for (var k in o) p[k] = o[k]; return p; };

  M.applyPose = function (model, p) {
    var J = model.J;
    J.hips.position.y = 0.95 + p.hipsY;
    J.hips.rotation.y = p.hipsRy;
    J.torso.rotation.set(p.torsoRx, p.torsoRy, p.torsoRz);
    J.head.rotation.set(p.headRx, p.headRy, 0);
    J.lSh.rotation.set(p.lShRx, 0, p.lShRz);
    J.lEl.rotation.x = p.lElRx;
    J.rSh.rotation.set(p.rShRx, 0, -p.rShRz);
    J.rEl.rotation.x = p.rElRx;
    J.lHip.rotation.set(p.lHipRx, 0, p.lHipRz);
    J.lKnee.rotation.x = p.lKneeRx;
    J.rHip.rotation.set(p.rHipRx, 0, -p.rHipRz);
    J.rKnee.rotation.x = p.rKneeRx;
    J.body.rotation.set(p.bodyRx, p.bodyRy, p.bodyRz);
    J.body.position.y = p.bodyLift;
  };
  M.lerpPose = function (cur, target, k) {
    for (var i = 0; i < KEYS.length; i++) { var key = KEYS[i]; cur[key] += (target[key] - cur[key]) * k; }
  };

  var guard = { lShRx: -0.95, lShRz: 0.12, lElRx: -1.75, rShRx: -0.55, rShRz: 0.18, rElRx: -1.95 };
  M.poses = {
    idle: function (t) {
      var b = Math.sin(t * 5.5);
      return P(Object.assign({ hipsY: -0.06 + 0.018 * b, torsoRy: 0.28, torsoRx: 0.08 + 0.02 * b, headRy: -0.22, headRx: -0.04,
        lHipRx: -0.38, lHipRz: 0.06, lKneeRx: 0.5 - 0.04 * b, rHipRx: 0.28, rHipRz: 0.08, rKneeRx: 0.42 - 0.04 * b }, guard));
    },
    walk: function (t, dir) {
      var s = Math.sin(t * 9) * dir, c = Math.abs(Math.cos(t * 9));
      return P(Object.assign({ hipsY: -0.05 + 0.03 * c, torsoRy: 0.28, torsoRx: 0.1, headRy: -0.22,
        lHipRx: -0.25 + 0.5 * s, lHipRz: 0.05, lKneeRx: 0.35 + 0.45 * Math.max(0, -s), rHipRx: 0.1 - 0.5 * s, rHipRz: 0.06, rKneeRx: 0.35 + 0.45 * Math.max(0, s) }, guard));
    },
    crouch: function (t) {
      var b = Math.sin(t * 5) * 0.01;
      return P(Object.assign({ hipsY: -0.4 + b, torsoRx: 0.35, torsoRy: 0.25, headRx: -0.3, headRy: -0.2,
        lHipRx: -1.45, lHipRz: 0.12, lKneeRx: 2.1, rHipRx: -0.8, rHipRz: 0.2, rKneeRx: 2.3 }, guard));
    },
    jump: function (t) {
      return P({ hipsY: 0, torsoRx: 0.15, lShRx: -1.3, lShRz: 0.3, lElRx: -1.3, rShRx: -0.9, rShRz: 0.3, rElRx: -1.5,
        lHipRx: -1.3, lKneeRx: 1.9, rHipRx: -0.55, rKneeRx: 1.5 });
    },
    flip: function (t) { return M.mergePose(M.poses.jump(t), { lHipRx: -1.8, lKneeRx: 2.3, rHipRx: -1.8, rKneeRx: 2.3 }); },
    punchWind: function () { return M.mergePose(M.poses.idle(0), { rShRx: 0.25, rShRz: 0.25, rElRx: -2.1, torsoRy: 0.55 }); },
    punch: function () {
      return M.mergePose(M.poses.idle(0), { rShRx: -1.57, rShRz: 0.12, rElRx: -0.05, torsoRy: -0.5, torsoRx: 0.14, headRy: 0.2,
        lShRx: -1.0, lElRx: -1.9, lHipRx: -0.55, lKneeRx: 0.55 });
    },
    kickWind: function () { return M.mergePose(M.poses.idle(0), { rHipRx: -1.0, rKneeRx: 1.7, torsoRx: -0.1, torsoRy: 0.4 }); },
    kick: function () {
      return M.mergePose(M.poses.idle(0), { rHipRx: -1.6, rHipRz: 0.12, rKneeRx: 0.05, torsoRx: -0.35, torsoRy: 0.15, lKneeRx: 0.25, lHipRx: -0.1,
        lShRx: -0.6, lShRz: 0.8, lElRx: -1.0, rShRx: 0.3, rShRz: 0.7, rElRx: -0.6, headRx: 0.2 });
    },
    cpunch: function () { return M.mergePose(M.poses.crouch(0), { rShRx: -1.5, rShRz: 0.1, rElRx: -0.05, torsoRy: -0.35, torsoRx: 0.4 }); },
    sweepWind: function () { return M.mergePose(M.poses.crouch(0), { hipsY: -0.5, rHipRx: -0.9, rKneeRx: 1.8, torsoRy: 0.6 }); },
    sweep: function () {
      return M.mergePose(M.poses.crouch(0), { hipsY: -0.55, torsoRx: 0.55, torsoRy: -0.2, rHipRx: -1.45, rHipRz: 0.25, rKneeRx: 0.05,
        lHipRx: -1.7, lKneeRx: 2.45, lShRx: -0.4, lShRz: 0.4, lElRx: 0, rShRx: -0.8, rShRz: 0.6, rElRx: -0.4 });
    },
    jpunch: function () { return M.mergePose(M.poses.jump(0), { rShRx: -1.15, rShRz: 0.1, rElRx: -0.05, torsoRx: 0.35, torsoRy: -0.3 }); },
    jkick: function () { return M.mergePose(M.poses.jump(0), { rHipRx: -0.95, rHipRz: 0.1, rKneeRx: 0.08, torsoRx: -0.25, lHipRx: -1.4, lKneeRx: 2.0 }); },
    throwWind: function () {
      return M.mergePose(M.poses.idle(0), { rShRx: 0.7, rShRz: 0.3, rElRx: -1.2, lShRx: 0.5, lShRz: 0.3, lElRx: -1.0, torsoRx: -0.2, torsoRy: 0.5, lHipRx: -0.3 });
    },
    throw: function () {
      return M.mergePose(M.poses.idle(0), { rShRx: -1.6, rShRz: 0.15, rElRx: -0.1, lShRx: -1.5, lShRz: 0.0, lElRx: -0.1, torsoRx: 0.3, torsoRy: -0.1,
        lHipRx: -0.75, lKneeRx: 0.7, rHipRx: 0.45, rKneeRx: 0.2, headRx: 0.1 });
    },
    dash: function (t) {
      return P({ hipsY: -0.16, torsoRx: 0.55, torsoRy: 0.15, headRx: -0.4, rShRx: 0.95, rShRz: 0.25, rElRx: -0.5, lShRx: 0.95, lShRz: 0.25, lElRx: -0.5,
        lHipRx: -1.05, lKneeRx: 1.0, rHipRx: 0.75, rKneeRx: 0.35 });
    },
    backdash: function (t) {
      return P({ hipsY: -0.06, torsoRx: -0.28, torsoRy: 0.3, headRx: 0.12, lShRx: -0.8, lShRz: 0.4, lElRx: -1.2, rShRx: -0.6, rShRz: 0.3, rElRx: -1.3,
        lHipRx: -0.75, lKneeRx: 1.15, rHipRx: 0.1, rKneeRx: 0.3 });
    },
    rush: function (t) {
      var s = Math.sin(t * 22);
      return P({ hipsY: -0.08, torsoRx: 0.6, torsoRy: 0.4, headRx: -0.45, rShRx: -1.5, rShRz: 0.35, rElRx: -0.6, lShRx: 0.5, lShRz: 0.2, lElRx: -1.2,
        lHipRx: -0.4 + 0.8 * s, lKneeRx: 0.6 + 0.6 * Math.max(0, -s), rHipRx: 0.2 - 0.8 * s, rKneeRx: 0.6 + 0.6 * Math.max(0, s) });
    },
    hit: function (t) {
      return P({ hipsY: -0.08, torsoRx: -0.45, torsoRy: 0.2, headRx: -0.45, lShRx: -0.4, lShRz: 0.9, lElRx: -0.8, rShRx: -0.3, rShRz: 0.8, rElRx: -0.7,
        lHipRx: -0.2, lKneeRx: 0.5, rHipRx: 0.3, rKneeRx: 0.5 });
    },
    hitLow: function () { return M.mergePose(M.poses.crouch(0), { torsoRx: -0.1, headRx: -0.5, lShRz: 0.8, rShRz: 0.7, lElRx: -0.6, rElRx: -0.6 }); },
    block: function () {
      return P({ hipsY: -0.1, torsoRx: 0.05, torsoRy: 0.15, headRx: 0.25, lShRx: -1.45, lShRz: -0.15, lElRx: -2.35, rShRx: -1.35, rShRz: -0.2, rElRx: -2.45,
        lHipRx: -0.4, lKneeRx: 0.6, rHipRx: 0.3, rHipRz: 0.08, rKneeRx: 0.5 });
    },
    crouchBlock: function () { return M.mergePose(M.poses.crouch(0), { lShRx: -1.45, lShRz: -0.15, lElRx: -2.35, rShRx: -1.35, rShRz: -0.2, rElRx: -2.45, headRx: 0.1 }); },
    airHit: function () { return P({ bodyRx: -0.6, torsoRx: -0.3, headRx: -0.5, lShRx: -2.2, lShRz: 0.5, rShRx: -2.0, rShRz: 0.5, lHipRx: -0.6, lKneeRx: 0.8, rHipRx: -0.2, rKneeRx: 0.4 }); },
    lying: function () {
      return P({ bodyRx: -Math.PI / 2, bodyLift: 0.15, headRx: -0.2, lShRx: -0.4, lShRz: 1.2, lElRx: -0.4, rShRx: -0.3, rShRz: 1.0, rElRx: -0.6,
        lHipRx: -0.15, lHipRz: 0.15, lKneeRx: 0.2, rHipRx: -0.45, rHipRz: 0.1, rKneeRx: 0.8 });
    },
    getup: function () { return M.mergePose(M.poses.crouch(0), { torsoRx: 0.6 }); },
    power: function (t) {
      var b = Math.sin(t * 30) * 0.03;
      return P({ hipsY: -0.15, torsoRx: -0.2, headRx: -0.3, lShRx: -0.3, lShRz: 1.3 + b, lElRx: -0.6, rShRx: -0.3, rShRz: 1.3 + b, rElRx: -0.6,
        lHipRx: -0.3, lHipRz: 0.25, lKneeRx: 0.5, rHipRx: 0.2, rHipRz: 0.25, rKneeRx: 0.5 });
    },
    headstand: function (t) {
      var w = Math.sin(t * 4) * 0.12;
      return P({ bodyRx: Math.PI, bodyLift: 1.98, hipsY: 0, lShRx: -2.9, lShRz: 0.35, lElRx: -0.2, rShRx: -2.9, rShRz: 0.35, rElRx: -0.2,
        lHipRx: 0.0, lHipRz: 0.45 + w, rHipRx: 0.0, rHipRz: 0.45 - w, lKneeRx: 0.1, rKneeRx: 0.1, headRx: 0.3 });
    },
    flurry: function (t) {
      var s = Math.sin(t * 40), c = Math.cos(t * 40);
      return M.mergePose(M.poses.idle(0), { torsoRx: 0.2, torsoRy: s * 0.4, rShRx: -1.0 - 0.6 * Math.max(0, s), rElRx: -1.2 * (1 - Math.max(0, s)), lShRx: -1.0 - 0.6 * Math.max(0, c), lElRx: -1.2 * (1 - Math.max(0, c)), lHipRx: -0.6, lKneeRx: 0.6 });
    },
    uppercut: function () {
      return P({ hipsY: 0, torsoRx: -0.2, torsoRy: -0.35, headRx: -0.3, rShRx: -2.95, rShRz: 0.12, rElRx: -0.15, lShRx: -0.5, lShRz: 0.3, lElRx: -1.6,
        lHipRx: -1.45, lKneeRx: 1.9, rHipRx: 0.15, rKneeRx: 0.25 });
    },
    counterStance: function (t) {
      var b = Math.sin(t * 18) * 0.04;
      return P({ hipsY: -0.14, torsoRx: 0.05, torsoRy: 0.45, headRx: 0.08, lShRx: -1.35 + b, lShRz: 0.35, lElRx: -0.35, rShRx: -0.75, rShRz: 0.5, rElRx: -1.3,
        lHipRx: -0.55, lHipRz: 0.1, lKneeRx: 0.75, rHipRx: 0.45, rHipRz: 0.12, rKneeRx: 0.55 });
    },
    victory: function (kind, t) {
      var base = M.poses.idle(t);
      switch (kind) {
        case 'headstand': return M.poses.headstand(t);
        case 'point': return M.mergePose(base, { torsoRy: 0, headRy: 0, rShRx: -1.55, rShRz: -0.15, rElRx: 0, lShRx: 0.0, lShRz: 0.6, lElRx: -1.9, lHipRx: -0.1, rHipRx: 0.1, lKneeRx: 0.1, rKneeRx: 0.1, hipsY: -0.01 });
        case 'salute': return M.mergePose(base, { torsoRy: 0, headRy: 0, headRx: -0.1, rShRx: -1.3, rShRz: 1.1, rElRx: -2.3, lShRx: 0, lShRz: 0.08, lElRx: 0, lHipRx: 0, rHipRx: 0, lKneeRx: 0, rKneeRx: 0, hipsY: 0, torsoRx: -0.05 });
        case 'wave': return M.mergePose(base, { torsoRy: 0, headRy: 0, rShRx: -2.6, rShRz: 0.5, rElRx: -0.5 + Math.sin(t * 9) * 0.45, lShRx: 0, lShRz: 0.1, lElRx: -0.2, lHipRx: -0.1, rHipRx: 0.1, lKneeRx: 0.1, rKneeRx: 0.1, hipsY: -0.01 });
        case 'bow': var bw = Math.max(0, Math.sin(Math.min(t, 1.6) * 2)); return M.mergePose(base, { torsoRy: 0, headRy: 0, torsoRx: 0.75 * bw, rShRx: -0.4 * bw, rElRx: -1.6, lShRx: 0.3, lShRz: 0.1, lElRx: 0, lHipRx: 0, rHipRx: 0, lKneeRx: 0.05, rKneeRx: 0.05, hipsY: 0 });
        case 'fist':
        default: return M.mergePose(base, { torsoRy: 0.1, headRy: 0, headRx: -0.25, rShRx: -2.9, rShRz: 0.2, rElRx: -0.35 + Math.sin(t * 8) * 0.15, lShRx: 0.1, lShRz: 0.35, lElRx: -1.7, hipsY: -0.02 });
      }
    },
    defeated: function (t) {
      return P({ hipsY: -0.45, torsoRx: 0.7, headRx: 0.5, lShRx: -0.3, lShRz: 0.1, lElRx: -0.2, rShRx: -0.3, rShRz: 0.1, rElRx: -0.2, lHipRx: -1.3, lKneeRx: 2.4, rHipRx: -0.2, rKneeRx: 2.5 });
    }
  };

  /* ---------- ballot-box chest ---------- */
  M.buildChest = function () {
    var g = new T.Group(), body = new T.Group(); g.add(body);
    var mats = { main: new T.MeshToonMaterial({ color: new T.Color('#a8743f'), gradientMap: gradientMap() }),
      trim: new T.MeshToonMaterial({ color: new T.Color('#3a2a1a'), gradientMap: gradientMap() }),
      glow: new T.MeshBasicMaterial({ color: new T.Color('#ffcf8a'), transparent: true, opacity: 0.35, blending: T.AdditiveBlending, depthWrite: false }) };
    function mk(geo, mat, x, y, z) { var m = new T.Mesh(flat(geo), mat); m.position.set(x, y, z); m.castShadow = true; var o = new T.Mesh(geo, M.outlineMat); m.add(o); return m; }
    body.add(mk(box(1.3, 0.85, 0.9), mats.main, 0, 0.425, 0));
    body.add(mk(box(1.36, 0.12, 0.96), mats.trim, 0, 0.06, 0));
    [-0.55, 0.55].forEach(function (x) { body.add(mk(box(0.12, 0.88, 0.96), mats.trim, x, 0.43, 0)); });
    // ballot slip sticking out + star emblem
    var star = new T.Shape(); for (var i = 0; i < 12; i++) { var a = i / 12 * Math.PI * 2 - Math.PI / 2, r = i % 2 ? 0.07 : 0.16; if (i) star.lineTo(Math.cos(a) * r, Math.sin(a) * r); else star.moveTo(Math.cos(a) * r, Math.sin(a) * r); }
    var em = new T.Mesh(new T.ExtrudeGeometry(star, { depth: 0.03, bevelEnabled: false }), mats.trim); em.position.set(0, 0.45, 0.455); body.add(em);
    var lid = new T.Group(); lid.position.set(0, 0.85, -0.45); body.add(lid);
    lid.add(mk(box(1.38, 0.16, 0.98), mats.trim, 0, 0.08, 0.45));
    var slot = new T.Mesh(box(0.6, 0.02, 0.08), new T.MeshBasicMaterial({ color: '#000' })); slot.position.set(0, 0.17, 0.45); lid.add(slot);
    var paper = new T.Mesh(box(0.4, 0.28, 0.01), new T.MeshLambertMaterial({ color: '#fbfaf3' })); paper.position.set(0, 0.28, 0.45); lid.add(paper);
    var glow = new T.Mesh(new T.SphereGeometry(1.1, 18, 12), mats.glow); glow.position.y = 0.5; g.add(glow);
    var inner = new T.Mesh(new T.SphereGeometry(0.4, 12, 8), new T.MeshBasicMaterial({ color: '#fff6c8', transparent: true, opacity: 0, blending: T.AdditiveBlending, depthWrite: false }));
    inner.position.y = 0.9; g.add(inner);
    return { g: g, body: body, lid: lid, glow: glow, inner: inner, mats: mats,
      setTier: function (t) { mats.main.color.set(t.color); mats.glow.color.set(t.glow); mats.trim.color.set(t.id === 'wood' ? '#3a2a1a' : t.id === 'legend' ? '#ffffff' : '#1b1f2e'); } };
  };

  /* ---------- projectile + super object meshes ---------- */
  function addTo(g, m) { g.add(m); return m; }
  M.buildProp = function (type, color, opts) {
    var g = new T.Group();
    switch (type) {
      case 'scroll': {
        var p = addTo(g, M.part(cyl(0.09, 0.09, 0.42, 10), '#f3e7c4', 0, 0, 0)); p.rotation.x = Math.PI / 2;
        var k1 = addTo(g, M.part(cyl(0.035, 0.035, 0.5, 6), '#7a4a22', 0, 0, 0, false)); k1.rotation.x = Math.PI / 2;
        addTo(g, M.part(box(0.2, 0.004, 0.36), '#f3e7c4', 0, -0.09, 0.0, false)).position.set(0.12, -0.06, 0);
        addTo(g, M.part(cyl(0.095, 0.095, 0.05, 10), '#c0392b', 0, 0, 0, false)).rotation.x = Math.PI / 2;
        break;
      }
      case 'envelope': {
        addTo(g, M.part(box(0.36, 0.24, 0.03), '#fbfbf5', 0, 0, 0));
        var fl = addTo(g, M.part(new T.CylinderGeometry(0.21, 0.0, 0.14, 3), '#e9e6d8', 0, 0.05, 0.017, false)); fl.rotation.set(Math.PI / 2, Math.PI, 0); fl.scale.set(1, 0.1, 1);
        addTo(g, M.part(cyl(0.035, 0.035, 0.02, 8), '#b22222', 0, 0.0, 0.03, false)).rotation.x = Math.PI / 2;
        g.rotation.y = Math.PI / 2;
        break;
      }
      case 'water': {
        var wm = new T.MeshToonMaterial({ color: new T.Color('#3fa9f5'), gradientMap: gradientMap(), transparent: true, opacity: 0.85, emissive: new T.Color('#0b4f8a') });
        g.add(new T.Mesh(sph(0.2, 10, 8), wm));
        var d1 = new T.Mesh(sph(0.1, 8, 6), wm); d1.position.set(-0.25, 0.04, 0); g.add(d1);
        var d2 = new T.Mesh(sph(0.06, 6, 5), wm); d2.position.set(-0.42, -0.02, 0); g.add(d2);
        g.userData.trail = true;
        break;
      }
      case 'handbag': {
        addTo(g, M.part(box(0.3, 0.22, 0.12), '#3b2a20', 0, 0, 0));
        addTo(g, M.part(new T.TorusGeometry(0.09, 0.015, 5, 10, Math.PI), '#3b2a20', 0, 0.11, 0, false));
        addTo(g, M.part(box(0.06, 0.04, 0.13), '#d4a017', 0, 0.06, 0, false));
        g.userData.spin = 'z';
        break;
      }
      case 'soundring': {
        for (var i = 0; i < 3; i++) {
          var r = new T.Mesh(new T.TorusGeometry(0.12 + i * 0.07, 0.022, 6, 18), M.glow('#ff8a3d', 0.9 - i * 0.2));
          r.rotation.y = Math.PI / 2; r.position.x = -i * 0.13; g.add(r);
        }
        break;
      }
      case 'bulb': {
        addTo(g, M.part(sph(0.15, 10, 8), '#fff3a0', 0, 0.05, 0)).material = M.toon('#fff3a0', '#ffd23f');
        addTo(g, M.part(cyl(0.07, 0.07, 0.1, 8), '#9aa0a6', 0, -0.12, 0));
        var halo = new T.Mesh(sph(0.24, 10, 8), M.glow('#ffe066', 0.25)); halo.position.y = 0.05; g.add(halo);
        g.rotation.z = -Math.PI / 2;
        break;
      }
      case 'bomb': {
        addTo(g, M.part(sph(0.19, 12, 10), '#1b1b1f', 0, 0, 0));
        addTo(g, M.part(new T.TorusGeometry(0.19, 0.012, 4, 20), '#ff2b2b', 0, 0, 0, false)).rotation.y = Math.PI / 2;
        addTo(g, M.part(cyl(0.05, 0.05, 0.06, 8), '#3a3a3a', 0, 0.2, 0));
        var fuse = addTo(g, M.part(cyl(0.012, 0.012, 0.14, 5), '#c9a26b', 0.03, 0.29, 0, false)); fuse.rotation.z = -0.4;
        var spark = new T.Mesh(sph(0.05, 6, 5), M.glow('#ffd23f', 1)); spark.position.set(0.06, 0.37, 0); g.add(spark);
        g.userData.spin = 'x';
        break;
      }
      case 'folder': {
        addTo(g, M.part(box(0.36, 0.26, 0.04), '#e0b866', 0, 0, 0));
        addTo(g, M.part(box(0.3, 0.22, 0.045), '#ffffff', 0.01, 0.01, 0, false));
        addTo(g, M.part(box(0.12, 0.05, 0.042), '#e0b866', -0.1, 0.15, 0, false));
        g.rotation.y = Math.PI / 2; g.userData.spin = 'y';
        break;
      }
      case 'byte': {
        for (var b = 0; b < 7; b++) {
          var cube = M.part(box(0.08, 0.08, 0.08), '#39ff88', (Math.random() - 0.5) * 0.35, (Math.random() - 0.5) * 0.25, (Math.random() - 0.5) * 0.2, false);
          cube.material = M.toon('#39ff88', '#0f8a3c'); g.add(cube);
        }
        var bh = new T.Mesh(sph(0.22, 8, 6), M.glow('#39ff88', 0.25)); g.add(bh);
        g.userData.spin = 'x';
        break;
      }
      case 'mic': {
        var hd = addTo(g, M.part(sph(0.09, 8, 6), '#a7adb4', 0.18, 0, 0));
        var hdl = addTo(g, M.part(cyl(0.035, 0.03, 0.3, 8), '#1d1d1d', 0, 0, 0)); hdl.rotation.z = Math.PI / 2;
        addTo(g, M.part(box(0.09, 0.09, 0.09), '#e63946', 0.08, 0, 0, false));
        g.userData.spin = 'x';
        break;
      }
      case 'banner': {
        addTo(g, M.part(box(0.04, 0.5, 0.04), '#c9a26b', 0, 0, 0, false));
        var fl2 = addTo(g, M.part(box(0.36, 0.26, 0.01), '#ffffff', 0.2, 0.1, 0, false));
        addTo(g, M.part(box(0.36, 0.035, 0.012), '#0038b8', 0.2, 0.19, 0, false));
        addTo(g, M.part(box(0.36, 0.035, 0.012), '#0038b8', 0.2, 0.01, 0, false));
        g.userData.spin = 'x';
        break;
      }
      case 'crown': {
        var cr = new T.CylinderGeometry(0.15, 0.13, 0.12, 10, 1, true);
        var cm = M.part(cr, '#ffcc33', 0, 0, 0); cm.material = M.toon('#ffcc33', '#a87b00'); cm.material.side = T.DoubleSide; g.add(cm);
        for (var s = 0; s < 5; s++) {
          var a = s / 5 * Math.PI * 2;
          var sp = M.part(new T.ConeGeometry(0.035, 0.1, 4), '#ffcc33', Math.cos(a) * 0.14, 0.1, Math.sin(a) * 0.14, false); g.add(sp);
          g.add(M.part(sph(0.022, 6, 4), '#d7263d', Math.cos(a) * 0.145, 0.0, Math.sin(a) * 0.145, false));
        }
        g.userData.spin = 'y';
        break;
      }
      case 'flag': {
        addTo(g, M.part(box(0.03, 0.55, 0.03), '#c9a26b', 0, 0, 0, false));
        addTo(g, M.part(box(0.36, 0.24, 0.01), color || '#7b4dff', 0.2, 0.13, 0, false));
        addTo(g, M.part(box(0.36, 0.05, 0.012), '#ffffff', 0.2, 0.13, 0, false));
        break;
      }
      case 'gavelwave': {
        var gr = new T.Mesh(new T.TorusGeometry(0.22, 0.03, 6, 18), M.glow('#ffcf6a', 0.85)); gr.rotation.y = Math.PI / 2; g.add(gr);
        var gh = addTo(g, M.part(cyl(0.07, 0.07, 0.22, 8), '#8a5a2b', 0, 0, 0)); gh.rotation.x = Math.PI / 2;
        addTo(g, M.part(cyl(0.02, 0.02, 0.3, 6), '#6b3e1f', 0, -0.15, 0, false));
        break;
      }
      case 'olive': {
        var br = addTo(g, M.part(cyl(0.015, 0.02, 0.5, 5), '#6b4a2b', 0, 0, 0, false)); br.rotation.z = Math.PI / 2;
        for (var ol = 0; ol < 7; ol++) {
          var lf = sph(0.05, 6, 4); lf.scale(1.6, 0.35, 0.6);
          var leaf = M.part(lf, ol % 2 ? '#6f9a4a' : '#86b35c', -0.2 + ol * 0.065, (ol % 2 ? 0.05 : -0.05), 0, false);
          leaf.rotation.z = (ol % 2 ? 0.5 : -0.5); g.add(leaf);
        }
        addTo(g, M.part(sph(0.035, 6, 5), '#3b4a1f', 0.05, 0.08, 0.02, false));
        addTo(g, M.part(sph(0.035, 6, 5), '#3b4a1f', -0.08, -0.07, 0.02, false));
        var oh = new T.Mesh(sph(0.24, 8, 6), M.glow('#d8f5a2', 0.18)); g.add(oh);
        g.userData.spin = 'x';
        break;
      }
      case 'briefcase': {
        addTo(g, M.part(box(0.36, 0.26, 0.09), '#4a2f1d', 0, 0, 0));
        addTo(g, M.part(new T.TorusGeometry(0.06, 0.012, 5, 10, Math.PI), '#2a1a10', 0, 0.13, 0, false));
        addTo(g, M.part(box(0.04, 0.03, 0.1), '#d4a017', 0.1, 0.09, 0, false));
        addTo(g, M.part(box(0.04, 0.03, 0.1), '#d4a017', -0.1, 0.09, 0, false));
        addTo(g, M.part(box(0.37, 0.02, 0.095), '#2a1a10', 0, 0.0, 0, false));
        g.userData.spin = 'z';
        break;
      }
      case 'seal': {
        var sd = addTo(g, M.part(cyl(0.18, 0.18, 0.04, 16), '#d4af37', 0, 0, 0)); sd.rotation.z = Math.PI / 2;
        sd.material = M.toon('#d4af37', '#7a5a00');
        var si = addTo(g, M.part(cyl(0.12, 0.12, 0.05, 16), '#0038b8', 0, 0, 0, false)); si.rotation.z = Math.PI / 2;
        var sr = addTo(g, M.part(new T.TorusGeometry(0.15, 0.012, 4, 20), '#fff6c8', 0, 0, 0, false)); sr.rotation.y = Math.PI / 2;
        addTo(g, M.part(box(0.06, 0.1, 0.02), '#f3d77a', 0.03, 0, 0, false)).rotation.y = Math.PI / 2;
        var sh2 = new T.Mesh(sph(0.26, 8, 6), M.glow('#ffe48a', 0.18)); g.add(sh2);
        g.userData.spin = 'x';
        break;
      }
      case 'chess': {
        var cm = '#f2f2f2';
        addTo(g, M.part(cyl(0.13, 0.15, 0.06, 12), cm, 0, -0.18, 0));
        addTo(g, M.part(cyl(0.08, 0.11, 0.16, 10), cm, 0, -0.07, 0));
        var neck = addTo(g, M.part(box(0.1, 0.22, 0.13), cm, 0.0, 0.08, 0)); neck.rotation.z = -0.25;
        var snout = addTo(g, M.part(box(0.17, 0.08, 0.11), cm, 0.07, 0.15, 0)); snout.rotation.z = -0.35;
        addTo(g, M.part(new T.ConeGeometry(0.03, 0.07, 4), cm, -0.04, 0.24, 0.03, false));
        addTo(g, M.part(sph(0.015, 5, 4), '#111', 0.04, 0.17, 0.06, false));
        g.userData.spin = 'z';
        break;
      }
      case 'rock': {
        var rk = new T.IcosahedronGeometry(0.17, 0); rk.scale(1.2, 0.85, 1);
        addTo(g, M.part(rk, '#8a7f72', 0, 0, 0));
        addTo(g, M.part(new T.IcosahedronGeometry(0.06, 0), '#b07a3c', 0.1, 0.08, 0.05, false));
        g.userData.spin = 'x';
        break;
      }
      case 'dreidel': {
        var dc = color || '#3d7bff';
        addTo(g, M.part(box(0.3, 0.3, 0.3), dc, 0, 0.15, 0));
        var tip = addTo(g, M.part(new T.ConeGeometry(0.21, 0.22, 4), dc, 0, -0.11, 0)); tip.rotation.y = Math.PI / 4; tip.rotation.x = Math.PI;
        addTo(g, M.part(cyl(0.03, 0.03, 0.18, 6), '#e8e8e8', 0, 0.39, 0));
        addTo(g, M.part(box(0.12, 0.14, 0.02), '#f2c14e', 0, 0.15, 0.16, false));
        break;
      }
      case 'teacup': {
        addTo(g, M.part(cyl(0.12, 0.08, 0.13, 10), '#f7f3e8', 0, 0, 0));
        addTo(g, M.part(cyl(0.18, 0.15, 0.025, 12), '#f7f3e8', 0, -0.07, 0));
        addTo(g, M.part(new T.TorusGeometry(0.045, 0.014, 5, 10), '#f7f3e8', 0.13, 0.0, 0, false));
        addTo(g, M.part(cyl(0.105, 0.105, 0.01, 10), '#8a4b1f', 0, 0.06, 0, false));
        addTo(g, M.part(cyl(0.122, 0.122, 0.02, 10), '#2f6fb0', 0, 0.035, 0, false));
        g.scale.setScalar(1.4);
        break;
      }
      case 'piano': {
        addTo(g, M.part(box(1.5, 0.35, 1.0), '#141414', 0, 0.75, 0));
        var lid = addTo(g, M.part(box(1.45, 0.03, 0.95), '#1d1d1d', 0.1, 1.2, -0.25)); lid.rotation.x = -0.6;
        addTo(g, M.part(box(0.04, 0.6, 0.04), '#141414', 0.1, 1.05, 0.05, false)).rotation.x = -0.2;
        addTo(g, M.part(box(1.3, 0.06, 0.18), '#ffffff', 0, 0.86, 0.55, false));
        for (var k = 0; k < 10; k++) addTo(g, M.part(box(0.06, 0.03, 0.1), '#111', -0.55 + k * 0.12, 0.9, 0.52, false));
        [[-0.65, 0.4], [0.65, 0.4], [0, -0.4]].forEach(function (lp) { addTo(g, M.part(cyl(0.06, 0.04, 0.6, 6), '#141414', lp[0], 0.3, lp[1])); });
        break;
      }
      case 'bigcrown': {
        var bc = M.buildProp('crown'); bc.scale.setScalar(5); bc.position.y = 0.3; g.add(bc);
        break;
      }
      case 'biggavel': {
        var hh = addTo(g, M.part(cyl(0.35, 0.35, 1.4, 12), '#8a5a2b', 0, 0.35, 0)); hh.rotation.z = Math.PI / 2;
        addTo(g, M.part(cyl(0.37, 0.37, 0.1, 12), '#d4a017', 0.55, 0.35, 0, false)).rotation.z = Math.PI / 2;
        addTo(g, M.part(cyl(0.37, 0.37, 0.1, 12), '#d4a017', -0.55, 0.35, 0, false)).rotation.z = Math.PI / 2;
        addTo(g, M.part(cyl(0.09, 0.09, 1.8, 8), '#6b3e1f', 0, 1.25, 0));
        break;
      }
      case 'bulldozer': {
        addTo(g, M.part(box(2.0, 0.7, 1.3), '#f2b705', 0, 0.75, 0));
        addTo(g, M.part(box(0.9, 0.8, 1.1), '#f2b705', -0.4, 1.5, 0));
        addTo(g, M.part(box(0.8, 0.6, 1.12), '#9fd3ff', -0.4, 1.55, 0, false)).material = M.toon('#9fd3ff', '#2a6f9e');
        addTo(g, M.part(box(2.3, 0.4, 0.35), '#2a2a2a', 0, 0.22, 0.55));
        addTo(g, M.part(box(2.3, 0.4, 0.35), '#2a2a2a', 0, 0.22, -0.55));
        var blade = addTo(g, M.part(box(0.15, 1.0, 1.7), '#c99700', 1.35, 0.55, 0)); blade.rotation.z = -0.15;
        addTo(g, M.part(cyl(0.06, 0.06, 0.6, 6), '#333', 0.3, 1.4, 0.4, false));
        break;
      }
      case 'order': {
        addTo(g, M.part(box(0.38, 0.28, 0.035), '#1d1d1d', 0, 0, 0));
        addTo(g, M.part(box(0.33, 0.24, 0.04), '#fbfaf3', 0.01, 0.0, 0, false));
        for (var ln = 0; ln < 4; ln++) addTo(g, M.part(box(0.24, 0.012, 0.042), '#9aa0a6', 0.0, 0.08 - ln * 0.04, 0, false));
        var sig = addTo(g, M.part(box(0.2, 0.03, 0.044), '#d4af37', 0.02, -0.09, 0, false)); sig.rotation.z = 0.2;
        addTo(g, M.part(cyl(0.035, 0.035, 0.046, 10), '#d4af37', -0.12, -0.08, 0, false)).rotation.x = Math.PI / 2;
        g.rotation.y = Math.PI / 2; g.userData.spin = 'y';
        break;
      }
      case 'moneybag': {
        if (!M._dollarTex) {
          var dc = document.createElement('canvas'); dc.width = dc.height = 64;
          var dx = dc.getContext('2d'); dx.fillStyle = '#ffd23f'; dx.font = 'bold 54px Arial'; dx.textAlign = 'center'; dx.textBaseline = 'middle'; dx.lineWidth = 6; dx.strokeStyle = '#1d4d2a'; dx.strokeText('$', 32, 35); dx.fillText('$', 32, 35);
          M._dollarTex = new T.CanvasTexture(dc); M._dollarTex.encoding = T.sRGBEncoding;
        }
        var decal = function (w, x, y, z) { var dm = new T.Mesh(new T.PlaneGeometry(w, w), new T.MeshBasicMaterial({ map: M._dollarTex, transparent: true, depthWrite: false })); dm.position.set(x, y, z); return addTo(g, dm); };
        if (opts && opts.cash) {
          addTo(g, M.part(box(0.42, 0.14, 0.22), '#3f8f4f', 0, 0, 0));
          addTo(g, M.part(box(0.1, 0.15, 0.23), '#f4f1e4', 0, 0, 0, false));
          decal(0.12, 0.15, 0.072, 0).rotation.x = -Math.PI / 2;
          decal(0.12, -0.15, 0.072, 0).rotation.x = -Math.PI / 2;
          g.userData.spin = 'y';
        } else {
          var sack = sph(0.22, 12, 10); sack.scale(1, 0.92, 0.9);
          addTo(g, M.part(sack, '#3f8f4f', 0, 0, 0));
          addTo(g, M.part(cyl(0.06, 0.11, 0.12, 10), '#3f8f4f', 0, 0.22, 0));
          addTo(g, M.part(new T.TorusGeometry(0.07, 0.018, 5, 12), '#d4af37', 0, 0.2, 0, false)).rotation.x = Math.PI / 2;
          addTo(g, M.part(sph(0.08, 8, 6), '#3f8f4f', 0, 0.3, 0));
          decal(0.26, 0, 0, 0.205);
          decal(0.26, 0, 0, -0.205).rotation.y = Math.PI;
          g.userData.spin = 'y';
        }
        break;
      }
      case 'tram': {
        addTo(g, M.part(box(4.2, 1.6, 1.3), '#e6e9ee', 0, 1.15, 0));
        addTo(g, M.part(box(4.22, 0.18, 1.32), '#d7263d', 0, 0.62, 0, false));
        addTo(g, M.part(box(3.9, 0.55, 1.33), '#20303f', -0.05, 1.4, 0, false)).material = M.toon('#20303f', '#0b1a2a');
        var nose = addTo(g, M.part(box(0.4, 1.5, 1.28), '#e6e9ee', 2.2, 1.1, 0)); nose.rotation.z = 0.25;
        addTo(g, M.part(box(0.08, 0.6, 0.08), '#333', 0, 2.2, 0, false)).rotation.z = 0.6;
        addTo(g, M.part(sph(0.08, 6, 5), '#fff6a0', 2.33, 0.75, 0.45, false)).material = M.toon('#fff6a0', '#ffd23f');
        addTo(g, M.part(sph(0.08, 6, 5), '#fff6a0', 2.33, 0.75, -0.45, false)).material = M.toon('#fff6a0', '#ffd23f');
        break;
      }
      case 'unicorn': {
        addTo(g, M.part(box(1.3, 0.65, 0.55), '#ffffff', 0, 1.15, 0));
        var nk = addTo(g, M.part(box(0.35, 0.7, 0.35), '#ffffff', 0.62, 1.55, 0)); nk.rotation.z = -0.5;
        addTo(g, M.part(box(0.55, 0.3, 0.3), '#ffffff', 0.95, 1.9, 0));
        var horn = addTo(g, M.part(new T.ConeGeometry(0.07, 0.45, 6), '#ffd23f', 1.05, 2.25, 0)); horn.rotation.z = -0.6;
        horn.material = M.toon('#ffd23f', '#c98a00');
        var mane = ['#ff4d6d', '#ffb703', '#4cd964', '#4d96ff', '#9b5de5'];
        mane.forEach(function (c, i) { addTo(g, M.part(box(0.12, 0.25, 0.4), c, 0.55 - i * 0.03 + 0.25, 1.9 - i * 0.16, 0, false)); });
        mane.forEach(function (c, i) { addTo(g, M.part(box(0.25, 0.08, 0.2), c, -0.72 - i * 0.04, 1.3 - i * 0.07, 0, false)); });
        [[0.45, 0.2], [0.45, -0.2], [-0.45, 0.2], [-0.45, -0.2]].forEach(function (lp, i) {
          var leg = M.part(box(0.15, 0.85, 0.15), '#ffffff', lp[0], 0.45, lp[1]); g.add(leg); leg.userData.leg = i;
        });
        addTo(g, M.part(sph(0.04, 6, 5), '#111', 1.1, 1.97, 0.15, false));
        g.userData.gallop = true;
        break;
      }
      default:
        addTo(g, M.part(sph(0.15, 8, 6), color || '#ffffff', 0, 0, 0));
    }
    return g;
  };
})();
