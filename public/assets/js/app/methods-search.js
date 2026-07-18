// app/methods-search.js - Méthodes de recherche et manipulation de texte
function getSearchMethods() {
    return {
        normalizeSeasonInput(value, fallback = null) {
            if (value === null || typeof value === 'undefined') return fallback;
            const s = String(value).trim();
            if (!s) return fallback;
            const cleaned = s.replace(',', '.');
            const n = Number(cleaned);
            if (!Number.isFinite(n) || n <= 0) return fallback;
            const rounded = Math.round(n);
            if (Math.abs(n - rounded) < 1e-9) return rounded;
            return n;
        },
        // Normalise une chaîne pour la recherche (minuscule, sans accents, espaces propres)
        normalizeSearchText(str) {
            const s = (str || '').toString().trim().toLowerCase();
            // Retire accents/diacritiques si possible
            const n = (typeof s.normalize === 'function') ? s.normalize('NFD') : s;
            return n
                .replace(/[\u0300-\u036f]/g, '')
                .replace(/[^a-z0-9 _-]+/g, ' ')
                .replace(/\s+/g, ' ')
                .trim();
        },
        // Tokenize simple (mots)
        tokenizeSearchText(str) {
            const norm = this.normalizeSearchText(str);
            if (!norm) return [];
            return norm.split(' ').filter(Boolean);
        },
        // Distance de Levenshtein (typos légères)
        levenshtein(a, b) {
            const s = (a || '').toString();
            const t = (b || '').toString();
            const n = s.length;
            const m = t.length;
            if (n === 0) return m;
            if (m === 0) return n;

            // Optimisation simple : utiliser 2 lignes
            let prev = new Array(m + 1);
            let curr = new Array(m + 1);
            for (let j = 0; j <= m; j++) prev[j] = j;
            for (let i = 1; i <= n; i++) {
                curr[0] = i;
                const si = s.charCodeAt(i - 1);
                for (let j = 1; j <= m; j++) {
                    const cost = si === t.charCodeAt(j - 1) ? 0 : 1;
                    curr[j] = Math.min(
                        prev[j] + 1,
                        curr[j - 1] + 1,
                        prev[j - 1] + cost
                    );
                }
                const tmp = prev;
                prev = curr;
                curr = tmp;
            }
            return prev[m];
        },
        // Construit une liste de mots pertinents pour un anime (titre, tags, statut)
        getAnimeSearchWords(anime) {
            if (!anime) return [];
            const tags = Array.isArray(anime.tags) ? anime.tags : [];
            const stRaw = (anime.progress && anime.progress.status) ? anime.progress.status : '';
            const stLabel = this.progressStatusLabel(stRaw);

            const blob = [
                anime.title || '',
                anime.title_romaji || '',
                stRaw || '',
                stLabel || '',
                tags.join(' '),
            ].join(' ');

            return this.tokenizeSearchText(blob);
        },
        // Score un anime pour une requête (>=1 => match)
        scoreAnimeForQuery(anime, queryTokens, queryNorm) {
            if (!anime || !Array.isArray(queryTokens) || queryTokens.length === 0) return 0;

            const title = this.normalizeSearchText(anime.title || '');
            const romaji = this.normalizeSearchText(anime.title_romaji || '');
            const tags = (Array.isArray(anime.tags) ? anime.tags : []).map(t => this.normalizeSearchText(t));
            const stRaw = this.normalizeSearchText((anime.progress && anime.progress.status) ? anime.progress.status : '');
            const stLabel = this.normalizeSearchText(this.progressStatusLabel((anime.progress && anime.progress.status) ? anime.progress.status : ''));

            // Prépare les mots pour la typo-tolérance
            const words = this.getAnimeSearchWords(anime);

            let score = 0;
            for (const token of queryTokens) {
                if (!token) continue;

                // Requête très courte (1 char) => uniquement prefix sur titres / tags
                if (token.length === 1) {
                    const titleHit = title.startsWith(token) || romaji.startsWith(token);
                    const tagHit = tags.some(t => t.startsWith(token));
                    if (titleHit) score += 8;
                    else if (tagHit) score += 5;
                    continue;
                }

                // Match direct (substring)
                const inTitle = title.includes(token) || romaji.includes(token);
                const inTags = tags.some(t => t.includes(token));
                const inStatus = stRaw.includes(token) || stLabel.includes(token);
                if (inTitle) { score += 30; continue; }
                if (inTags) { score += 20; continue; }
                if (inStatus) { score += 14; continue; }

                // Typo-tolérance : distance sur mots (seulement si token assez long)
                if (token.length >= 3) {
                    let best = 99;
                    for (const w of words) {
                        if (!w) continue;
                        const dl = Math.abs(w.length - token.length);
                        if (dl > 2) continue;
                        const d = this.levenshtein(token, w);
                        if (d < best) best = d;
                        if (best === 0) break;
                    }
                    const threshold = token.length <= 5 ? 1 : 2;
                    if (best <= threshold) {
                        score += (10 - best * 3);
                        continue;
                    }
                }
            }

            // Bonus si la requête colle bien au titre (ex: début exact)
            if (queryNorm && title && (title.startsWith(queryNorm) || romaji.startsWith(queryNorm))) score += 6;
            return score;
        },
        // Calcule les suggestions pour la barre du header
        computeHeaderSearchResults() {
            const q = this.normalizeSearchText(this.headerSearchQuery);
            if (!q || q.length < (this.headerSearchMinChars || 1)) {
                this.headerSearchResults = [];
                this.headerSearchActiveIndex = -1;
                this.headerSearchOpen = false;
                return;
            }

            const tokens = this.tokenizeSearchText(q);
            const scored = (this.animes || [])
                .map(a => ({
                    anime: a,
                    score: this.scoreAnimeForQuery(a, tokens, q)
                }))
                .filter(x => x.score > 0)
                .sort((a, b) => {
                    if (b.score !== a.score) return b.score - a.score;
                    const ta = (a.anime.title || '').toString();
                    const tb = (b.anime.title || '').toString();
                    return ta.localeCompare(tb);
                })
                .slice(0, 8)
                .map(x => x.anime);

            this.headerSearchResults = scored;
            this.headerSearchActiveIndex = scored.length > 0 ? 0 : -1;
            this.headerSearchOpen = scored.length > 0;
        },
        handleHeaderSearchBlur() {
            // Petit délai pour laisser le clic sur une suggestion fonctionner
            setTimeout(() => {
                this.headerSearchOpen = false;
            }, 120);
        },
        moveHeaderSearch(step) {
            const n = this.headerSearchResults.length;
            if (!n) return;
            const next = this.headerSearchActiveIndex + step;
            if (next < 0) this.headerSearchActiveIndex = n - 1;
            else if (next >= n) this.headerSearchActiveIndex = 0;
            else this.headerSearchActiveIndex = next;
        },
        selectHeaderSearchSuggestion(id) {
            if (!id) return;
            // Navigation vers la fiche anime, sans requête API externe
            const fromListId = (this.currentView === 'listDetail' && this.listDetailId) ? this.listDetailId : null;
            this.setView('animeDetail', id, fromListId);

            // Ferme le dropdown et nettoie
            this.headerSearchOpen = false;
            this.headerSearchResults = [];
            this.headerSearchActiveIndex = -1;
            this.headerSearchQuery = '';
        },
    };
}
