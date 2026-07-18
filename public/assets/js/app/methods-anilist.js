// app/methods-anilist.js - Méthodes pour l'API AniList
function getAniListMethods() {
    return {
        trackAniListRequest() {
            if (!this.anilistRate) return;
            const now = Date.now();
            this.anilistRate.lastRequestAt = now;
            this.anilistRate.lastError = '';
            this.anilistRate.lastStatus = null;
        },
        trackAniListResponse(res) {
            if (!this.anilistRate) return;
            this.anilistRate.lastResponseAt = Date.now();
            if (res && typeof res.status === 'number') this.anilistRate.lastStatus = res.status;

            // Headers AniList (si exposés via CORS)
            // - X-RateLimit-Limit
            // - X-RateLimit-Remaining
            // - Retry-After (sur 429)
            // - X-RateLimit-Reset (sur 429)
            try {
                const limitRaw = res && res.headers ? res.headers.get('X-RateLimit-Limit') : null;
                const remainingRaw = res && res.headers ? res.headers.get('X-RateLimit-Remaining') : null;
                const retryAfterRaw = res && res.headers ? res.headers.get('Retry-After') : null;
                const resetRaw = res && res.headers ? res.headers.get('X-RateLimit-Reset') : null;

                const limit = limitRaw !== null ? parseInt(limitRaw, 10) : NaN;
                const remaining = remainingRaw !== null ? parseInt(remainingRaw, 10) : NaN;
                const retryAfterSec = retryAfterRaw !== null ? parseInt(retryAfterRaw, 10) : NaN;
                const resetAt = resetRaw !== null ? parseInt(resetRaw, 10) : NaN;

                if (Number.isFinite(limit)) this.anilistRate.limit = limit;
                if (Number.isFinite(remaining)) this.anilistRate.remaining = remaining;
                if (Number.isFinite(retryAfterSec)) this.anilistRate.retryAfterSec = retryAfterSec;
                if (Number.isFinite(resetAt)) this.anilistRate.resetAt = resetAt;
            } catch (e) {
                // ignore header parsing errors
            }

            if (res && res.ok === false) {
                if (res.status === 429) this.anilistRate.lastError = 'Limite atteinte (HTTP 429)';
                else this.anilistRate.lastError = `Erreur AniList (HTTP ${res.status})`;
            }
        },
        async fetchAnimeSuggestions() { // Suggestions d'animes
            const q = this.newAnimeName.trim();
            if (q.length < 2) { this.animeSuggestions = []; this.animeSuggestionDropdown = false; return; }
            this.animeSuggestionLoading = true;
            this.animeSuggestionError = '';
            try {
                const query = `query ($search: String) { Page(perPage: 6) { media(search: $search, type: ANIME) { id title { romaji } coverImage { medium } } } }`;
                const variables = { search: q };
                this.trackAniListRequest();
                const res = await fetch('https://graphql.anilist.co', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
                    body: JSON.stringify({ query, variables })
                });
                this.trackAniListResponse(res);
                const json = await res.json();
                this.animeSuggestions = (json.data && json.data.Page && json.data.Page.media) ? json.data.Page.media : [];
                this.animeSuggestionDropdown = this.animeSuggestions.length > 0;
            } catch (e) {
                this.animeSuggestionError = 'Erreur AniList';
                if (this.anilistRate) this.anilistRate.lastError = 'Erreur réseau AniList';
                this.animeSuggestions = [];
                this.animeSuggestionDropdown = false;
            } finally {
                this.animeSuggestionLoading = false;
            }
        },
        async fetchAnimeInfo() { // Infos détaillées d'un anime
            const q = this.newAnimeName.trim();
            if (!q) return;
            this.animeSuggestionLoading = true;
            try {
                const query = `query ($search: String) { Media(search: $search, type: ANIME) { id idMal title { romaji english } description(asHtml: false) episodes status averageScore tags { name } coverImage { medium large } genres } }`;
                const variables = { search: q };
                this.trackAniListRequest();
                const res = await fetch('https://graphql.anilist.co', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
                    body: JSON.stringify({ query, variables })
                });
                this.trackAniListResponse(res);
                const json = await res.json();
                if (json.data && json.data.Media) {
                    const m = json.data.Media;
                    this.animeFields.id_anilist = m.id || '';
                    this.animeFields.title = m.title.english || m.title.romaji || '';
                    this.animeFields.title_romaji = m.title.romaji || '';
                    this.animeFields.episodes = m.episodes || '';
                    this.animeFields.status = m.status || '';
                    this.animeFields.star = m.averageScore ? (m.averageScore/20).toFixed(1) : '';
                    this.animeFields.tags = (m.genres && m.genres.length) ? m.genres.join(', ') : (m.tags ? m.tags.map(t=>t.name).join(', ') : '');
                    this.animeFields.pics = m.coverImage && m.coverImage.large ? m.coverImage.large : (m.coverImage ? m.coverImage.medium : '');
                    this.animeFields.description = m.description ? m.description.replace(/<[^>]+>/g, '') : '';
                }
            } catch (e) {
                // reset fields on error
                Object.keys(this.animeFields).forEach(k => this.animeFields[k] = '');
                if (this.anilistRate) this.anilistRate.lastError = 'Erreur réseau AniList';
            } finally {
                this.animeSuggestionLoading = false;
            }
        },
        selectAnimeSuggestion(s) { // Sélectionner une suggestion d'anime
            this.newAnimeName = s.title.romaji;
            this.animeSuggestionSelected = {
                id: s.id,
                title: s.title.romaji,
                image: s.coverImage.medium
            };
            this.animeSuggestionDropdown = false;
            // Synchronise les champs de l'anime avec la suggestion sélectionnée
            // Appelle fetchAnimeInfo pour remplir animeFields à partir du nom sélectionné
            this.fetchAnimeInfo();
        },
        clearAnimeSuggestion() { // Effacer la suggestion d'anime
            this.animeSuggestionSelected = null;
        },
        handleAnimeInputBlur() { // Gérer la perte de focus sur le champ d'anime
            window.setTimeout(() => {
                this.animeSuggestionDropdown = false;
            }, 200);
        },
    };
}
