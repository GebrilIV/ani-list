<?php
require __DIR__ . '/../vendor/autoload.php';

use Slim\Factory\AppFactory;

$app = AppFactory::create();

// Middleware pour gérer le chemin public et fallback SPA
$app->add(function ($request, $handler) {
    $uri = $request->getUri()->getPath();
    // Si c'est une ressource statique, laisser PHP la servir
    if (preg_match('#^/(assets|favicon|robots)\b#', $uri)) {
        return $handler->handle($request);
    }
    // Si c'est une route backend/API, laisser Slim gérer
    if (preg_match('#^/(anime|lists|test|backend)#', $uri)) {
        return $handler->handle($request);
    }
    // Si c'est la racine ou index.html, servir le HTML
    if ($uri === '/' || $uri === '/index.html') {
        $file = __DIR__ . '/index.html';
        $response = new \Slim\Psr7\Response();
        $response->getBody()->write(file_get_contents($file));
        return $response;
    }
    // Fallback SPA : servir index.html pour toute autre route
    $file = __DIR__ . '/index.html';
    $response = new \Slim\Psr7\Response();
    $response->getBody()->write(file_get_contents($file));
    return $response;
});

// Inclure les routes backend
$animeRoutes = require __DIR__ . '/../backend/routes/anime.php';
$animeRoutes($app);
$listsRoutes = require __DIR__ . '/../backend/routes/lists.php';
$listsRoutes($app);

// Route de base pour test
$app->get('/test', function ($request, $response) {
    $response->getBody()->write("Slim fonctionne 🎉");
    return $response;
});

$app->run();
