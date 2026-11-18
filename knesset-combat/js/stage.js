/* Knesset Combat 26' — the plenum chamber stage. */
(function () {
  var T = THREE;
  var M = KC.Models;
  var S = KC.Stage = {};
  KC.THEMES = [
    { id: 'classic', name: 'Classic Plenum', price: 0, desc: 'The Knesset as it is — wood, stone and 120 blue seats.' },
    { id: 'hanukkah', name: 'Hanukkah', price: 1200, desc: 'Giant lit hanukkiot by the dais, blue-and-white string lights and spinning dreidels.' },
    { id: 'independence', name: 'Independence Day', price: 1000, desc: 'Flag garlands across the chamber and fireworks over the gallery.' },
    { id: 'purim', name: 'Purim', price: 900, desc: 'Carnival masks, balloons and non-stop confetti.' },
    { id: 'sukkot', name: 'Sukkot', price: 900, desc: 'A palm-frond schach roof with hanging pomegranates, etrogim and grapes.' }
  ];

  function lam(color, opts) { var o = Object.assign({ color: new T.Color(color), flatShading: true }, opts || {}); return new T.MeshLambertMaterial(o); }
  function mesh(geo, mat, x, y, z, shadow) {
    var m = new T.Mesh(geo, mat); m.position.set(x || 0, y || 0, z || 0);
    m.receiveShadow = true; if (shadow) m.castShadow = true; return m;
  }
  function canvasTex(w, h, draw) {
    var c = document.createElement('canvas'); c.width = w; c.height = h;
    var ctx = c.getContext('2d'); draw(ctx, w, h);
    var t = new T.CanvasTexture(c); t.encoding = T.sRGBEncoding; t.anisotropy = 4;
    t.userData = { canvas: c, ctx: ctx };
    return t;
  }
  function drawStar(ctx, cx, cy, r, lw, color) {
    ctx.strokeStyle = color; ctx.lineWidth = lw; ctx.lineJoin = 'miter';
    for (var k = 0; k < 2; k++) {
      ctx.beginPath();
      for (var i = 0; i < 3; i++) {
        var a = -Math.PI / 2 + i * Math.PI * 2 / 3 + k * Math.PI;
        var x = cx + Math.cos(a) * r, y = cy + Math.sin(a) * r;
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.closePath(); ctx.stroke();
    }
  }
  function drawMenorah(ctx, cx, cy, s, color) {
    ctx.strokeStyle = color; ctx.fillStyle = color; ctx.lineCap = 'round';
    ctx.lineWidth = s * 0.07;
    // center stem
    ctx.beginPath(); ctx.moveTo(cx, cy - s); ctx.lineTo(cx, cy + s * 0.55); ctx.stroke();
    for (var i = 1; i <= 3; i++) {
      var r = s * 0.28 * i;
      ctx.beginPath(); ctx.arc(cx, cy - s * 0.1, r, 0, Math.PI, false); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(cx - r, cy - s * 0.1); ctx.lineTo(cx - r, cy - s); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(cx + r, cy - s * 0.1); ctx.lineTo(cx + r, cy - s); ctx.stroke();
    }
    for (var j = -3; j <= 3; j++) { ctx.beginPath(); ctx.arc(cx + j * s * 0.28, cy - s * 1.05, s * 0.06, 0, Math.PI * 2); ctx.fill(); }
    ctx.fillRect(cx - s * 0.35, cy + s * 0.5, s * 0.7, s * 0.12);
    ctx.fillRect(cx - s * 0.2, cy + s * 0.62, s * 0.4, s * 0.1);
  }
  function drawOlive(ctx, cx, cy, s, dir, color) {
    ctx.strokeStyle = color; ctx.fillStyle = color; ctx.lineWidth = s * 0.03;
    ctx.beginPath(); ctx.moveTo(cx, cy + s * 0.7);
    ctx.quadraticCurveTo(cx + dir * s * 0.55, cy, cx + dir * s * 0.1, cy - s * 0.9); ctx.stroke();
    for (var i = 0; i < 8; i++) {
      var t = i / 8, px = cx + dir * (s * 0.42 * Math.sin(t * Math.PI)) + dir * s * 0.02, py = cy + s * 0.65 - t * s * 1.5;
      ctx.save(); ctx.translate(px, py); ctx.rotate(dir * (0.6 + t * 0.4));
      ctx.beginPath(); ctx.ellipse(dir * s * 0.07, 0, s * 0.08, s * 0.03, 0, 0, Math.PI * 2); ctx.fill(); ctx.restore();
    }
  }

  S.build = function (scene) {
    var st = { group: new T.Group(), flags: [], t: 0, mode: 'day' };
    var G = st.group; scene.add(G);

    /* ---- lights ---- */
    st.hemi = new T.HemisphereLight(0xfff4e0, 0x4a5568, 0.75); G.add(st.hemi);
    var key = new T.DirectionalLight(0xfff1dc, 1.05);
    key.position.set(-5, 14, 10); key.castShadow = true;
    key.shadow.mapSize.set(2048, 2048);
    var sc = key.shadow.camera; sc.left = -12; sc.right = 12; sc.top = 10; sc.bottom = -6; sc.near = 1; sc.far = 40;
    key.shadow.bias = -0.0006; key.shadow.normalBias = 0.02;
    G.add(key); G.add(key.target); st.key = key;
    var rim = new T.DirectionalLight(0x9cc4ff, 0.45); rim.position.set(6, 8, -12); G.add(rim); st.rim = rim;
    st.spot = new T.SpotLight(0xfff0d0, 0, 40, 0.36, 0.55, 1.0);
    st.spot.castShadow = false;
    st.spot.position.set(0, 13, 4); st.spot.target.position.set(0, 0, 0); G.add(st.spot); G.add(st.spot.target);

    scene.background = new T.Color('#1c2433');
    scene.fog = new T.Fog('#1c2433', 28, 62);

    /* ---- floor ---- */
    var carpet = lam('#2c4a73');
    var floor = mesh(new T.CircleGeometry(40, 48), carpet, 0, 0, 0); floor.rotation.x = -Math.PI / 2; G.add(floor);
    var well = mesh(new T.CircleGeometry(1, 40), lam('#cdbd9c'), 0, 0.005, -0.6); well.rotation.x = -Math.PI / 2; well.scale.set(9.6, 3.6, 1); G.add(well);
    var trim = mesh(new T.RingGeometry(0.97, 1.0, 64), new T.MeshBasicMaterial({ color: '#c9a227' }), 0, 0.008, -0.6); trim.rotation.x = -Math.PI / 2; trim.scale.set(9.6, 3.6, 1); G.add(trim);
    var inlayTex = canvasTex(512, 512, function (ctx, w, h) {
      ctx.clearRect(0, 0, w, h);
      ctx.globalAlpha = 0.9; drawMenorah(ctx, w / 2, h / 2 + 20, 150, '#b88d2a');
      drawOlive(ctx, w / 2 - 190, h / 2 + 10, 160, -1, '#b88d2a'); drawOlive(ctx, w / 2 + 190, h / 2 + 10, 160, 1, '#b88d2a');
    });
    var inlay = mesh(new T.PlaneGeometry(4.5, 4.5), new T.MeshLambertMaterial({ map: inlayTex, transparent: true, depthWrite: false }), 0, 0.012, -1.4);
    inlay.rotation.x = -Math.PI / 2; G.add(inlay);

    /* ---- walls ---- */
    var stone = lam('#d6c6a3'), wood = lam('#8f5f36'), woodLight = lam('#b7854f'), woodDark = lam('#5e3b1f');
    var back = mesh(new T.BoxGeometry(44, 14, 0.5), stone, 0, 7, -14.7); G.add(back);
    [-1, 1].forEach(function (s) {
      var side = mesh(new T.BoxGeometry(0.5, 14, 34), stone, s * 20, 7, -2); side.rotation.y = s * 0.12; G.add(side);
    });
    // wood slat panels along back wall
    var slatGeo = new T.BoxGeometry(0.18, 3.4, 0.12);
    var slats = new T.InstancedMesh(slatGeo, woodLight, 120);
    var mtx = new T.Matrix4(), q = new T.Quaternion(), pos = new T.Vector3(), scl = new T.Vector3(1, 1, 1);
    var si = 0;
    for (var i = 0; i < 120; i++) { mtx.makeTranslation(-18 + i * 0.3, 1.7, -14.35); slats.setMatrixAt(si++, mtx); }
    slats.receiveShadow = true; G.add(slats);
    G.add(mesh(new T.BoxGeometry(36, 3.6, 0.1), woodDark, 0, 1.8, -14.45));
    // gallery glass
    var glass = new T.MeshLambertMaterial({ color: '#7fa6c9', transparent: true, opacity: 0.45, emissive: new T.Color('#16324d') });
    G.add(mesh(new T.BoxGeometry(34, 2.2, 0.15), glass, 0, 8.2, -14.2));
    G.add(mesh(new T.BoxGeometry(34, 0.25, 0.6), woodDark, 0, 7.0, -14.1));
    G.add(mesh(new T.BoxGeometry(34, 0.25, 0.6), woodDark, 0, 9.4, -14.1));
    // gallery visitors (silhouettes)
    var vis = new T.InstancedMesh(new T.CapsuleGeometry ? new T.CapsuleGeometry(0.18, 0.4, 3, 6) : new T.CylinderGeometry(0.18, 0.18, 0.7, 6), lam('#2a3240'), 40);
    for (var v = 0; v < 40; v++) { mtx.makeTranslation(-16 + v * 0.82 + Math.random() * 0.3, 7.65 + Math.random() * 0.1, -14.4); vis.setMatrixAt(v, mtx); }
    G.add(vis);
    // ceiling with light panels
    var ceil = mesh(new T.PlaneGeometry(44, 34), lam('#2b2f38'), 0, 12.5, -2); ceil.rotation.x = Math.PI / 2; G.add(ceil);
    var lightMat = new T.MeshBasicMaterial({ color: '#fff3d6' });
    var lamps = new T.InstancedMesh(new T.BoxGeometry(1.6, 0.08, 0.5), lightMat, 48);
    var li = 0;
    for (var lx = 0; lx < 8; lx++) for (var lz = 0; lz < 6; lz++) { mtx.makeTranslation(-14 + lx * 4, 12.4, -13 + lz * 3.6); lamps.setMatrixAt(li++, mtx); }
    G.add(lamps); st.lampMat = lightMat;

    /* ---- emblem ---- */
    var emblemTex = canvasTex(512, 600, function (ctx, w, h) {
      ctx.fillStyle = '#0038b8';
      ctx.beginPath(); ctx.moveTo(40, 30); ctx.lineTo(w - 40, 30); ctx.lineTo(w - 40, 380); ctx.quadraticCurveTo(w - 40, 560, w / 2, h - 20); ctx.quadraticCurveTo(40, 560, 40, 380); ctx.closePath(); ctx.fill();
      ctx.lineWidth = 14; ctx.strokeStyle = '#d4af37'; ctx.stroke();
      drawMenorah(ctx, w / 2, 300, 150, '#f3d77a');
      drawOlive(ctx, w / 2 - 175, 280, 170, -1, '#f3d77a'); drawOlive(ctx, w / 2 + 175, 280, 170, 1, '#f3d77a');
      ctx.fillStyle = '#ffffff'; ctx.font = 'bold 64px Rubik, Arial, sans-serif'; ctx.textAlign = 'center';
      ctx.fillText('הכנסת', w / 2, 505);
    });
    var emblem = mesh(new T.PlaneGeometry(3.4, 4.0), new T.MeshBasicMaterial({ map: emblemTex, transparent: true }), 0, 5.0, -14.4);
    G.add(emblem);

    /* ---- live vote boards ---- */
    st.boards = [];
    [-1, 1].forEach(function (s) {
      var tex = canvasTex(512, 256, function () {});
      var frame = mesh(new T.BoxGeometry(4.6, 2.5, 0.2), lam('#111318'), s * 6.4, 5.0, -14.35); G.add(frame);
      var scr = new T.Mesh(new T.PlaneGeometry(4.3, 2.15), new T.MeshBasicMaterial({ map: tex }));
      scr.position.set(s * 6.4, 5.0, -14.23); G.add(scr);
      st.boards.push({ tex: tex, side: s });
    });

    /* ---- speaker's dais ---- */
    var dais = new T.Group(); dais.position.set(0, 0, -10.8); G.add(dais);
    dais.add(mesh(new T.BoxGeometry(8.4, 0.5, 3.4), woodDark, 0, 0.25, 0, true));
    dais.add(mesh(new T.BoxGeometry(6.6, 0.7, 2.4), wood, 0, 0.85, -0.3, true));
    dais.add(mesh(new T.BoxGeometry(5.2, 1.0, 1.2), woodLight, 0, 1.7, -0.6, true));
    dais.add(mesh(new T.BoxGeometry(5.4, 0.1, 1.4), woodDark, 0, 2.25, -0.6, true));
    dais.add(mesh(new T.BoxGeometry(1.2, 0.08, 0.02), new T.MeshBasicMaterial({ color: '#d4af37' }), 0, 1.75, 0.01));
    // speaker chair + clerks table
    dais.add(mesh(new T.BoxGeometry(0.9, 1.6, 0.25), lam('#1f3f73'), 0, 2.6, -1.35, true));
    dais.add(mesh(new T.BoxGeometry(6.2, 0.75, 0.9), woodLight, 0, 0.88, 1.15, true));
    // rostrum
    var rost = new T.Group(); rost.position.set(0, 0, -8.0); G.add(rost);
    rost.add(mesh(new T.CylinderGeometry(0.55, 0.65, 1.2, 8), wood, 0, 0.6, 0, true));
    rost.add(mesh(new T.BoxGeometry(1.3, 0.08, 0.7), woodDark, 0, 1.24, 0.05, true));
    var micStand = mesh(new T.CylinderGeometry(0.015, 0.015, 0.45, 5), lam('#222'), 0, 1.45, 0.2); micStand.rotation.x = 0.4; rost.add(micStand);
    rost.add(mesh(new T.SphereGeometry(0.04, 6, 4), lam('#333'), 0, 1.66, 0.29));

    /* ---- Israeli flags ---- */
    var flagTex = st.flagTex = canvasTex(320, 220, function (ctx, w, h) {
      ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = '#0038b8'; ctx.fillRect(0, h * 0.1, w, h * 0.15); ctx.fillRect(0, h * 0.75, w, h * 0.15);
      drawStar(ctx, w / 2, h / 2 + 4, h * 0.2, 9, '#0038b8');
    });
    [-1, 1].forEach(function (s) {
      var pole = mesh(new T.CylinderGeometry(0.04, 0.05, 4.6, 6), lam('#c9a227'), s * 4.4, 2.3, -12.0, true); G.add(pole);
      G.add(mesh(new T.SphereGeometry(0.09, 8, 6), lam('#e5c35a'), s * 4.4, 4.65, -12.0));
      var geo = new T.PlaneGeometry(1.7, 1.15, 14, 6);
      geo.translate(0.85, 0, 0);
      var fl = new T.Mesh(geo, new T.MeshLambertMaterial({ map: flagTex, side: T.DoubleSide }));
      fl.position.set(s * 4.4, 3.85, -12.0);
      fl.rotation.y = s > 0 ? Math.PI : 0;
      fl.castShadow = true;
      G.add(fl);
      st.flags.push({ mesh: fl, base: geo.attributes.position.array.slice(), phase: s });
    });

    /* ---- government table ---- */
    var gov = new T.Group(); gov.position.set(0, 0, -4.8); G.add(gov);
    for (var gi = -4; gi <= 4; gi++) {
      var ang = gi * 0.07;
      var seg = mesh(new T.BoxGeometry(1.25, 0.08, 0.75), woodLight, gi * 1.2, 0.78, -Math.abs(gi) * Math.abs(gi) * 0.05, true);
      seg.rotation.y = -ang; gov.add(seg);
      var front = mesh(new T.BoxGeometry(1.25, 0.72, 0.06), wood, gi * 1.2, 0.38, 0.33 - Math.abs(gi) * Math.abs(gi) * 0.05, true);
      front.rotation.y = -ang; gov.add(front);
    }

    /* ---- MK seating: 120 seats ---- */
    var CENTER_Z = 0.0, ROWS = 5, PER_ROW = 12;
    var seats = [];
    var platMat = lam('#3b5d8c');
    for (var side = -1; side <= 1; side += 2) {
      for (var r = 0; r < ROWS; r++) {
        var rad = 10.2 + r * 1.3, h = 0.3 + r * 0.38;
        var a0 = -1.0, a1 = 0.0;
        // annular platform
        var shp = new T.Shape();
        var ri = rad - 0.66, ro = rad + 0.66, N = 18;
        for (var k = 0; k <= N; k++) { var a = a0 + (a1 - a0) * k / N; var pt = [side * ro * Math.cos(a), -(CENTER_Z + ro * Math.sin(a))]; if (k === 0) shp.moveTo(pt[0], pt[1]); else shp.lineTo(pt[0], pt[1]); }
        for (k = N; k >= 0; k--) { a = a0 + (a1 - a0) * k / N; shp.lineTo(side * ri * Math.cos(a), -(CENTER_Z + ri * Math.sin(a))); }
        var pg = new T.ExtrudeGeometry(shp, { depth: h, bevelEnabled: false });
        pg.rotateX(-Math.PI / 2);
        var plat = new T.Mesh(pg, platMat); plat.receiveShadow = true; G.add(plat);
        for (var p = 0; p < PER_ROW; p++) {
          var aa = a0 + 0.03 + (a1 - a0 - 0.06) * (p + 0.5) / PER_ROW;
          var sx = side * rad * Math.cos(aa), sz = CENTER_Z + rad * Math.sin(aa);
          var yaw = Math.atan2(-sx, CENTER_Z - sz); // face center
          seats.push({ x: sx, z: sz, y: h, yaw: yaw, row: r });
        }
      }
    }
    var nSeats = seats.length;
    var deskM = new T.InstancedMesh(new T.BoxGeometry(0.8, 0.12, 0.5), woodLight, nSeats);
    var deskF = new T.InstancedMesh(new T.BoxGeometry(0.8, 0.68, 0.06), wood, nSeats);
    var chairB = new T.InstancedMesh(new T.BoxGeometry(0.55, 0.85, 0.12), lam('#1f6fb2'), nSeats);
    var chairS = new T.InstancedMesh(new T.BoxGeometry(0.55, 0.12, 0.55), lam('#1f6fb2'), nSeats);
    var e = new T.Euler();
    function place(im, i, s, dx, dy, dz) {
      e.set(0, s.yaw, 0); q.setFromEuler(e);
      var off = new T.Vector3(dx, dy, dz).applyQuaternion(q);
      pos.set(s.x + off.x, s.y + off.y, s.z + off.z);
      mtx.compose(pos, q, scl); im.setMatrixAt(i, mtx);
    }
    seats.forEach(function (s, i) {
      place(deskM, i, s, 0, 0.78, 0.45); place(deskF, i, s, 0, 0.36, 0.69);
      place(chairS, i, s, 0, 0.45, -0.1); place(chairB, i, s, 0, 0.85, -0.38);
    });
    [deskM, deskF, chairB, chairS].forEach(function (im) { im.receiveShadow = true; G.add(im); });

    /* ---- NPC Members of Knesset (instanced) ---- */
    var npcs = [];
    seats.forEach(function (s) { if (Math.random() < 0.86) npcs.push({ seat: s }); });
    // ministers at the government table
    for (var mi = -4; mi <= 4; mi += 1) {
      if (Math.random() < 0.75) npcs.push({ seat: { x: mi * 1.2, z: -4.8 - 0.75 - mi * mi * 0.05, y: 0, yaw: 0, row: -1 } });
    }
    var nN = npcs.length;
    var suitCols = ['#1e2a44', '#2b2d33', '#3a3f4b', '#4a4f57', '#202020', '#5b4636', '#f2f2f2', '#7a1f2b', '#2f5d50', '#6d5a8a', '#e8d9b5', '#3f6fb5'];
    var skinCols = ['#f1c7a3', '#e5b48e', '#d9a37c', '#c68a63', '#a96f4b', '#eab892'];
    var hairCols = ['#1d1612', '#3a2a1e', '#6b4e33', '#9a9a96', '#d9d9d6', '#2a2a2a', '#b07a3c'];
    var torsoIM = new T.InstancedMesh(new T.BoxGeometry(0.44, 0.52, 0.27).toNonIndexed(), M.toon('#ffffff'), nN);
    var headIM = new T.InstancedMesh(new T.SphereGeometry(0.125, 8, 6).toNonIndexed(), M.toon('#ffffff'), nN);
    var hairIM = new T.InstancedMesh(new T.SphereGeometry(0.135, 8, 4, 0, Math.PI * 2, 0, Math.PI / 2).toNonIndexed(), M.toon('#ffffff'), nN);
    var armIM = new T.InstancedMesh(new T.BoxGeometry(0.1, 0.44, 0.1).toNonIndexed(), M.toon('#ffffff'), nN * 2);
    [torsoIM, headIM, hairIM, armIM].forEach(function (im) { im.geometry.computeVertexNormals(); im.castShadow = false; im.receiveShadow = false; G.add(im); });
    var col = new T.Color();
    npcs.forEach(function (n, i) {
      n.suit = suitCols[(Math.random() * suitCols.length) | 0];
      n.phase = Math.random() * Math.PI * 2;
      n.cheer = 0; n.stand = 0; n.look = 0;
      n.bald = Math.random() < 0.18;
      torsoIM.setColorAt(i, col.set(n.suit));
      headIM.setColorAt(i, col.set(skinCols[(Math.random() * skinCols.length) | 0]));
      hairIM.setColorAt(i, col.set(hairCols[(Math.random() * hairCols.length) | 0]));
      armIM.setColorAt(i * 2, col.set(n.suit)); armIM.setColorAt(i * 2 + 1, col.set(n.suit));
    });
    st.npcs = npcs;
    st.npcMeshes = { torso: torsoIM, head: headIM, hair: hairIM, arm: armIM };

    st.lookX = 0;
    var U = { euler: new T.Euler(0, 0, 0, 'YXZ'), qq: new T.Quaternion(), qh: new T.Quaternion(), qa: new T.Quaternion(), v: new T.Vector3(), off: new T.Vector3(), hang: new T.Vector3(), one: new T.Vector3(1, 1, 1), zero: new T.Vector3(0, 0, 0) };
    st.update = function (dt, focusX) {
      st.t += dt;
      var t = st.t;
      if (st.themeTick) st.themeTick(dt, t);
      st.lookX += ((focusX || 0) - st.lookX) * Math.min(1, dt * 3);
      // flags
      st.flags.forEach(function (f) {
        var arr = f.mesh.geometry.attributes.position.array, b = f.base;
        for (var i = 0; i < arr.length; i += 3) {
          var x = b[i];
          arr[i + 2] = Math.sin(x * 3.2 - t * 4.2 + f.phase) * 0.09 * x + Math.sin(b[i + 1] * 2 + t * 2.6) * 0.02 * x;
        }
        f.mesh.geometry.attributes.position.needsUpdate = true;
        f.mesh.geometry.computeVertexNormals();
      });
      // npcs
      var euler = U.euler, qq = U.qq, qh = U.qh, v = U.v, one = U.one, zero = U.zero;
      for (var i = 0; i < npcs.length; i++) {
        var n = npcs[i], s = n.seat;
        if (n.cheer > 0) n.cheer -= dt;
        var wantStand = n.cheer > 0 ? 1 : 0;
        n.stand += (wantStand - n.stand) * Math.min(1, dt * 8);
        var bob = Math.sin(t * 1.3 + n.phase) * 0.012 + (n.cheer > 0 ? Math.abs(Math.sin(t * 12 + n.phase)) * 0.08 : 0);
        var baseY = s.y + 0.45 + 0.3 + n.stand * 0.42 + bob;
        euler.set(0, s.yaw, 0); qq.setFromEuler(euler);
        // torso
        v.set(0, 0, -0.12).applyQuaternion(qq);
        mtx.compose(pos.set(s.x + v.x, baseY, s.z + v.z), qq, one); torsoIM.setMatrixAt(i, mtx);
        // head looks at action
        var dx = st.lookX - s.x, dz = 0 - s.z;
        var lookYaw = Math.atan2(dx, dz);
        var rel = lookYaw - s.yaw; while (rel > Math.PI) rel -= Math.PI * 2; while (rel < -Math.PI) rel += Math.PI * 2;
        rel = Math.max(-1.1, Math.min(1.1, rel));
        euler.set(-0.1, s.yaw + rel, 0); qh.setFromEuler(euler);
        mtx.compose(pos.set(s.x + v.x, baseY + 0.4, s.z + v.z), qh, one); headIM.setMatrixAt(i, mtx);
        mtx.compose(pos.set(s.x + v.x, baseY + 0.43, s.z + v.z), qh, n.bald ? zero : one); hairIM.setMatrixAt(i, mtx);
        // arms
        for (var a = 0; a < 2; a++) {
          var sd = a === 0 ? 1 : -1;
          var up = n.cheer > 0 ? 1 : 0;
          var wave = n.cheer > 0 ? Math.sin(t * 14 + n.phase + a) * 0.25 : 0;
          euler.set(up ? 0 : -1.1, s.yaw, sd * (up ? 2.7 + wave : 0.15));
          var qa = U.qa.setFromEuler(euler);
          var off = U.off.set(sd * 0.28, 0.18, -0.12).applyQuaternion(qq);
          var hang = U.hang.set(0, -0.2, 0).applyQuaternion(qa);
          mtx.compose(pos.set(s.x + off.x + hang.x, baseY + off.y + hang.y, s.z + off.z + hang.z), qa, one);
          armIM.setMatrixAt(i * 2 + a, mtx);
        }
      }
      torsoIM.instanceMatrix.needsUpdate = true; headIM.instanceMatrix.needsUpdate = true;
      hairIM.instanceMatrix.needsUpdate = true; armIM.instanceMatrix.needsUpdate = true;
    };

    st.cheer = function (power, x) {
      for (var i = 0; i < npcs.length; i++) {
        var n = npcs[i];
        var near = 1 - Math.min(1, Math.abs(n.seat.x - (x || 0)) / 22);
        if (Math.random() < power * (0.35 + 0.65 * near)) n.cheer = Math.max(n.cheer, 0.6 + Math.random() * 0.9 * power);
      }
    };

    var lastVote = '';
    st.setVotes = function (p1Name, p1Ratio, p2Name, p2Ratio, label) {
      var forV = Math.round(60 * Math.max(0, p1Ratio) + 60 * (1 - Math.max(0, p2Ratio)));
      forV = Math.max(0, Math.min(120, forV));
      var key = forV + p1Name + p2Name + (label || '');
      if (key === lastVote) return; lastVote = key;
      var against = 120 - forV;
      st.boards.forEach(function (b) {
        var ctx = b.tex.userData.ctx, w = 512, h = 256;
        ctx.fillStyle = '#05080f'; ctx.fillRect(0, 0, w, h);
        ctx.fillStyle = '#16233a'; ctx.fillRect(0, 0, w, 48);
        ctx.font = 'bold 28px Rubik, Arial, sans-serif'; ctx.textAlign = 'center';
        ctx.fillStyle = '#ffd166'; ctx.fillText(label || 'MOTION: WHO RUNS THE CHAMBER?', w / 2, 34);
        var leftName = b.side < 0 ? p1Name : p2Name, rightName = b.side < 0 ? p2Name : p1Name;
        var lv = b.side < 0 ? forV : against, rv = 120 - lv;
        ctx.font = 'bold 30px Rubik, Arial, sans-serif';
        ctx.fillStyle = '#7fb2ff'; ctx.fillText(leftName, w * 0.27, 96);
        ctx.fillStyle = '#ff8a8a'; ctx.fillText(rightName, w * 0.73, 96);
        ctx.font = 'bold 92px Rubik, Arial, sans-serif';
        ctx.fillStyle = '#ffffff'; ctx.fillText(String(lv), w * 0.27, 190); ctx.fillText(String(rv), w * 0.73, 190);
        ctx.fillStyle = '#2a3a55'; ctx.fillRect(30, 214, w - 60, 18);
        ctx.fillStyle = '#3d7bff'; ctx.fillRect(30, 214, (w - 60) * lv / 120, 18);
        ctx.fillStyle = '#ff5a5a'; ctx.fillRect(30 + (w - 60) * lv / 120, 214, (w - 60) * rv / 120, 18);
        ctx.fillStyle = '#ffd166'; ctx.fillRect(w / 2 - 2, 208, 4, 30);
        b.tex.needsUpdate = true;
      });
    };
    st.setVotes('—', 1, '—', 1, 'KNESSET COMBAT 26\'');


    /* ---------- chamber skins (themes) ---------- */
    st.themeLight = new T.PointLight(0xffffff, 0, 40, 1.2); st.themeLight.position.set(0, 8, -3); G.add(st.themeLight);
    function glowMat(c, o) { return new T.MeshBasicMaterial({ color: new T.Color(c), transparent: true, opacity: o == null ? 0.9 : o, blending: T.AdditiveBlending, depthWrite: false }); }
    function stringLights(g, list, y, z, x0, x1, n, sag, colors) {
      var geo = new T.SphereGeometry(0.07, 6, 5);
      for (var i = 0; i < n; i++) {
        var u = i / (n - 1), x = x0 + (x1 - x0) * u, yy = y - Math.sin(u * Math.PI) * sag;
        var b = new T.Mesh(geo, new T.MeshBasicMaterial({ color: new T.Color(colors[i % colors.length]) })); b.position.set(x, yy, z); g.add(b);
        list.push({ kind: 'twinkle', m: b, ph: Math.random() * 6 });
      }
      var wire = new T.Mesh(new T.CylinderGeometry(0.01, 0.01, Math.abs(x1 - x0), 4), new T.MeshBasicMaterial({ color: '#222' }));
      wire.rotation.z = Math.PI / 2; wire.position.set((x0 + x1) / 2, y - sag * 0.6, z); g.add(wire);
    }
    function hanukkiah(g, list, x, z, sc) {
      var h = new T.Group(); h.position.set(x, 0, z); h.scale.setScalar(sc); g.add(h);
      var gold = M.toon('#d4af37', '#5a4400');
      function add(geo, px, py, pz) { var m = new T.Mesh(geo, gold); m.position.set(px, py, pz); m.castShadow = true; h.add(m); return m; }
      add(new T.CylinderGeometry(0.5, 0.65, 0.25, 10), 0, 0.12, 0);
      add(new T.CylinderGeometry(0.08, 0.1, 2.0, 8), 0, 1.25, 0);
      add(new T.BoxGeometry(3.4, 0.12, 0.14), 0, 2.2, 0);
      for (var i = -4; i <= 4; i++) {
        var hx = i * 0.4, top = i === 0 ? 2.65 : 2.3;
        if (i !== 0) add(new T.CylinderGeometry(0.035, 0.035, Math.abs(hx) * 0.7, 6), hx * 0.7, 2.2 - Math.abs(hx) * 0.18, 0).rotation.z = hx > 0 ? 0.9 : -0.9;
        if (i === 0) add(new T.CylinderGeometry(0.05, 0.05, 0.45, 6), 0, 2.42, 0);
        add(new T.CylinderGeometry(0.09, 0.06, 0.1, 8), hx, top, 0);
        var candle = new T.Mesh(new T.CylinderGeometry(0.05, 0.05, 0.32, 8), M.toon(i % 2 ? '#7fb2ff' : '#ffffff')); candle.position.set(hx, top + 0.2, 0); h.add(candle);
        var flame = new T.Mesh(new T.ConeGeometry(0.06, 0.2, 8), glowMat('#ffcf6a')); flame.position.set(hx, top + 0.46, 0); h.add(flame);
        var halo = new T.Mesh(new T.SphereGeometry(0.14, 8, 6), glowMat('#ff9a3d', 0.35)); halo.position.copy(flame.position); h.add(halo);
        list.push({ kind: 'flame', m: flame, h: halo, ph: Math.random() * 6 });
      }
    }
    st.setTheme = function (id) {
      if (st.themeGroup) { G.remove(st.themeGroup); }
      var g = new T.Group(), list = [];
      st.themeGroup = g; st.theme = id; G.add(g); st.themeTick = null;
      st.themeLight.intensity = 0;
      if (id === 'hanukkah') {
        hanukkiah(g, list, -6.2, -9.6, 1); hanukkiah(g, list, 6.2, -9.6, 1); hanukkiah(g, list, 0, -13.6, 1.4);
        stringLights(g, list, 4.9, -14.0, -17, 17, 60, 0.5, ['#3d7bff', '#ffffff']);
        stringLights(g, list, 6.6, -14.0, -17, 17, 60, 0.4, ['#ffffff', '#7fb2ff']);
        [-5, -2, 2, 5].forEach(function (x, i) {
          var d = M.buildProp('dreidel', i % 2 ? '#3d7bff' : '#c9d2df'); d.scale.setScalar(1.6); d.position.set(x, 3.2 + (i % 2) * 0.6, -6.5); g.add(d);
          list.push({ kind: 'dreidel', m: d, y: d.position.y, ph: i * 1.7 });
        });
        st.themeLight.color.set('#7fa8ff'); st.themeLight.intensity = 1.1;
      } else if (id === 'independence') {
        [[-14.1, 4.6, 0.6], [-13.2, 6.2, 0.5], [-9, 5.4, 0.9]].forEach(function (row, ri) {
          var z = row[0], y = row[1], sag = row[2], n = 34;
          for (var i = 0; i < n; i++) {
            var u = i / (n - 1), x = -16 + 32 * u, yy = y - Math.sin(u * Math.PI) * sag;
            var fl = new T.Mesh(new T.PlaneGeometry(0.62, 0.42), (i + ri) % 3 === 2 ? new T.MeshLambertMaterial({ color: '#0038b8', side: T.DoubleSide }) : new T.MeshLambertMaterial({ map: st.flagTex, side: T.DoubleSide }));
            fl.position.set(x, yy - 0.22, z); g.add(fl); list.push({ kind: 'flutter', m: fl, ph: i * 0.6 });
          }
        });
        var sparks = [];
        for (var k = 0; k < 90; k++) { var sp = new T.Mesh(new T.SphereGeometry(0.09, 5, 4), glowMat('#ffffff')); sp.visible = false; g.add(sp); sparks.push({ m: sp, life: 0 }); }
        st.fireT = 0;
        list.push({ kind: 'fireworks', sparks: sparks });
        st.themeLight.color.set('#bcd4ff'); st.themeLight.intensity = 0.9;
      } else if (id === 'purim') {
        var cols = ['#ff4d6d', '#ffd166', '#4cd964', '#4d96ff', '#b46cff', '#ff9a3d'];
        var conf = new T.InstancedMesh(new T.PlaneGeometry(0.12, 0.07), new T.MeshBasicMaterial({ side: T.DoubleSide }), 320), c = new T.Color(), arr = [];
        for (var q = 0; q < 320; q++) { conf.setColorAt(q, c.set(cols[q % cols.length])); arr.push({ x: (Math.random() - 0.5) * 30, y: Math.random() * 11, z: -13 + Math.random() * 15, r: Math.random() * 6, v: 0.6 + Math.random() * 0.8 }); }
        g.add(conf); list.push({ kind: 'confetti', m: conf, arr: arr });
        var maskTex = function (col) {
          var cv = document.createElement('canvas'); cv.width = 256; cv.height = 160; var x2 = cv.getContext('2d');
          x2.fillStyle = col; x2.beginPath(); x2.moveTo(10, 60); x2.quadraticCurveTo(128, 0, 246, 60); x2.quadraticCurveTo(220, 150, 128, 110); x2.quadraticCurveTo(36, 150, 10, 60); x2.fill();
          x2.fillStyle = '#1b1230'; x2.beginPath(); x2.ellipse(80, 70, 30, 18, -0.2, 0, Math.PI * 2); x2.fill(); x2.beginPath(); x2.ellipse(176, 70, 30, 18, 0.2, 0, Math.PI * 2); x2.fill();
          x2.strokeStyle = '#ffd166'; x2.lineWidth = 6; x2.stroke();
          x2.fillStyle = '#ffd166'; for (var f = 0; f < 5; f++) { x2.beginPath(); x2.ellipse(40 + f * 44, 18, 8, 22, (f - 2) * 0.3, 0, Math.PI * 2); x2.fill(); }
          var tx = new T.CanvasTexture(cv); tx.encoding = T.sRGBEncoding; return tx;
        };
        [[-10.5, '#b46cff'], [10.5, '#ff4d6d'], [-3.6, '#4d96ff'], [3.6, '#4cd964']].forEach(function (mk, i) {
          var pl = new T.Mesh(new T.PlaneGeometry(i < 2 ? 4 : 2.2, i < 2 ? 2.5 : 1.4), new T.MeshBasicMaterial({ map: maskTex(mk[1]), transparent: true }));
          pl.position.set(mk[0], i < 2 ? 5.2 : 7.9, -14.1); g.add(pl);
        });
        for (var bl = 0; bl < 14; bl++) {
          var bc = cols[bl % cols.length], bg = new T.Group();
          var ball = new T.Mesh(new T.SphereGeometry(0.35, 12, 10), M.toon(bc)); ball.scale.set(1, 1.2, 1); bg.add(ball);
          var str = new T.Mesh(new T.CylinderGeometry(0.008, 0.008, 1.4, 3), new T.MeshBasicMaterial({ color: '#ddd' })); str.position.y = -1.1; bg.add(str);
          bg.position.set(-12 + bl * 1.8, 5 + Math.random() * 2.5, -11.5 + Math.random() * 3); g.add(bg);
          list.push({ kind: 'balloon', m: bg, y: bg.position.y, ph: Math.random() * 6 });
        }
        list.push({ kind: 'hue' });
        st.themeLight.intensity = 1.0;
      } else if (id === 'sukkot') {
        var frond = new T.InstancedMesh(new T.BoxGeometry(2.2, 0.05, 0.26), M.toon('#3f8a3a'), 160), mx = new T.Matrix4(), qq = new T.Quaternion(), e = new T.Euler(), pv = new T.Vector3(), one = new T.Vector3(1, 1, 1);
        for (var fi = 0; fi < 160; fi++) { e.set((Math.random() - 0.5) * 0.3, Math.random() * Math.PI, (Math.random() - 0.5) * 0.2); qq.setFromEuler(e); pv.set((Math.random() - 0.5) * 22, 9.2 + Math.random() * 0.6, -13 + Math.random() * 16); mx.compose(pv, qq, one); frond.setMatrixAt(fi, mx); }
        g.add(frond);
        for (var bi = 0; bi < 6; bi++) { var beam = new T.Mesh(new T.BoxGeometry(24, 0.2, 0.2), M.toon('#8a5a2b')); beam.position.set(0, 9.0, -12 + bi * 3); g.add(beam); }
        var fruitCols = [['#c0392b', 0.16, 1], ['#f2d43a', 0.13, 1.35], ['#6b2fa0', 0.07, 1]];
        for (var hs = 0; hs < 36; hs++) {
          var hx2 = -15 + (hs % 18) * 1.75, hz = hs < 18 ? -13.6 : -7.4, len = 1.5 + Math.random() * 1.6, fy = (hs < 18 ? 8.3 : 9.0) - len;
          var cord = new T.Mesh(new T.CylinderGeometry(0.01, 0.01, len, 3), new T.MeshBasicMaterial({ color: '#c9b48a' })); cord.position.set(hx2, fy + len / 2, hz); g.add(cord);
          var fc = fruitCols[hs % 3];
          if (hs % 3 === 2) { for (var gr = 0; gr < 7; gr++) { var gm = new T.Mesh(new T.SphereGeometry(fc[1], 6, 5), M.toon(fc[0])); gm.position.set(hx2 + (Math.random() - 0.5) * 0.18, fy - gr * 0.07, hz + (Math.random() - 0.5) * 0.18); g.add(gm); } }
          else { var fm = new T.Mesh(new T.SphereGeometry(fc[1], 10, 8), M.toon(fc[0])); fm.scale.set(1, fc[2], 1); fm.position.set(hx2, fy, hz); g.add(fm); list.push({ kind: 'sway', m: fm, x: hx2, ph: Math.random() * 6 }); }
        }
        stringLights(g, list, 4.6, -14.0, -17, 17, 40, 0.6, ['#ffcf6a', '#ff9a3d', '#fff3b0']);
        st.themeLight.color.set('#ffcf8a'); st.themeLight.intensity = 0.9;
      }
      if (!list.length) return;
      st.themeTick = function (dt, t) {
        list.forEach(function (it) {
          switch (it.kind) {
            case 'flame': var f = 0.8 + Math.sin(t * 17 + it.ph) * 0.12 + Math.random() * 0.12; it.m.scale.set(f, f * (1.1 + Math.sin(t * 11 + it.ph) * 0.15), f); it.h.material.opacity = 0.25 + Math.random() * 0.15; break;
            case 'twinkle': it.m.visible = Math.sin(t * 3 + it.ph) > -0.6; break;
            case 'dreidel': it.m.rotation.y += dt * 9; it.m.position.y = it.y + Math.sin(t * 1.6 + it.ph) * 0.25; it.m.rotation.z = Math.sin(t * 2 + it.ph) * 0.12; break;
            case 'flutter': it.m.rotation.y = Math.sin(t * 2.5 + it.ph) * 0.35; break;
            case 'balloon': it.m.position.y = it.y + Math.sin(t * 0.9 + it.ph) * 0.3; it.m.rotation.z = Math.sin(t * 0.7 + it.ph) * 0.1; break;
            case 'sway': it.m.position.x = it.x + Math.sin(t * 1.2 + it.ph) * 0.05; break;
            case 'hue': st.themeLight.color.setHSL((t * 0.08) % 1, 0.8, 0.6); break;
            case 'confetti':
              var mm = new T.Matrix4(), qd = new T.Quaternion(), ed = new T.Euler(), pp = new T.Vector3(), sc1 = new T.Vector3(1, 1, 1);
              it.arr.forEach(function (c, i) { c.y -= c.v * dt; c.r += dt * 3; if (c.y < 0) c.y = 11; ed.set(c.r, c.r * 0.7, 0); qd.setFromEuler(ed); pp.set(c.x + Math.sin(t + i) * 0.2, c.y, c.z); mm.compose(pp, qd, sc1); it.m.setMatrixAt(i, mm); });
              it.m.instanceMatrix.needsUpdate = true; break;
            case 'fireworks':
              st.fireT -= dt;
              if (st.fireT <= 0) {
                st.fireT = 0.9 + Math.random() * 1.2;
                var ox = (Math.random() - 0.5) * 22, oy = 8 + Math.random() * 3, oz = -13 + Math.random() * 3, col = ['#3d7bff', '#ffffff', '#ffd166', '#7fb2ff'][(Math.random() * 4) | 0], cnt = 0;
                it.sparks.forEach(function (sp) { if (sp.life <= 0 && cnt < 30) { cnt++; sp.life = 1.1; sp.m.visible = true; sp.m.material.color.set(col); sp.m.position.set(ox, oy, oz); var a = Math.random() * Math.PI * 2, b = Math.random() * Math.PI - Math.PI / 2, v = 2 + Math.random() * 1.5; sp.v = [Math.cos(a) * Math.cos(b) * v, Math.sin(b) * v, Math.sin(a) * Math.cos(b) * v * 0.4]; } });
              }
              it.sparks.forEach(function (sp) { if (sp.life <= 0) return; sp.life -= dt; if (sp.life <= 0) { sp.m.visible = false; return; } sp.m.position.x += sp.v[0] * dt; sp.m.position.y += sp.v[1] * dt; sp.m.position.z += sp.v[2] * dt; sp.v[1] -= 2.2 * dt; sp.m.material.opacity = sp.life; });
              break;
          }
        });
      };
    };
    st.setTheme('classic');
    st.setMode = function (mode) {
      st.mode = mode;
      if (mode === 'night') {
        st.hemi.intensity = 0.16; st.hemi.color.set('#8aa2ff'); st.key.intensity = 0.12; st.rim.intensity = 0.75; st.rim.color.set('#6f8cff');
        st.spot.intensity = 2.6; st.spot.angle = 0.36; st.spot.penumbra = 0.55; scene.background.set('#05070e'); scene.fog.color.set('#05070e'); st.lampMat.color.set('#7a6440');
      } else {
        st.hemi.intensity = 0.75; st.hemi.color.set('#fff4e0'); st.key.intensity = 1.05; st.rim.intensity = 0.45; st.rim.color.set('#9cc4ff');
        st.spot.intensity = 0; scene.background.set('#1c2433'); scene.fog.color.set('#1c2433'); st.lampMat.color.set('#fff3d6');
      }
    };
    st.followShadow = function (x) {
      st.key.position.set(x - 5, 14, 10); st.key.target.position.set(x, 0, 0);
      st.spot.position.set(x, 12, 5); st.spot.target.position.set(x, 0.5, 0);
    };
    return st;
  };
})();
