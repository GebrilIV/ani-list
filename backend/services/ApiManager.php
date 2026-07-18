<?php
/**
 * Gestionnaire centralisé pour orchestrer les services d'anime
 * Permet de router vers le service approprié et gérer les fallbacks
 */
class ApiManager {
    
    private $services = [];
    private $primaryOrder = ['anilist', 'jikan', 'myanimelist', 'kitsu'];
    
    public function __construct() {
        // Initialiser les services disponibles
        $this->services['anilist'] = new AniListService();
        $this->services['jikan'] = new JikanService();
        
        $malClientId = getenv('MAL_CLIENT_ID') ?: '';
        $malToken = getenv('MAL_ACCESS_TOKEN') ?: '';
        $this->services['myanimelist'] = new MyAnimeListService($malClientId, $malToken);
        
        $kitsuToken = getenv('KITSU_ACCESS_TOKEN') ?: '';
        $this->services['kitsu'] = new KitsuService($kitsuToken);
    }
    
    /**
     * Cherche un anime avec provider primaire + fallbacks
     * @param string $query Requête
     * @param string $primaryProvider API préférée (anilist|myanimelist|jikan|kitsu)
     * @param int $limit Résultats max
     * @return array Réponse normalisée
     */
    public function searchAnime($query, $primaryProvider = 'anilist', $limit = 10) {
        if (!isset($this->services[$primaryProvider])) {
            $primaryProvider = 'anilist';
        }
        
        // Essayer le provider primaire
        $result = $this->services[$primaryProvider]->searchAnime($query, $limit);
        if ($result['success'] && count($result['data']) > 0) {
            return $result;
        }
        
        // Fallback: essayer les autres providers dans l'ordre
        foreach ($this->primaryOrder as $provider) {
            if ($provider !== $primaryProvider && isset($this->services[$provider])) {
                $result = $this->services[$provider]->searchAnime($query, $limit);
                if ($result['success'] && count($result['data']) > 0) {
                    // Marquer que c'est un fallback
                    $result['fallback'] = true;
                    $result['fallbackProvider'] = $provider;
                    return $result;
                }
            }
        }
        
        // Toutes les APIs ont échoué
        return [
            'success' => false,
            'data' => [],
            'rateLimit' => [],
            'error' => 'Aucun résultat trouvé sur toutes les APIs',
            'attempted' => [$primaryProvider, ...array_diff($this->primaryOrder, [$primaryProvider])]
        ];
    }
    
    /**
     * Récupère les détails d'un anime
     * @param string|int $id ID de l'anime
     * @param string $provider API d'origine (anilist|myanimelist|jikan|kitsu)
     * @return array Réponse normalisée
     */
    public function getAnimeDetails($id, $provider = 'anilist') {
        if (!isset($this->services[$provider])) {
            $provider = 'anilist';
        }
        
        $result = $this->services[$provider]->getAnimeDetails($id);
        if ($result['success']) {
            return $result;
        }
        
        // Fallback sur les autres providers
        foreach ($this->primaryOrder as $p) {
            if ($p !== $provider && isset($this->services[$p])) {
                $result = $this->services[$p]->getAnimeDetails($id);
                if ($result['success']) {
                    $result['fallback'] = true;
                    $result['fallbackProvider'] = $p;
                    return $result;
                }
            }
        }
        
        return [
            'success' => false,
            'data' => [],
            'rateLimit' => [],
            'error' => "Impossible de récupérer les détails de l'anime"
        ];
    }
    
    /**
     * Liste les providers disponibles
     * @return array [{id, name, enabled}]
     */
    public function getAvailableProviders() {
        return [
            [
                'id' => 'anilist',
                'name' => 'AniList',
                'logo' => 'AniList-AL.svg.webp',
                'enabled' => true,
                'rateLimit' => '30 req/min',
                'description' => 'GraphQL, excellentes données'
            ],
            [
                'id' => 'jikan',
                'name' => 'Jikan',
                'logo' => 'JikanMoe-J.png',
                'enabled' => true,
                'rateLimit' => '~60 req/min',
                'description' => 'Scraper MAL, données riches'
            ],
            [
                'id' => 'myanimelist',
                'name' => 'MyAnimeList',
                'logo' => 'MyAnimeList-MAL.png',
                'enabled' => !empty(getenv('MAL_CLIENT_ID') ?: ''),
                'rateLimit' => '10-20 req/s',
                'description' => 'Officiel, OAuth2 requis'
            ],
            [
                'id' => 'kitsu',
                'name' => 'Kitsu',
                'logo' => null,
                'enabled' => true,
                'rateLimit' => 'Non limité',
                'description' => 'JSON:API, interface moderne'
            ]
        ];
    }
}
