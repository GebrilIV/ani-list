<?php
// Définir les routes pour les listes
use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;

return function ($app) {
    $saveJsonFile = function (string $file, array $data): void {
        $tmp = $file . '.tmp';
        file_put_contents($tmp, json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE), LOCK_EX);
        rename($tmp, $file);
    };

    $removeAnimeIdFromList = function (array $list, int $animeId): array {
        // Nouveau format: list['animes'] = [{id: 1}, {id: 2}, ...]
        if (isset($list['animes']) && is_array($list['animes'])) {
            $list['animes'] = array_values(array_filter($list['animes'], function ($ref) use ($animeId) {
                $id = is_array($ref) ? (int)($ref['id'] ?? 0) : (int)$ref;
                return $id !== $animeId;
            }));
        }

        // Ancien format: list['animeIds'] = [1,2,3]
        if (isset($list['animeIds']) && is_array($list['animeIds'])) {
            $list['animeIds'] = array_values(array_filter($list['animeIds'], function ($id) use ($animeId) {
                return (int)$id !== $animeId;
            }));
        }

        return $list;
    };

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

    // DELETE /lists/{id} : supprime une liste
    // Option: ?deleteAnimes=1 => supprime aussi les animes présents dans cette liste
    $app->delete('/lists/{id}', function (Request $request, Response $response, $args) use ($saveJsonFile, $removeAnimeIdFromList) {
        $id = (int)$args['id'];
        $file = __DIR__ . '/../storage/data.json';
        $data = json_decode(file_get_contents($file), true);

        $query = $request->getQueryParams();
        $deleteAnimes = isset($query['deleteAnimes']) && in_array((string)$query['deleteAnimes'], ['1', 'true', 'yes', 'on'], true);

        if (!is_array($data)) $data = [];
        if (!isset($data['lists']) || !is_array($data['lists'])) $data['lists'] = [];

        // Retrouver la liste (pour récupérer ses animes si deleteAnimes=1)
        $targetList = null;
        foreach ($data['lists'] as $l) {
            if ((int)($l['id'] ?? 0) === $id) {
                $targetList = $l;
                break;
            }
        }
        if ($targetList === null) {
            $response = $response->withStatus(404);
            $response->getBody()->write(json_encode(['error' => 'List not found']));
            return $response->withHeader('Content-Type', 'application/json');
        }

        // Si demandé, supprimer aussi les animes contenus dans la liste
        $deletedAnimeIds = [];
        if ($deleteAnimes) {
            $ids = [];
            if (isset($targetList['animes']) && is_array($targetList['animes'])) {
                foreach ($targetList['animes'] as $ref) {
                    $rid = is_array($ref) ? (int)($ref['id'] ?? 0) : (int)$ref;
                    if ($rid > 0) $ids[] = $rid;
                }
            } elseif (isset($targetList['animeIds']) && is_array($targetList['animeIds'])) {
                foreach ($targetList['animeIds'] as $rid) {
                    $rid = (int)$rid;
                    if ($rid > 0) $ids[] = $rid;
                }
            }
            $ids = array_values(array_unique($ids));

            if (!isset($data['anime']) || !is_array($data['anime'])) $data['anime'] = [];
            if (count($ids) > 0) {
                $beforeAnime = count($data['anime']);
                $data['anime'] = array_values(array_filter($data['anime'], function ($a) use ($ids) {
                    return !in_array((int)($a['id'] ?? 0), $ids, true);
                }));
                if (count($data['anime']) !== $beforeAnime) {
                    $deletedAnimeIds = $ids;
                }

                // Nettoyer les références dans toutes les listes restantes
                $data['lists'] = array_map(function ($l) use ($ids, $removeAnimeIdFromList) {
                    foreach ($ids as $aid) {
                        $l = $removeAnimeIdFromList($l, (int)$aid);
                    }
                    return $l;
                }, $data['lists']);
            }
        }

        // Supprimer la liste elle-même
        $data['lists'] = array_values(array_filter($data['lists'], function ($l) use ($id) {
            return (int)($l['id'] ?? 0) !== $id;
        }));

        $saveJsonFile($file, $data);
        $response->getBody()->write(json_encode([
            'success' => true,
            'deletedAnimeIds' => $deletedAnimeIds,
        ]));
        return $response->withHeader('Content-Type', 'application/json');
    });
};
