/* Knesset Combat 26' — particle effects: hit sparks, flying ballot papers, shock rings. */
(function () {
  var T = THREE;
  KC.FX = function (scene) {
    this.scene = scene;
    this.sparks = []; this.papers = []; this.rings = [];
    var sg = new T.OctahedronGeometry(0.07, 0);
    for (var i = 0; i < 90; i++) {
      var m = new T.Mesh(sg, new T.MeshBasicMaterial({ color: '#ffd166', transparent: true, blending: T.AdditiveBlending, depthWrite: false }));
      m.visible = false; scene.add(m); this.sparks.push({ m: m, life: 0, vx: 0, vy: 0, vz: 0, max: 1 });
    }
    var pg = new T.PlaneGeometry(0.17, 0.23);
    var pm = new T.MeshLambertMaterial({ color: '#fbfaf3', side: T.DoubleSide });
    var pm2 = new T.MeshLambertMaterial({ color: '#dfe9ff', side: T.DoubleSide });
    for (var j = 0; j < 60; j++) {
      var p = new T.Mesh(pg, j % 3 === 0 ? pm2 : pm); p.visible = false; p.castShadow = true; scene.add(p);
      this.papers.push({ m: p, life: 0, vx: 0, vy: 0, vz: 0, rx: 0, rz: 0 });
    }
    var rg = new T.TorusGeometry(0.5, 0.04, 6, 28);
    for (var k = 0; k < 10; k++) {
      var r = new T.Mesh(rg, new T.MeshBasicMaterial({ color: '#ffffff', transparent: true, blending: T.AdditiveBlending, depthWrite: false }));
      r.visible = false; scene.add(r); this.rings.push({ m: r, life: 0, max: 1, grow: 1 });
    }
  };
  var P = KC.FX.prototype;
  function take(arr) { for (var i = 0; i < arr.length; i++) if (arr[i].life <= 0) return arr[i]; return arr[(Math.random() * arr.length) | 0]; }

  P.hit = function (x, y, color, count, dir) {
    for (var i = 0; i < count; i++) {
      var s = take(this.sparks);
      s.m.visible = true; s.m.position.set(x, y, 0.3);
      s.m.material.color.set(color || '#ffd166');
      var a = Math.random() * Math.PI * 2, sp = 2 + Math.random() * 5;
      s.vx = Math.cos(a) * sp + (dir || 0) * 2; s.vy = Math.sin(a) * sp; s.vz = (Math.random() - 0.3) * 3;
      s.life = s.max = 0.18 + Math.random() * 0.2;
      s.m.scale.setScalar(0.8 + Math.random() * 1.4);
    }
  };
  P.papers_ = function (x, y, count, dir) {
    for (var i = 0; i < count; i++) {
      var p = take(this.papers);
      p.m.visible = true; p.m.position.set(x + (Math.random() - 0.5) * 0.3, y, (Math.random() - 0.5) * 0.4);
      p.vx = (dir || 0) * (0.8 + Math.random() * 2) + (Math.random() - 0.5) * 2; p.vy = 1.5 + Math.random() * 3; p.vz = (Math.random() - 0.3) * 2;
      p.rx = (Math.random() - 0.5) * 12; p.rz = (Math.random() - 0.5) * 12;
      p.life = 2.5 + Math.random();
    }
  };
  P.ring = function (x, y, color, size, vertical) {
    var r = take(this.rings);
    r.m.visible = true; r.m.position.set(x, y, 0.1);
    r.m.material.color.set(color || '#ffffff');
    r.m.rotation.set(vertical ? 0 : Math.PI / 2, vertical ? Math.PI / 2 : 0, 0);
    r.life = r.max = 0.35; r.grow = size || 1; r.m.scale.setScalar(0.2);
  };
  P.update = function (dt) {
    var g = 9;
    this.sparks.forEach(function (s) {
      if (s.life <= 0) return;
      s.life -= dt; if (s.life <= 0) { s.m.visible = false; return; }
      s.m.position.x += s.vx * dt; s.m.position.y += s.vy * dt; s.m.position.z += s.vz * dt;
      s.vy -= g * dt * 0.6;
      s.m.material.opacity = s.life / s.max;
      s.m.rotation.x += dt * 10; s.m.rotation.y += dt * 8;
    });
    this.papers.forEach(function (p) {
      if (p.life <= 0) return;
      p.life -= dt; if (p.life <= 0) { p.m.visible = false; return; }
      var pos = p.m.position;
      if (pos.y > 0.02) {
        pos.x += p.vx * dt; pos.y += p.vy * dt; pos.z += p.vz * dt;
        p.vy = Math.max(p.vy - 4.5 * dt, -0.9);
        p.vx *= 0.985; p.vz *= 0.985;
        p.m.rotation.x += p.rx * dt; p.m.rotation.z += p.rz * dt;
        pos.x += Math.sin(p.life * 6) * 0.004;
      } else { pos.y = 0.02; p.m.rotation.x = -Math.PI / 2; }
    });
    this.rings.forEach(function (r) {
      if (r.life <= 0) return;
      r.life -= dt; if (r.life <= 0) { r.m.visible = false; return; }
      var k = 1 - r.life / r.max;
      r.m.scale.setScalar(0.2 + k * 2.2 * r.grow);
      r.m.material.opacity = 1 - k;
    });
  };
  P.clear = function () {
    this.sparks.concat(this.papers).concat(this.rings).forEach(function (s) { s.life = 0; s.m.visible = false; });
  };
})();
