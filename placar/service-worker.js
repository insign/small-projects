// Define um nome e versão para o cache. Mude a versão para forçar a atualização do cache.
const CACHE_NAME = 'placar-interativo-v2'; // Versão incrementada para forçar atualização do cache

// Lista de todos os arquivos que a aplicação precisa para funcionar offline.
const URLS_TO_CACHE = [
  './', // Representa o arquivo HTML principal (index.html)
  'style.css', // Novo arquivo de estilo
  'scripts.js', // Novo arquivo de script
  'vue3518.js',
  'favicon.png',
  'L0xuDF4xlVMF-BfR8bXMIhJHg45mwgGEFl0_Of2_SeW4Ep0.woff2',
  'L0xuDF4xlVMF-BfR8bXMIhJHg45mwgGEFl0_Of2_QOW4Ep0.woff2',
  'L0xuDF4xlVMF-BfR8bXMIhJHg45mwgGEFl0_Of2_R-W4Ep0.woff2',
  'L0xuDF4xlVMF-BfR8bXMIhJHg45mwgGEFl0_Of2_S-W4Ep0.woff2',
  'L0xuDF4xlVMF-BfR8bXMIhJHg45mwgGEFl0_Of2_SuW4Ep0.woff2',
  'L0xuDF4xlVMF-BfR8bXMIhJHg45mwgGEFl0_Of2_ROW4.woff2'
];

// Evento 'install': é disparado quando o Service Worker é instalado pela primeira vez.
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
          .then(cache => {
            console.log('Cache aberto. Armazenando arquivos para uso offline.');
            return cache.addAll(URLS_TO_CACHE);
          })
  );
});

// Evento 'activate': Limpa caches antigos.
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('Limpando cache antigo:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Evento 'fetch': serve os arquivos do cache.
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
          .then(response => {
            return response || fetch(event.request);
          })
  );
});