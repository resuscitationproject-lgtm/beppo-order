(function () {
  "use strict";
  const memory = {};
  function getArea(kind) { try { return window[kind]; } catch (_) { return null; } }
  function read(key, fallback, kind) { try { const raw = getArea(kind)?.getItem(key); return raw == null ? (key in memory ? memory[key] : fallback) : JSON.parse(raw); } catch (_) { return key in memory ? memory[key] : fallback; } }
  function write(key, value, kind) { memory[key] = value; try { getArea(kind)?.setItem(key, JSON.stringify(value)); return true; } catch (_) { return false; } }
  function remove(key, kind) { delete memory[key]; try { getArea(kind)?.removeItem(key); } catch (_) {} }
  window.BeppoStorage = { get: (k, f) => read(k, f, "sessionStorage"), set: (k, v) => write(k, v, "sessionStorage"), remove: k => remove(k, "sessionStorage"), getLocal: (k, f) => read(k, f, "localStorage"), setLocal: (k, v) => write(k, v, "localStorage"), removeLocal: k => remove(k, "localStorage") };
})();
