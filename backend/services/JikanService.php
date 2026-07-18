<?php
/**
 * Service Jikan (REST - MyAnimeList Scraper)
 * API REST publique (aucune auth requise)
 * Limite: ~60 req/min (gratuit)
 * Rate limit headers: RateLimit-Limit, RateLimit-Remaining, RateLimit-Reset (Unix timestamp)
 * Avantage: Données riches incluant studios, broadcast, openings/endings
 */
class JikanService extends ApiServiceInterface {
    
    private $baseUrl = 'https://api.jikan.moe/v4';
    private $requestDelay = 100;  // ms entre requêtes
    private $lastRequestTime = 0;
    
    public function searchAnime($query, $limit = 10) {
        if (empty($query) || strlen($query) < 2) {
            return $this->buildResponse(false, [], [], 'Requête trop courte');
        }
        
        $this->throttle();
        
        $url = $this->baseUrl . '/anime?' . http_build_query([
            'query' => $query,
            'order_by' => 'score',
            'sort' => 'desc',
            'limit' => min($limit, 25),
            'page' => 1
        ]);
        
        $response = $this->curlGet($url, []);
        
        if ($response['error'] ?? false) {
            return $this->buildResponse(false, [], [], "Jikan error: {$response['error']}");
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
            foreach ($data['data'] as $anime) {
                $animes[] = $this->normalizeAnimeData($anime);
            }
        }
        
        return $this->buildResponse(true, $animes, $rateLimit);
    }
    
    public function getAnimeDetails($id) {
        if (empty($id)) {
            return $this->buildResponse(false, [], [], 'ID vide');
        }
        
        $this->throttle();
        
        $url = $this->baseUrl . '/anime/' . intval($id);
        
        $response = $this->curlGet($url, []);
        
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
        
        return $this->buildResponse(true, [$this->normalizeAnimeData($data['data'])], $rateLimit);
    }
    
    private function throttle() {
        $elapsed = (microtime(true) * 1000) - $this->lastRequestTime;
        if ($elapsed < $this->requestDelay) {
            usleep(($this->requestDelay - $elapsed) * 1000);
        }
        $this->lastRequestTime = microtime(true) * 1000;
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
        
        $studios = [];
        if (isset($data['studios']) && is_array($data['studios'])) {
            $studios = array_column($data['studios'], 'name');
        }
        
        return [
            'id' => $data['mal_id'] ?? $data['id'] ?? null,
            'title' => $data['title'] ?? 'Unknown',
            'titleRomaji' => $data['title_japanese'] ?? $data['title_english'] ?? null,
            'titleEnglish' => $data['title_english'] ?? null,
            'episodes' => $data['episodes'] ?? null,
            'status' => $data['status'] ?? 'X',
            'rating' => isset($data['score']) && is_numeric($data['score']) && $data['score'] > 0 ? $data['score'] : 'X',
            'coverImage' => $data['images']['jpg']['large_image_url'] ?? $data['images']['jpg']['image_url'] ?? 'X',
            'description' => !empty($data['synopsis']) ? strip_tags($data['synopsis']) : 'X',
            'tags' => array_merge($genres, $studios),
            'sourceApi' => 'jikan',
            'sourceId' => $data['mal_id'] ?? $data['id'] ?? null,
            'airedFrom' => $data['aired']['from'] ?? null,
            'airedTo' => $data['aired']['to'] ?? null
        ];
    }
}
