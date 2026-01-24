<?php
// Définir les routes pour les animes
use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;

return function ($app) {
    $allowedProgressStatus = [
        'watching',
        'completed',
        'on_hold',
        'dropped',
        'plan_to_watch',
        'rewatching',
        'rewatch_on_hold',
        'rewatch_dropped',
        'rewatch_planned',
    ];

    $normalizeProgressStatus = function ($value) use ($allowedProgressStatus) {
        if (!is_string($value)) return null;
        $v = strtolower(trim($value));
        return in_array($v, $allowedProgressStatus, true) ? $v : null;
    };

    $app->get('/anime', function (Request $request, Response $response) {
        $data = json_decode(file_get_contents(__DIR__ . '/../storage/data.json'), true);
        $response->getBody()->write(json_encode($data['anime'] ?? []));
        return $response->withHeader('Content-Type', 'application/json');
    });

    $app->post('/anime', function (Request $request, Response $response) use ($normalizeProgressStatus) {
        $params = json_decode($request->getBody()->getContents(), true);
        $file = __DIR__ . '/../storage/data.json';
        $data = json_decode(file_get_contents($file), true);
        if (!isset($data['anime'])) $data['anime'] = [];
        if (!isset($data['lists'])) $data['lists'] = [];

        // Générer un nouvel id unique pour l'anime
        $newId = 1;
        if (count($data['anime']) > 0) {
            $ids = array_column($data['anime'], 'id');
            $newId = !empty($ids) ? max($ids) + 1 : 1;
        }

        // Récupérer les infos du frontend (issues de la loupe et du formulaire)
        $id_anilist = $params['id_anilist'] ?? null;
        $title = $params['title'] ?? '';
        $title_romaji = $params['title_romaji'] ?? '';
        $episodes = $params['episodes'] ?? 0;
        $status = $params['status'] ?? '';
        $star = $params['star'] ?? '';
        $tags = $params['tags'] ?? [];
        $pics = $params['pics'] ?? '';
        $description = $params['description'] ?? '';
        $season = (int)($params['season'] ?? 1);
        $episode = (int)($params['episode'] ?? 0);
        $minute = (int)($params['minute'] ?? 0);
        $listId = (int)($params['listId'] ?? 0);
        $other1 = isset($params['other1']) ? $params['other1'] : '';

        // Statut de visionnage (perso) : progress.status
        $progressStatus = $normalizeProgressStatus(
            $params['progress_status']
                ?? $params['progressStatus']
                ?? ($params['progress']['status'] ?? null)
        ) ?? 'plan_to_watch';

        // Préparer l'objet anime à ajouter
        // Correction: progress = { episode, minute }
        $anime = [
            'id' => $newId,
            'id_anilist' => $id_anilist,
            'title' => $title,
            'title_romaji' => $title_romaji,
            'episodes' => $episodes,
            'progress' => [
                'episode' => $episode,
                'minute' => $minute,
                'status' => $progressStatus,
            ],
            'status' => $status,
            'season' => $season,
            'tags' => $tags,
            'description' => $description,
            // Correction: décodage de l'URL pour éviter les \/
            'pics' => str_replace('\\/', '/', $pics),
            'star' => $star,
            'last_view' => time(),
            'other1' => $other1
        ];

        // Ajouter l'anime dans le tableau principal
        $data['anime'][] = $anime;

        // Ajouter l'id de l'anime dans la liste choisie (champ 'animes' sous la liste)
        foreach ($data['lists'] as &$list) {
            if (isset($list['id']) && $list['id'] == $listId) {
                if (!isset($list['animes']) || !is_array($list['animes'])) $list['animes'] = [];
                // Ajoute seulement si l'id n'est pas déjà présent
                $already = false;
                foreach ($list['animes'] as $a) {
                    if (isset($a['id']) && $a['id'] == $newId) { $already = true; break; }
                }
                if (!$already) $list['animes'][] = [ 'id' => $newId ];
            }
        }
        unset($list);

        file_put_contents($file, json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
        $response->getBody()->write(json_encode($anime));
        return $response->withHeader('Content-Type', 'application/json');
    });

    // PATCH /anime/{id} : met à jour la progression d'un anime
    $app->patch('/anime/{id}', function (Request $request, Response $response, $args) use ($normalizeProgressStatus) {
        $id = (int)$args['id'];
        $params = json_decode($request->getBody()->getContents(), true);
        $file = __DIR__ . '/../storage/data.json';
        $data = json_decode(file_get_contents($file), true);
        if (!isset($data['anime'])) $data['anime'] = [];
        $found = false;
        foreach ($data['anime'] as &$anime) {
            if (isset($anime['id']) && $anime['id'] == $id) {
                // Accepte progress_status en alias de progress.status
                if (isset($params['progress_status']) && (!isset($params['progress']) || !is_array($params['progress']))) {
                    $params['progress'] = [];
                }
                if (isset($params['progress_status']) && !isset($params['progress']['status'])) {
                    $params['progress']['status'] = $params['progress_status'];
                }

                // Met à jour la progression si fournie
                if (isset($params['progress']) && is_array($params['progress'])) {
                    $incomingProgress = $params['progress'];
                    if (array_key_exists('status', $incomingProgress)) {
                        $normalized = $normalizeProgressStatus($incomingProgress['status']);
                        if ($normalized === null) {
                            unset($incomingProgress['status']);
                        } else {
                            $incomingProgress['status'] = $normalized;
                        }
                    }
                    $anime['progress'] = array_merge($anime['progress'] ?? ['episode'=>0,'minute'=>0], $incomingProgress);
                }

                // Edition champs principaux (optionnel)
                if (isset($params['title'])) $anime['title'] = $params['title'];
                if (isset($params['title_romaji'])) $anime['title_romaji'] = $params['title_romaji'];
                if (isset($params['description'])) $anime['description'] = $params['description'];

                // Met à jour d'autres champs si besoin (optionnel)
                if (isset($params['star'])) $anime['star'] = $params['star'];
                if (isset($params['status'])) $anime['status'] = $params['status'];
                if (isset($params['other1'])) $anime['other1'] = $params['other1'];
                if (isset($params['last_view'])) {
                    $anime['last_view'] = $params['last_view'];
                } else {
                    $anime['last_view'] = time();
                }
                $found = true;
                break;
            }
        }
        unset($anime);
        if ($found) {
            file_put_contents($file, json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
            $response->getBody()->write(json_encode(['success'=>true]));
        } else {
            $response = $response->withStatus(404);
            $response->getBody()->write(json_encode(['error'=>'Anime not found']));
        }
        return $response->withHeader('Content-Type', 'application/json');
    });
};
