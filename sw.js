// Service worker do Controle de Gastos
// Cacheia o "shell" (cache-first) e nunca cacheia a API do Apps Script.
var CACHE = 'gastos-shell-v3';
var SHELL = [
  '/gastos/',
  '/gastos/index.html',
  '/gastos/manifest.json'
];

self.addEventListener('install', function(e){
  e.waitUntil(
    caches.open(CACHE)
      .then(function(c){ return c.addAll(SHELL); })
      .then(function(){ return self.skipWaiting(); })
  );
});

self.addEventListener('activate', function(e){
  e.waitUntil(
    caches.keys().then(function(keys){
      return Promise.all(keys.filter(function(k){ return k !== CACHE; })
        .map(function(k){ return caches.delete(k); }));
    }).then(function(){ return self.clients.claim(); })
  );
});

self.addEventListener('fetch', function(e){
  var url = new URL(e.request.url);
  if(e.request.method !== 'GET') return;
  // Dados da API: sempre rede (nunca servir do cache).
  if(url.hostname.indexOf('script.google.com') >= 0) return;
  // Só cuidamos de recursos do próprio site.
  if(url.origin !== self.location.origin) return;

  e.respondWith(
    caches.match(e.request).then(function(cached){
      var net = fetch(e.request).then(function(resp){
        if(resp && resp.status === 200){
          var clone = resp.clone();
          caches.open(CACHE).then(function(c){ c.put(e.request, clone); });
        }
        return resp;
      }).catch(function(){ return cached; });
      return cached || net;
    })
  );
});
