// app/apis/api-manager.js - Gestionnaire centralisé des APIs
const ApiManager = {
    // État du gestionnaire
    state: {
        selectedProvider: 'anilist',
        providers: [],
        rateInfo: {
            anilist: { limit: null, remaining: null, resetAt: null, retryAfter: null },
            jikan: { limit: null, remaining: null, resetAt: null, retryAfter: null },
            myanimelist: { limit: null, remaining: null, resetAt: null, retryAfter: null },
            kitsu: { limit: null, remaining: null, resetAt: null, retryAfter: null }
        },
        cache: {}  // cache simple pour suggestions
    },
    
    /**
     * Initialise le gestionnaire et charge les providers disponibles
     */
    async init() {
        try {
            const res = await fetch('/providers');
            const data = await res.json();
            if (data.success) {
                this.state.providers = data.data;
            }
        } catch (e) {
            console.warn('Impossible de charger les providers:', e);
            // Fallback: créer providers par défaut
            this.state.providers = [
                { id: 'anilist', name: 'AniList', logo: 'AniList-AL.svg.webp', enabled: true },
                { id: 'jikan', name: 'Jikan', logo: 'JikanMoe-J.png', enabled: true },
                { id: 'myanimelist', name: 'MyAnimeList', logo: 'MyAnimeList-MAL.png', enabled: false },
                { id: 'kitsu', name: 'Kitsu', logo: null, enabled: true }
            ];
        }
    },
    
    /**
     * Recherche un anime avec le provider actuel + fallback
     * @param {string} query Requête de recherche
     * @param {number} limit Nombre de résultats max
     * @returns {Promise<Array>} Animes normalisés
     */
    async searchAnime(query, limit = 10) {
        if (!query || query.length < 2) {
            return [];
        }
        
        // Vérifier le cache
        const cacheKey = `${this.state.selectedProvider}:${query}:${limit}`;
        if (this.state.cache[cacheKey]) {
            return this.state.cache[cacheKey];
        }
        
        try {
            const url = `/search?${new URLSearchParams({
                q: query,
                provider: this.state.selectedProvider,
                limit: limit
            })}`;
            
            const res = await fetch(url);
            const data = await res.json();
            
            // Mettre à jour les infos de rate limit
            if (data.rateLimit) {
                this.state.rateInfo[this.state.selectedProvider] = data.rateLimit;
            }
            
            if (data.success && Array.isArray(data.data)) {
                // Cacher les résultats
                this.state.cache[cacheKey] = data.data;
                
                // Nettoyer le cache trop vieux (garder seulement 10 dernières recherches)
                const cacheKeys = Object.keys(this.state.cache);
                if (cacheKeys.length > 10) {
                    delete this.state.cache[cacheKeys[0]];
                }
                
                return data.data;
            }
            
            return [];
        } catch (e) {
            console.error('Erreur recherche API:', e);
            return [];
        }
    },
    
    /**
     * Récupère les détails d'un anime
     * @param {string|number} id ID de l'anime
     * @param {string} provider Provider d'origine
     * @returns {Promise<Object|null>} Détails normalisés ou null
     */
    async getAnimeDetails(id, provider = null) {
        if (!id) return null;
        
        provider = provider || this.state.selectedProvider;
        
        try {
            const url = `/anime/${id}?${new URLSearchParams({
                provider: provider
            })}`;
            
            const res = await fetch(url);
            const data = await res.json();
            
            // Mettre à jour les infos de rate limit
            if (data.rateLimit) {
                this.state.rateInfo[provider] = data.rateLimit;
            }
            
            if (data.success && Array.isArray(data.data) && data.data.length > 0) {
                return data.data[0];
            }
            
            return null;
        } catch (e) {
            console.error('Erreur détails anime:', e);
            return null;
        }
    },
    
    /**
     * Change le provider sélectionné
     * @param {string} providerId ID du provider (anilist|jikan|myanimelist|kitsu)
     */
    selectProvider(providerId) {
        const provider = this.state.providers.find(p => p.id === providerId);
        if (provider && provider.enabled) {
            this.state.selectedProvider = providerId;
            // Vider le cache quand on change de provider
            this.state.cache = {};
        }
    },
    
    /**
     * Retourne les infos de rate limit du provider actuel
     * @returns {Object}
     */
    getRateLimitInfo() {
        return this.state.rateInfo[this.state.selectedProvider] || {};
    },
    
    /**
     * Retourne les providers disponibles
     * @returns {Array}
     */
    getProviders() {
        return this.state.providers;
    },
    
    /**
     * Retourne le provider actuel
     * @returns {string}
     */
    getCurrentProvider() {
        return this.state.selectedProvider;
    }
};
