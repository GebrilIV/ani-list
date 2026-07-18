<?php
/**
 * Service MyAnimeList (REST + OAuth2)
 * API REST OAuth2
 * Authentification: X-MAL-CLIENT-ID header ou Bearer token
 * Limite: ~10-20 req/s (pas documentée officiellement)
 * Rate limit headers: RateLimit-Limit, RateLimit-Remaining, RateLimit-Reset (Unix timestamp)
 */
class MyAnimeListService extends ApiServiceInterface {
    
    private $clientId;
    private $accessToken;
    private $baseUrl = 'https://api.myanimelist.net/v2';
    
    public function __construct($clientId = '', $accessToken = '') {
        $this->clientId = $clientId ?? getenv('MAL_CLIENT_ID') ?? '';
        $this->accessToken = $accessToken ?? getenv('MAL_ACCESS_TOKEN') ?? '';
    }
    
    public function searchAnime($query, $limit = 10) {
        if (empty($query) || strlen($query) < 2) {
            return $this->buildResponse(false, [], [], 'Requête trop courte');
        }
        
        if (empty($this->clientId) && empty($this->accessToken)) {
            return $this->buildResponse(false, [], [], 'MyAnimeList: Pas de credentials configurés');
        }
        
        $url = $this->baseUrl . '/anime?' . http_build_query([
            'q' => $query,
            'limit' => min($limit, 100),
            'offset' => 0,
            'fields' => 'id,title,main_picture,synopsis,mean,rank,num_episodes,media_type,status,genres,start_date,end_date'
        ]);
        
        $headers = $this->buildAuthHeaders();
        $response = $this->curlGet($url, $headers);
        
        if ($response['error'] ?? false) {
            return $this->buildResponse(false, [], [], "MyAnimeList error: {$response['error']}");
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
            foreach ($data['data'] as $item) {
                if (isset($item['node'])) {
                    $animes[] = $this->normalizeAnimeData($item['node']);
                }
            }
        }
        
        return $this->buildResponse(true, $animes, $rateLimit);
    }
    
    public function getAnimeDetails($id) {
        if (empty($id)) {
            return $this->buildResponse(false, [], [], 'ID vide');
        }
        
        if (empty($this->clientId) && empty($this->accessToken)) {
            return $this->buildResponse(false, [], [], 'MyAnimeList: Pas de credentials');
        }
        
        $url = $this->baseUrl . '/anime/' . intval($id) . '?' . http_build_query([
            'fields' => 'id,title,main_picture,synopsis,mean,rank,num_episodes,media_type,status,genres,start_date,end_date,studios,rating,source,broadcast,rating,background'
        ]);
        
        $headers = $this->buildAuthHeaders();
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
        
        return $this->buildResponse(true, [$this->normalizeAnimeData($data)], $rateLimit);
    }
    
    private function buildAuthHeaders() {
        $headers = [
            'Accept' => 'application/json'
        ];
        
        if (!empty($this->accessToken)) {
            $headers['Authorization'] = 'Bearer ' . $this->accessToken;
        } elseif (!empty($this->clientId)) {
            $headers['X-MAL-CLIENT-ID'] = $this->clientId;
        }
        
        return $headers;
    }
    
    protected function parseRateLimit($headers) {
        $limit = null;
        $remaining = null;
        $resetAt = null;
        $retryAfter = null;
        
        if (isset($headers['RateLimit-Limit'])) {
            $limit = intval($headers['RateLimit-Limit']);
        }
        if (isset($headers['RateLimit-Remaining'])) {
            $remaining = intval($headers['RateLimit-Remaining']);
        }
        if (isset($headers['RateLimit-Reset'])) {
            $resetAt = intval($headers['RateLimit-Reset']);
        }
        if (isset($headers['Retry-After'])) {
            $retryAfter = intval($headers['Retry-After']);
        }
        
        return compact('limit', 'remaining', 'resetAt', 'retryAfter');
    }
    
    protected function normalizeAnimeData($data) {
        $genres = [];
        if (isset($data['genres']) && is_array($data['genres'])) {
            $genres = array_column($data['genres'], 'name');
        }
        
        return [
            'id' => $data['id'] ?? null,
            'title' => $data['title'] ?? 'Unknown',
            'titleRomaji' => $data['alternative_titles']['en'] ?? null,
            'titleEnglish' => $data['alternative_titles']['en'] ?? null,
            'episodes' => $data['num_episodes'] ?? null,
            'status' => $data['status'] ?? 'X',
            'rating' => isset($data['mean']) && is_numeric($data['mean']) ? $data['mean'] : 'X',
            'coverImage' => $data['main_picture']['large'] ?? $data['main_picture']['medium'] ?? 'X',
            'description' => !empty($data['synopsis']) ? strip_tags($data['synopsis']) : 'X',
            'tags' => $genres,
            'sourceApi' => 'myanimelist',
            'sourceId' => $data['id'] ?? null,
            'mediaType' => $data['media_type'] ?? null
        ];
    }
}
