<?php
require __DIR__ . '/../vendor/autoload.php';

use Slim\Factory\AppFactory;

$app = AppFactory::create();

$app->get('/test', function ($request, $response) {
    $response->getBody()->write("Slim fonctionne 🎉");
    return $response;
});

$app->run();
