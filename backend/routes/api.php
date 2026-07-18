<?php
/**
 * Routes pour la recherche multi-API
 */
return function ($app) {
    $app->get('/search', function ($request, $response) {
        $query = $request->getQueryParams()['q'] ?? '';
        $provider = $request->getQueryParams()['provider'] ?? 'anilist';
        $limit = intval($request->getQueryParams()['limit'] ?? 10);
        
        if (empty($query)) {
            $response->getBody()->write(json_encode([
                'success' => false,
                'data' => [],
                'error' => 'Requête vide'
            ]));
            return $response->withHeader('Content-Type', 'application/json');
        }
        
        require __DIR__ . '/../services/ApiServiceInterface.php';
        require __DIR__ . '/../services/AniListService.php';
        require __DIR__ . '/../services/JikanService.php';
        require __DIR__ . '/../services/MyAnimeListService.php';
        require __DIR__ . '/../services/KitsuService.php';
        require __DIR__ . '/../services/ApiManager.php';
        
        $manager = new ApiManager();
        $result = $manager->searchAnime($query, $provider, $limit);
        
        $response->getBody()->write(json_encode($result));
        return $response->withHeader('Content-Type', 'application/json');
    });
    
    $app->get('/anime/{id}', function ($request, $response, $args) {
        $id = $args['id'] ?? '';
        $provider = $request->getQueryParams()['provider'] ?? 'anilist';
        
        if (empty($id)) {
            $response->getBody()->write(json_encode([
                'success' => false,
                'data' => [],
                'error' => 'ID vide'
            ]));
            return $response->withHeader('Content-Type', 'application/json');
        }
        
        require __DIR__ . '/../services/ApiServiceInterface.php';
        require __DIR__ . '/../services/AniListService.php';
        require __DIR__ . '/../services/JikanService.php';
        require __DIR__ . '/../services/MyAnimeListService.php';
        require __DIR__ . '/../services/KitsuService.php';
        require __DIR__ . '/../services/ApiManager.php';
        
        $manager = new ApiManager();
        $result = $manager->getAnimeDetails($id, $provider);
        
        $response->getBody()->write(json_encode($result));
        return $response->withHeader('Content-Type', 'application/json');
    });
    
    $app->get('/providers', function ($request, $response) {
        require __DIR__ . '/../services/ApiServiceInterface.php';
        require __DIR__ . '/../services/AniListService.php';
        require __DIR__ . '/../services/JikanService.php';
        require __DIR__ . '/../services/MyAnimeListService.php';
        require __DIR__ . '/../services/KitsuService.php';
        require __DIR__ . '/../services/ApiManager.php';
        
        $manager = new ApiManager();
        $providers = $manager->getAvailableProviders();
        
        $response->getBody()->write(json_encode([
            'success' => true,
            'data' => $providers
        ]));
        return $response->withHeader('Content-Type', 'application/json');
    });
};
