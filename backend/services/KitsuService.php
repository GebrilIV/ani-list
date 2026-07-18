<?php
/**
 * Service Kitsu (JSON:API format)
 * API REST avec format JSON:API
 * Authentification: Optionnelle (OAuth2)
 * Limite: Non documentée (gratuit public)
 * Headers spéciaux: Accept: application/vnd.api+json, Content-Type: application/vnd.api+json
 */
class KitsuService extends ApiServiceInterface {
    
    private $baseUrl = 'https://kitsu.io/api/edge';
    private $accessToken = '';
    
    public function __construct($accessToken = '') {
        $this->accessToken = $accessToken ?? getenv('KITSU_ACCESS_TOKEN') ?? '';
    }
    
    public function searchAnime($query, $limit = 10) {
        if (empty($query) || strlen($query) < 2) {
            return $this->buildResponse(false, [], [], 'Requête trop courte');
        }
        
        $url = $this->baseUrl . '/anime?' . http_build_query([
            'filter[text]' => $query,
            'page[limit]' => min($limit, 20),
            'page[offset]' => 0,
            'sort' => '-popularityRank'
        ]);
        
        $headers = [
            'Accept' => 'application/vnd.api+json',
            'Content-Type' => 'application/vnd.api+json'
        ];
        
        if (!empty($this->accessToken)) {
            $headers['Authorization'] = 'Bearer ' . $this->accessToken;
        }
        
        $response = $this->curlGet($url, $headers);
        
        if ($response['error'] ?? false) {
            return $this->buildResponse(false, [], [], "Kitsu error: {$response['error']}");
        }
        
        if ($response['status'] !== 200) {
            return $this->buildResponse(false, [], [], "HTTP {$response['status']}");
        }
        
        $parsedHeaders = $this->parseHeaders($response['headers']);
        $rateLimit = $this->parseRateLimit($parsedHeaders);
        
        $data = json_decode($response['body'], true);
        
        if (json_last_error() !== JSON_ERROR_NONE) {
            return $this->buildResponse(false, [], $rateLimit, 'JSON decode error');
        }
        
        $animes = [];
        if (isset($data['data']) && is_array($data['data'])) {
            // Construire map des ressources incluses (genres, etc)
            $included = [];
            if (isset($data['included']) && is_array($data['included'])) {
                foreach ($data['included'] as $resource) {
                    $key = ($resource['type'] ?? '') . ':' . ($resource['id'] ?? '');
                    $included[$key] = $resource;
                }
            }
            
            foreach ($data['data'] as $anime) {
                $animes[] = $this->normalizeAnimeData($anime, $included);
            }
        }
        
        return $this->buildResponse(true, $animes, $rateLimit);
    }
    
    public function getAnimeDetails($id) {
        if (empty($id)) {
            return $this->buildResponse(false, [], [], 'ID vide');
        }
        
        $url = $this->baseUrl . '/anime/' . urlencode($id) . '?include=categories';
        
        $headers = [
            'Accept' => 'application/vnd.api+json',
            'Content-Type' => 'application/vnd.api+json'
        ];
        
        if (!empty($this->accessToken)) {
            $headers['Authorization'] = 'Bearer ' . $this->accessToken;
        }
        
        $response = $this->curlGet($url, $headers);
        
        if ($response['status'] !== 200) {
            return $this->buildResponse(false, [], [], "HTTP {$response['status']}");
        }
        
        $parsedHeaders = $this->parseHeaders($response['headers']);
        $rateLimit = $this->parseRateLimit($parsedHeaders);
        
        $data = json_decode($response['body'], true);
        
        if (json_last_error() !== JSON_ERROR_NONE) {
            return $this->buildResponse(false, [], $rateLimit, 'JSON decode error');
        }
        
        if (!isset($data['data'])) {
            return $this->buildResponse(false, [], $rateLimit, 'Anime non trouvé');
        }
        
        $included = [];
        if (isset($data['included']) && is_array($data['included'])) {
            foreach ($data['included'] as $resource) {
                $key = ($resource['type'] ?? '') . ':' . ($resource['id'] ?? '');
                $included[$key] = $resource;
            }
        }
        
        return $this->buildResponse(true, [$this->normalizeAnimeData($data['data'], $included)], $rateLimit);
    }
    
    protected function parseRateLimit($headers) {
        // Kitsu ne retourne pas de rate limit headers habituellement
        return [
            'limit' => null,
            'remaining' => null,
            'resetAt' => null,
            'retryAfter' => null
        ];
    }
    
    protected function normalizeAnimeData($data, $included = []) {
        $attributes = $data['attributes'] ?? [];
        
        // Récupère les genres depuis relationships/included
        $genres = [];
        if (isset($data['relationships']['categories']['data']) && is_array($data['relationships']['categories']['data'])) {
            foreach ($data['relationships']['categories']['data'] as $cat) {
                $key = 'categories:' . $cat['id'];
                if (isset($included[$key]['attributes']['title'])) {
                    $genres[] = $included[$key]['attributes']['title'];
                }
            }
        }
        
        $coverUrl = 'X';
        if (!empty($attributes['posterImage']['large'])) {
            $imageUrl = $attributes['posterImage']['large'];
            // Ajouter le domaine si pas de protocole
            $coverUrl = (strpos($imageUrl, 'http') === 0) ? $imageUrl : 'https://media.kitsu.io' . $imageUrl;
        } elseif (!empty($attributes['posterImage']['medium'])) {
            $imageUrl = $attributes['posterImage']['medium'];
            $coverUrl = (strpos($imageUrl, 'http') === 0) ? $imageUrl : 'https://media.kitsu.io' . $imageUrl;
        }
        
        $rating = 'X';
        if (isset($attributes['averageRating']) && is_numeric($attributes['averageRating'])) {
            $rating = (float)$attributes['averageRating'] / 10;
        }
        
        return [
            'id' => $data['id'] ?? null,
            'title' => $attributes['canonicalTitle'] ?? $attributes['titles']['en_jp'] ?? $attributes['titles']['en'] ?? 'Unknown',
            'titleRomaji' => $attributes['titles']['ja_jp'] ?? null,
            'titleEnglish' => $attributes['titles']['en'] ?? null,
            'episodes' => $attributes['episodeCount'] ?? null,
            'status' => strtoupper($attributes['status'] ?? 'X'),
            'rating' => $rating,
            'coverImage' => $coverUrl,
            'description' => !empty($attributes['synopsis']) ? strip_tags($attributes['synopsis']) : 'X',
            'tags' => $genres,
            'sourceApi' => 'kitsu',
            'sourceId' => $data['id'] ?? null,
            'year' => $attributes['seasonYear'] ?? null,
            'subtype' => $attributes['subtype'] ?? null
        ];
    }
}
