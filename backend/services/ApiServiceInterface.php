<?php
/**
 * Interface abstraite pour les services d'API d'anime
 * Garantit une structure commune pour tous les fournisseurs d'API
 */
abstract class ApiServiceInterface {
    
    /**
     * Recherche des animes par requête
     * @param string $query Requête de recherche
     * @param int $limit Nombre de résultats max
     * @return array Réponse normalisée {success, data[], rateLimit, error}
     */
    abstract public function searchAnime($query, $limit = 10);
    
    /**
     * Récupère les détails complets d'un anime
     * @param string|int $id ID de l'anime (format spécifique à chaque API)
     * @return array Réponse normalisée avec détails complets
     */
    abstract public function getAnimeDetails($id);
    
    /**
     * Récupère les informations de rate limit depuis les headers
     * @param array $headers Headers HTTP de la réponse
     * @return array {limit, remaining, resetAt (timestamp Unix), retryAfter (secondes)}
     */
    abstract protected function parseRateLimit($headers);
    
    /**
     * Normalise la réponse API dans un format uniforme
     * @param array $data Données brutes de l'API
     * @return array {id, title, titleRomaji, episodes, status, rating, coverImage, description, tags, sourceApi, sourceId}
     */
    abstract protected function normalizeAnimeData($data);
    
    /**
     * Construit la réponse standard
     * @param bool $success Succès de l'appel
     * @param array $data Données normalisées
     * @param array $rateLimit Info rate limit
     * @param string|null $error Message d'erreur (optionnel)
     * @return array Réponse structurée
     */
    protected function buildResponse($success, $data = [], $rateLimit = [], $error = null) {
        return [
            'success' => $success,
            'data' => $data,
            'rateLimit' => [
                'limit' => $rateLimit['limit'] ?? null,
                'remaining' => $rateLimit['remaining'] ?? null,
                'resetAt' => $rateLimit['resetAt'] ?? null,  // Unix timestamp
                'retryAfter' => $rateLimit['retryAfter'] ?? null  // seconds
            ],
            'error' => $error
        ];
    }
    
    /**
     * Effectue une requête HTTP GET
     * @param string $url URL complète
     * @param array $headers Headers optionnels
     * @return array {status, body, headers}
     */
    protected function httpGet($url, $headers = []) {
        $context = stream_context_create([
            'http' => [
                'method' => 'GET',
                'header' => $this->buildHeaderString($headers),
                'timeout' => 10
            ]
        ]);
        
        try {
            $response = file_get_contents($url, false, $context);
            // Récupère les headers de la réponse
            $responseHeaders = $http_response_header ?? [];
            
            return [
                'status' => 200,
                'body' => $response,
                'headers' => $responseHeaders
            ];
        } catch (Exception $e) {
            return [
                'status' => 0,
                'body' => null,
                'headers' => [],
                'error' => $e->getMessage()
            ];
        }
    }
    
    /**
     * Convertit un tableau de headers en string pour stream context
     * @param array $headers Ex: ['X-Custom' => 'value']
     * @return string Ex: "X-Custom: value\r\nContent-Type: application/json\r\n"
     */
    protected function buildHeaderString($headers) {
        $headerString = '';
        foreach ($headers as $key => $value) {
            $headerString .= "$key: $value\r\n";
        }
        return $headerString;
    }
    
    /**
     * Parse les headers HTTP en tableau associatif
     * @param array $rawHeaders Headers bruts de la réponse
     * @return array {key => value}
     */
    protected function parseHeaders($rawHeaders) {
        $parsed = [];
        foreach ($rawHeaders as $header) {
            if (strpos($header, ':') !== false) {
                [$key, $value] = explode(':', $header, 2);
                $parsed[trim($key)] = trim($value);
            }
        }
        return $parsed;
    }
    
    /**
     * Utilise cURL si disponible (plus fiable que stream_context)
     * @param string $url URL
     * @param array $headers Headers
     * @return array {status, body, headers, error}
     */
    protected function curlGet($url, $headers = []) {
        if (!function_exists('curl_init')) {
            return $this->httpGet($url, $headers);
        }
        
        $ch = curl_init();
        curl_setopt_array($ch, [
            CURLOPT_URL => $url,
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_TIMEOUT => 10,
            CURLOPT_HTTPHEADER => $this->buildHeaderArray($headers),
            CURLOPT_HEADER => true  // Include headers in response
        ]);
        
        $response = curl_exec($ch);
        $status = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $headerSize = curl_getinfo($ch, CURLINFO_HEADER_SIZE);
        $error = curl_error($ch);
        curl_close($ch);
        
        $headerText = substr($response, 0, $headerSize);
        $body = substr($response, $headerSize);
        $rawHeaders = explode("\r\n", $headerText);
        
        return [
            'status' => $status,
            'body' => $body,
            'headers' => $rawHeaders,
            'error' => $error
        ];
    }
    
    /**
     * Convertit tableau headers pour CURLOPT_HTTPHEADER
     * @param array $headers
     * @return array
     */
    protected function buildHeaderArray($headers) {
        $result = [];
        foreach ($headers as $key => $value) {
            $result[] = "$key: $value";
        }
        return $result;
    }
    
    /**
     * Effectue un requête HTTP avec fallback curl/stream
     * @param string $url URL
     * @param array $headers Headers
     * @return array {status, body, headers, error}
     */
    protected function makeRequest($url, $headers = []) {
        return $this->curlGet($url, $headers);
    }
}
