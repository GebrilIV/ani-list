// app/methods-anilist.js - Méthodes pour les APIs anime
function getAniListMethods() {
    return {
        trackAniListRequest() {
            if (!this.apiRateInfo[this.selectedApiProvider]) {
                this.apiRateInfo[this.selectedApiProvider] = { limit: null, remaining: null, resetAt: null, retryAfter: null };
            }
        },
        trackAniListResponse(res, provider) {
            provider = provider || this.selectedApiProvider;
            if (!this.apiRateInfo[provider]) {
                this.apiRateInfo[provider] = { limit: null, remaining: null, resetAt: null, retryAfter: null };
            }
            // La mise à jour des headers est faite par le gestionnaire API
        },
        async fetchAnimeSuggestions() { // Suggestions d'animes
            const q = this.newAnimeName.trim();
            if (q.length < 2) {
                this.animeSuggestions = [];
                this.animeSuggestionDropdown = false;
                return;
            }
            this.animeSuggestionLoading = true;
            this.animeSuggestionError = '';
            try {
                // Utiliser le gestionnaire centralisé
                const suggestions = await ApiManager.searchAnime(q, 10);
                if (suggestions && Array.isArray(suggestions)) {
                    this.animeSuggestions = suggestions;
                    this.animeSuggestionDropdown = true;
                } else {
                    this.animeSuggestions = [];
                    this.animeSuggestionError = 'Aucun résultat';
                }
            } catch (e) {
                console.error('Erreur suggestions:', e);
                this.animeSuggestionError = 'Erreur lors de la recherche';
                this.animeSuggestions = [];
            } finally {
                this.animeSuggestionLoading = false;
            }
        },
        async fetchAnimeInfo() {
            if (!this.animeSuggestionSelected) return;
            
            const anime = this.animeSuggestionSelected;
            const provider = anime.sourceApi || this.selectedApiProvider;
            
            try {
                const details = await ApiManager.getAnimeDetails(anime.sourceId, provider);
                if (details) {
                    // Remplir les champs d'ajout
                    this.animeFields.id_anilist = details.sourceId || anime.id;
                    this.animeFields.title = details.title || anime.title;
                    this.animeFields.title_romaji = details.titleRomaji || '';
                    this.animeFields.episodes = details.episodes || '';
                    this.animeFields.status = details.status || 'X';
                    this.animeFields.star = '';
                    this.animeFields.tags = Array.isArray(details.tags) ? details.tags.join(', ') : '';
                    this.animeFields.pics = details.coverImage || '';
                    this.animeFields.description = details.description || '';
                    this.animeInfo = details;
                }
            } catch (e) {
                console.error('Erreur détails anime:', e);
            }
        },
        selectAnimeSuggestion(s) {
            this.animeSuggestionSelected = s;
            this.newAnimeName = s.title;
            this.animeSuggestionDropdown = false;
            this.fetchAnimeInfo();
        },
        clearAnimeSuggestion() {
            this.animeSuggestionSelected = null;
            this.animeSuggestions = [];
            this.animeSuggestionDropdown = false;
        },
        handleAnimeInputBlur() {
            // Petit délai pour permettre la sélection du dropdown
            setTimeout(() => {
                if (!this.animeSuggestionSelected && this.newAnimeName.trim()) {
                    this.newAnimeName = '';
                    this.animeSuggestions = [];
                }
                this.animeSuggestionDropdown = false;
            }, 200);
        },
    };
}
