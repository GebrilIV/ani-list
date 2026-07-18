// app/computed.js - Propriétés calculées
function getComputedProperties() {
    return {
        anilistRateInfo() { // infos calculées (headers HTTP)
            void this.anilistRateTick;

            const nowSec = Math.floor(Date.now() / 1000);
            const limit = (this.anilistRate && Number.isFinite(this.anilistRate.limit)) ? this.anilistRate.limit : null;
            const remaining = (this.anilistRate && Number.isFinite(this.anilistRate.remaining)) ? this.anilistRate.remaining : null;
            const resetAt = (this.anilistRate && Number.isFinite(this.anilistRate.resetAt)) ? this.anilistRate.resetAt : null;
            const retryAfterSec = (this.anilistRate && Number.isFinite(this.anilistRate.retryAfterSec)) ? this.anilistRate.retryAfterSec : null;

            const resetInSec = resetAt ? Math.max(0, resetAt - nowSec) : 0;

            const lastStatus = this.anilistRate ? this.anilistRate.lastStatus : null;
            const lastError = this.anilistRate ? (this.anilistRate.lastError || '') : '';

            return {
                limit,
                remaining,
                resetAt,
                resetInSec,
                retryAfterSec,
                lastStatus,
                lastError,
            };
        },
        filteredAnimes() { // Animes filtrés par recherche
            if (!this.search) return this.animes;
            return this.animes.filter(a => a.title.toLowerCase().includes(this.search.toLowerCase()));
        },
        currentListDetail() { // Détails de la liste actuelle
            return this.lists.find(l => l.id === this.listDetailId) || null;
        },
        currentListAnimes() { // Animes de la liste actuelle
            if (!this.currentListDetail) return [];
            // Si la liste utilise 'animes' (nouveau format)
            if (Array.isArray(this.currentListDetail.animes)) return this.currentListDetail.animes;
            // Si la liste utilise 'animeIds' (ancien format)
            if (Array.isArray(this.currentListDetail.animeIds)) {
                return this.animes.filter(a => this.currentListDetail.animeIds.includes(a.id));
            }
            return [];
        },
        filteredListAnimes() { // Animes filtrés dans la liste
            // Transforme les références en objets anime complets
            let arr = this.currentListAnimes
                .map(ref => this.getAnime(ref.id || ref))
                .filter(a => a && a.id);

            // Filtre statut (progress.status)
            if (Array.isArray(this.listStatusFilters) && this.listStatusFilters.length > 0) {
                arr = arr.filter(a => {
                    const st = (a.progress && a.progress.status) ? a.progress.status : 'plan_to_watch';
                    return this.listStatusFilters.includes(st);
                });
            }

            if (this.listSearch) {
                const search = this.listSearch.toLowerCase();
                arr = arr.filter(a => {
                    const titleMatch = (a.title || '').toLowerCase().includes(search);
                    const romajiMatch = (a.title_romaji || '').toLowerCase().includes(search);
                    let tagsArr = Array.isArray(a.tags) ? a.tags : (typeof a.tags === 'string' ? a.tags.split(',').map(t=>t.trim()) : []);
                    const tagsMatch = tagsArr.some(tag => tag.toLowerCase().includes(search));
                    return titleMatch || romajiMatch || tagsMatch;
                });
            }
            if (this.listSort === 'alpha') {
                arr = arr.slice().sort((a, b) => (a.title || '').localeCompare(b.title || ''));
            } else if (this.listSort === 'alpha_desc') {
                arr = arr.slice().sort((a, b) => (b.title || '').localeCompare(a.title || ''));
            } else if (this.listSort === 'lastview') {
                arr = arr.slice().sort((a, b) => (b.last_view || 0) - (a.last_view || 0));
            } else if (this.listSort === 'oldview') {
                arr = arr.slice().sort((a, b) => (a.last_view || 0) - (b.last_view || 0));
            } else if (this.listSort === 'rated_overall_high') {
                const overall = (anime) => {
                    const v = parseFloat(anime.star);
                    return Number.isFinite(v) ? v : null;
                };
                arr = arr.slice().sort((a, b) => {
                    const ra = overall(a);
                    const rb = overall(b);
                    if (ra === null && rb === null) return 0;
                    if (ra === null) return 1;
                    if (rb === null) return -1;
                    return rb - ra;
                });
            } else if (this.listSort === 'rated_overall_low') {
                const overall = (anime) => {
                    const v = parseFloat(anime.star);
                    return Number.isFinite(v) ? v : null;
                };
                arr = arr.slice().sort((a, b) => {
                    const ra = overall(a);
                    const rb = overall(b);
                    if (ra === null && rb === null) return 0;
                    if (ra === null) return 1;
                    if (rb === null) return -1;
                    return ra - rb;
                });
            } else if (this.listSort === 'rated_personal_high') {
                const personal = (anime) => {
                    const v = parseFloat(anime.my_star);
                    return Number.isFinite(v) ? v : null;
                };
                arr = arr.slice().sort((a, b) => {
                    const ra = personal(a);
                    const rb = personal(b);
                    if (ra === null && rb === null) return 0;
                    if (ra === null) return 1;
                    if (rb === null) return -1;
                    return rb - ra;
                });
            } else if (this.listSort === 'rated_personal_low') {
                const personal = (anime) => {
                    const v = parseFloat(anime.my_star);
                    return Number.isFinite(v) ? v : null;
                };
                arr = arr.slice().sort((a, b) => {
                    const ra = personal(a);
                    const rb = personal(b);
                    if (ra === null && rb === null) return 0;
                    if (ra === null) return 1;
                    if (rb === null) return -1;
                    return ra - rb;
                });
            } else if (this.listSort === 'episodes_most') {
                arr = arr.slice().sort((a, b) => (Number(b.episodes) || 0) - (Number(a.episodes) || 0));
            } else if (this.listSort === 'near_completion') {
                // Plus proche de la fin (reste d'épisodes le plus petit)
                const remaining = (anime) => {
                    const total = Number(anime.episodes) || 0;
                    const watched = Number(anime.progress && anime.progress.episode) || 0;
                    if (total <= 0) return Number.POSITIVE_INFINITY; // inconnu => tout à la fin
                    return Math.max(0, total - watched);
                };
                arr = arr.slice().sort((a, b) => {
                    const ra = remaining(a);
                    const rb = remaining(b);
                    if (ra !== rb) return ra - rb;
                    // tie-breaker: plus vu récemment
                    return (b.last_view || 0) - (a.last_view || 0);
                });
            }
            return arr;
        },
        isDarkTheme() { // Thème sombre activé ?
            return (typeof window !== 'undefined' && window.document && window.document.documentElement.getAttribute('data-theme') === 'dark');
        },
        lastViewedAnimes() { // Derniers animes vus
            return this.animes
                .filter(a => a.last_view)
                .sort((a, b) => (b.last_view || 0) - (a.last_view || 0))
                .slice(0, 3);
        },
        recentAnimes() { // Animes récents
            return this.animes
                .filter(a => a.id)
                .sort((a, b) => (b.id || 0) - (a.id || 0))
                .slice(0, 3);
        },
        doublonCount() { // Compte des doublons
            const title = (this.animeFields.title || '').trim().toLowerCase();
            if (!title) return 0;
            return this.animes.filter(a => (a.title || '').trim().toLowerCase() === title).length;
        },
    };
}
