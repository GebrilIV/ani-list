<?php
/**
 * Service AniList (GraphQL)
 * API GraphQL pour rechercher et récupérer les animes
 * Limite: 30 requêtes par minute
 * Rate limit headers: X-RateLimit-Limit, X-RateLimit-Remaining, X-RateLimit-Reset (timestamp)
 */
class AniListService extends ApiServiceInterface {
    
    private $graphqlEndpoint = 'https://graphql.anilist.co';
    private $rateLimitReset = null;
    
    public function searchAnime($query, $limit = 10) {
        if (empty($query) || strlen($query) < 2) {
            return $this->buildResponse(false, [], [], 'Requête trop courte (min 2 caractères)');
        }
        
        $queryGraphQL = <<<'GRAPHQL'
query($search: String, $limit: Int) {
  Page(perPage: $limit) {
    media(search: $search, type: ANIME) {
      id
      title { romaji english userPreferred }
      coverImage { large color }
      episodes
      status
      format
      description
      genres
      tags { name }
      averageScore
      meanScore
      popularity
    }
  }
}
GRAPHQL;
        
        $postData = [
            'query' => $queryGraphQL,
            'variables' => [
                'search' => $query,
                'limit' => min($limit, 25)  // AniList limite à ~25 par requête
            ]
        ];
        
        $headers = [
            'Content-Type' => 'application/json',
            'Accept' => 'application/json'
        ];
        
        $response = $this->makeRequest(
            $this->graphqlEndpoint,
            array_merge($headers, ['X-POST-BODY' => json_encode($postData)])
        );
        
        // Effectuer POST avec cURL directement
        $ch = curl_init();
        curl_setopt_array($ch, [
            CURLOPT_URL => $this->graphqlEndpoint,
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_TIMEOUT => 10,
            CURLOPT_POST => true,
            CURLOPT_POSTFIELDS => json_encode($postData),
            CURLOPT_HTTPHEADER => [
                'Content-Type: application/json',
                'Accept: application/json'
            ],
            CURLOPT_HEADER => true
        ]);
        
        $response = curl_exec($ch);
        $status = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $headerSize = curl_getinfo($ch, CURLINFO_HEADER_SIZE);
        $error = curl_error($ch);
        curl_close($ch);
        
        if ($error) {
            return $this->buildResponse(false, [], [], "Erreur cURL: $error");
        }
        
        $headerText = substr($response, 0, $headerSize);
        $body = substr($response, $headerSize);
        $rawHeaders = explode("\r\n", $headerText);
        $parsedHeaders = $this->parseHeaders($rawHeaders);
        
        $rateLimit = $this->parseRateLimit($parsedHeaders);
        
        if ($status !== 200) {
            return $this->buildResponse(false, [], $rateLimit, "AniList error (HTTP $status)");
        }
        
        $data = json_decode($body, true);
        
        if (json_last_error() !== JSON_ERROR_NONE) {
            return $this->buildResponse(false, [], $rateLimit, 'JSON decode error');
        }
        
        if (isset($data['errors'])) {
            $errorMsg = $data['errors'][0]['message'] ?? 'Unknown GraphQL error';
            return $this->buildResponse(false, [], $rateLimit, $errorMsg);
        }
        
        $animes = [];
        if (isset($data['data']['Page']['media']) && is_array($data['data']['Page']['media'])) {
            foreach ($data['data']['Page']['media'] as $anime) {
                $animes[] = $this->normalizeAnimeData($anime);
            }
        }
        
        return $this->buildResponse(true, $animes, $rateLimit);
    }
    
    public function getAnimeDetails($id) {
        if (empty($id)) {
            return $this->buildResponse(false, [], [], 'ID vide');
        }
        
        $queryGraphQL = <<<'GRAPHQL'
query($id: Int) {
  Media(id: $id, type: ANIME) {
    id
    title { romaji english userPreferred }
    coverImage { large color }
    bannerImage
    episodes
    status
    format
    startDate { year month day }
    endDate { year month day }
    season
    seasonYear
    description
    genres
    tags { name }
    averageScore
    meanScore
    popularity
    favourites
    studios { nodes { id name } }
    relations { edges { relationshipType node { id title { userPreferred } } } }
    synonyms
    isAdult
    countryOfOrigin
  }
}
GRAPHQL;
        
        $postData = [
            'query' => $queryGraphQL,
            'variables' => ['id' => intval($id)]
        ];
        
        $ch = curl_init();
        curl_setopt_array($ch, [
            CURLOPT_URL => $this->graphqlEndpoint,
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_TIMEOUT => 10,
            CURLOPT_POST => true,
            CURLOPT_POSTFIELDS => json_encode($postData),
            CURLOPT_HTTPHEADER => [
                'Content-Type: application/json',
                'Accept: application/json'
            ],
            CURLOPT_HEADER => true
        ]);
        
        $response = curl_exec($ch);
        $status = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $headerSize = curl_getinfo($ch, CURLINFO_HEADER_SIZE);
        $error = curl_error($ch);
        curl_close($ch);
        
        if ($error) {
            return $this->buildResponse(false, [], [], "Erreur cURL: $error");
        }
        
        $headerText = substr($response, 0, $headerSize);
        $body = substr($response, $headerSize);
        $rawHeaders = explode("\r\n", $headerText);
        $parsedHeaders = $this->parseHeaders($rawHeaders);
        
        $rateLimit = $this->parseRateLimit($parsedHeaders);
        
        if ($status !== 200) {
            return $this->buildResponse(false, [], $rateLimit, "HTTP $status");
        }
        
        $data = json_decode($body, true);
        
        if (isset($data['errors'])) {
            $errorMsg = $data['errors'][0]['message'] ?? 'Unknown error';
            return $this->buildResponse(false, [], $rateLimit, $errorMsg);
        }
        
        if (!isset($data['data']['Media'])) {
            return $this->buildResponse(false, [], $rateLimit, 'Anime non trouvé');
        }
        
        return $this->buildResponse(true, [$this->normalizeAnimeData($data['data']['Media'])], $rateLimit);
    }
    
    protected function parseRateLimit($headers) {
        $limit = null;
        $remaining = null;
        $resetAt = null;
        $retryAfter = null;
        
        // AniList utilise X-RateLimit-* headers
        if (isset($headers['X-RateLimit-Limit'])) {
            $limit = intval($headers['X-RateLimit-Limit']);
        }
        if (isset($headers['X-RateLimit-Remaining'])) {
            $remaining = intval($headers['X-RateLimit-Remaining']);
        }
        if (isset($headers['X-RateLimit-Reset'])) {
            // C'est un timestamp Unix
            $resetAt = intval($headers['X-RateLimit-Reset']);
        }
        if (isset($headers['Retry-After'])) {
            $retryAfter = intval($headers['Retry-After']);
        }
        
        return compact('limit', 'remaining', 'resetAt', 'retryAfter');
    }
    
    protected function normalizeAnimeData($data) {
        return [
            'id' => $data['id'] ?? null,
            'title' => $data['title']['userPreferred'] ?? $data['title']['english'] ?? $data['title']['romaji'] ?? 'Unknown',
            'titleRomaji' => $data['title']['romaji'] ?? null,
            'titleEnglish' => $data['title']['english'] ?? null,
            'episodes' => $data['episodes'] ?? null,
            'status' => $data['status'] ?? 'X',
            'rating' => isset($data['meanScore']) && is_numeric($data['meanScore']) ? $data['meanScore'] / 10 : 'X',
            'coverImage' => $data['coverImage']['large'] ?? 'X',
            'description' => !empty($data['description']) ? strip_tags($data['description']) : 'X',
            'tags' => !empty($data['genres']) ? $data['genres'] : (isset($data['tags']) ? array_column($data['tags'], 'name') : []),
            'sourceApi' => 'anilist',
            'sourceId' => $data['id'] ?? null,
            'format' => $data['format'] ?? null
        ];
    }
}
