<?php
// Définir les routes pour les listes
use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;

return function ($app) {
    $app->get('/lists', function (Request $request, Response $response) {
        $data = json_decode(file_get_contents(__DIR__ . '/../storage/data.json'), true);
        $response->getBody()->write(json_encode($data['lists'] ?? []));
        return $response->withHeader('Content-Type', 'application/json');
    });

    $app->post('/lists', function (Request $request, Response $response) {
        $params = json_decode($request->getBody()->getContents(), true);
        $file = __DIR__ . '/../storage/data.json';
        $data = json_decode(file_get_contents($file), true);
        if (!isset($data['lists'])) $data['lists'] = [];
        // Générer un nouvel id
        $newId = 1;
        $newOrder = 1;
        if (count($data['lists']) > 0) {
            $ids = array_column($data['lists'], 'id');
            $orders = array_column($data['lists'], 'order');
            $newId = !empty($ids) ? max($ids) + 1 : 1;
            $newOrder = !empty($orders) ? max($orders) + 1 : 1;
        }
        $newList = [
            'id' => $newId,
            'order' => $newOrder,
            'code1' => 0,
            'name' => $params['name'] ?? '',
            'color' => $params['color'] ?? '#000000',
            'description' => $params['description'] ?? '',
            'animes' => []
        ];
        $data['lists'][] = $newList;
        file_put_contents($file, json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
        $response->getBody()->write(json_encode($newList));
        return $response->withHeader('Content-Type', 'application/json');
    });
};
