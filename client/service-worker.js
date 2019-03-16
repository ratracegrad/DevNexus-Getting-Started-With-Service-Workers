"use strict";

let version = 'reviews-v2';
let dbVersion = 'mws';
let offlineFundamentals = [
    '/',
    'index.html',
    'restaurant.html',
    'css/styles.css',
    'js/main.js',
    'js/dbhelper.js',
    'js/restaurant_info.js',
    'img/icon.png',
    'dist/1-200px.jpg',
    'dist/1-500px.jpg',
    'dist/2-200px.jpg',
    'dist/2-500px.jpg',
    'dist/3-200px.jpg',
    'dist/3-500px.jpg',
    'dist/4-200px.jpg',
    'dist/4-500px.jpg',
    'dist/5-200px.jpg',
    'dist/5-500px.jpg',
    'dist/6-200px.jpg',
    'dist/6-500px.jpg',
    'dist/7-200px.jpg',
    'dist/7-500px.jpg',
    'dist/8-200px.jpg',
    'dist/8-500px.jpg',
    'dist/9-200px.jpg',
    'dist/9-500px.jpg',
    'dist/10-200px.jpg',
    'dist/10-500px.jpg',
    'https://unpkg.com/leaflet@1.3.1/dist/leaflet.css',
    'https://unpkg.com/leaflet@1.3.1/dist/leaflet.js',
];
const request = indexedDB.open(dbVersion, 1);

request.onupgradeneeded = (event) => {
    console.log('onupgradeneeded');
    const db = event.target.result;

    const restaurantStore = db.createObjectStore('restaurants', {keyPath: 'id'});
    restaurantStore.createIndex('RestaurantIndex', 'id');

    const reviewStore = db.createObjectStore('reviews', {autoIncrement: true});
    reviewStore.createIndex('ReviewIndex', 'reviewId');
};

request.onsuccess = function(event) {
    console.log('onsuccess');
    const db = event.target.result;

    // get all restaurants and add them into the database
    fetch('http://localhost:1337/restaurants')
        .then(response => {
            return response.json();
        })
        .then(restaurants => {
            restaurants.forEach(store => {
                const transaction = db.transaction(['restaurants', 'reviews'], 'readwrite');
                const restaurantStore = transaction.objectStore('restaurants');
                restaurantStore.add(store);
                transaction.oncomplete= () => {
                    db.close();
                };
            });
        })
        .catch(error => {
            console.log('error', error);
        });

};

request.onerror = function(event) {
    console.log('onerror', event.target);
    console.log('error opening database ' + event.target.errorCode);
};

self.addEventListener("install", event => {
    console.log('WORKER: install event in progress.');
    event.waitUntil(
        caches
            .open(version)
            .then(cache => {
                return cache.addAll(offlineFundamentals);
            })
            .then(() => {
                console.log('WORKER: install completed');
            })
    );
});

self.addEventListener("fetch", event => {
    console.log('WORKER: fetch event in progress.');
    if (event.request.method !== 'GET') {
        console.log('WORKER: fetch event ignored.', event.request.method, event.request.url);
        return;
    }
    event.respondWith(
        caches
            .match(event.request)
            .then(cached => {
                let networked = fetch(event.request)
                    .then(fetchedFromNetwork, unableToResolve)
                    .catch(unableToResolve);
                console.log('WORKER: fetch event', cached ? '(cached)' : '(network)', event.request.url);
                return cached || networked;

                function fetchedFromNetwork(response) {
                    let cacheCopy = response.clone();

                    console.log('WORKER: fetch response from network.', event.request.url);

                    caches
                        .open(version + 'pages')
                        .then(function add(cache) {
                            return cache.put(event.request, cacheCopy);
                        })
                        .then(() => {
                            // console.log('WORKER: fetch response stored in cache.', event.request.url);
                        });
                    return response;
                }

                function unableToResolve () {
                    // console.log('WORKER: fetch request failed in both cache and network.');
                    return new Response('<h1>Service Unavailable</h1>', {
                        status: 503,
                        statusText: 'Service Unavailable',
                        headers: new Headers({
                            'Content-Type': 'text/html',
                        }),
                    });
                }
            })
    );
});

self.addEventListener("activate", event => {
    console.log('WORKER: activate event in progress.');
    event.waitUntil(
        caches
            .keys()
            .then(keys => {
                return Promise.all(
                    keys
                        .filter(key => {
                            return !key.startsWith(version);
                        })
                        .map(key => {
                            return caches.delete(key);
                        })
                );
            })
            .then(() => {
                console.log('WORKER: activate completed.');
            })
    );
});

self.addEventListener("message", event => {
    console.log('message', event.data);
    if (event.data.action === 'skipWaiting') {
        self.skipWaiting();
    }
});

