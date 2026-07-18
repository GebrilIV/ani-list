// Vue.js app entry point
const app = new Vue({
    el: '#app',
    data: {
        currentView: 'home', // Vue actuelle ('home', 'list', 'discover')
        animes: [], // Liste des animes
        search: '', // Barre de recherche
        searchResults: [], // Résultats de recherche AniList

        // Recherche globale (header) : uniquement dans les animes locaux (data.json)
        headerSearchQuery: '',
        headerSearchOpen: false,
        headerSearchResults: [],
        headerSearchActiveIndex: -1,
        headerSearchMinChars: 1,
        headerSearchDebounceTimer: null,
        loading: false, // Indicateur de chargement
        error: '', // Message d'erreur
        lists: [ // Listes d'animes
            { id: 1, name: 'Favoris' },
            { id: 2, name: 'À voir' },
            { id: 3, name: 'Terminé' }
        ],
        selectedList: 1, // Liste sélectionnée
        newListName: '', // Nom pour une nouvelle liste
        newListColor: '#4f8cff', // Couleur de la nouvelle liste
        newListDescription: '', // Description de la nouvelle liste
        listSearch: '', // Recherche dans une liste
        listSort: 'lastview', // Tri des animes dans la liste ('lastview', 'oldview', 'alpha', ...)
        // Recherche avancée (listDetail)
        listAdvancedOpen: false, // Afficher/masquer filtres
        listStatusFilters: [], // Filtre sur progress.status
        listDetailId: null, // ID de la liste en détail
        newAnimeName: '', // Nom du nouvel anime
        newAnimeSeason: '', // Saison du nouvel anime
        newAnimeEpisode: '', // Épisode du nouvel anime
        newAnimeMinute: '', // Minute de l'épisode
        animeSuggestions: [], // Suggestions d'animes
        animeSuggestionLoading: false, // Chargement des suggestions
        animeSuggestionSelected: null, // Suggestion sélectionnée
        animeSuggestionError: '', // Erreur dans les suggestions
        animeSuggestionDropdown: false, // Dropdown des suggestions
        // AniList rate limit (headers HTTP)
        // Voir: https://docs.anilist.co/guide/rate-limiting
        anilistRate: {
            limit: null, // X-RateLimit-Limit
            remaining: null, // X-RateLimit-Remaining
            resetAt: null, // X-RateLimit-Reset (unix seconds)
            retryAfterSec: null, // Retry-After (seconds)
            lastStatus: null,
            lastError: '',
            lastRequestAt: null,
            lastResponseAt: null,
        },
        anilistRateTick: 0, // rafraîchit le compte à rebours (reset/retry-after)
        newAnimeListId: null, // ID de la liste pour ajout
        animeInfo: null, // Infos détaillées d'un anime
        animeFields: { // Champs pour un nouvel anime
            id_anilist: '',
            title: '',
            title_romaji: '',
            episodes: '',
            status: '',
            star: '',
            tags: '',
            pics: '',
            description: '',
            other1: '' // Champ libre
        },
        selectedAnimeId: null, // ID de l'anime sélectionné
        previousListId: null, // Liste précédente
        editProgressMode: false, // Mode édition progression
        editProgressEpisode: 0, // Épisode en édition
        editProgressMinute: 0, // Minute en édition
        // Statut de visionnage (perso)
        progressStatusOptions: [
            { value: 'watching', label: 'Watching' },
            { value: 'completed', label: 'Completed' },
            { value: 'on_hold', label: 'On hold' },
            { value: 'dropped', label: 'Dropped' },
            { value: 'plan_to_watch', label: 'Plan to watch' },
            { value: 'rewatching', label: 'Rewatching' },
            { value: 'rewatch_on_hold', label: 'Rewatch (on hold)' },
            { value: 'rewatch_dropped', label: 'Rewatch (dropped)' },
            { value: 'rewatch_planned', label: 'Rewatch (planned)' },
        ],
        newAnimeProgressStatus: 'plan_to_watch', // Statut à l'ajout
        editProgressStatus: 'watching', // Statut en édition
        editTitle: '', // Titre en édition
        editDescription: '', // Synopsis en édition
        editSeasonInput: '', // Saison en édition (accepte 1, 2.5, 2,5)
        // Note perso
        editMyStarMode: false, // Mode édition note perso
        editMyStarValue: null, // Valeur note perso
        editOther1: '', // Édition champ libre

        // Confirmation sécurisée (suppression)
        confirmOpen: false,
        confirmKind: '', // 'anime' | 'list'
        confirmId: null,
        confirmName: '',
        confirmExpected: '',
        confirmInput: '',
        confirmSure: false,
        confirmAllowDeleteAnimes: false,
        confirmDeleteAnimes: false,
        confirmMessage: '',
    },
    computed: {
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
    },
    methods: {
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
        normalizeConfirmText(text) { // Normalise espaces + trim pour la comparaison
            return (text || '').toString().trim().replace(/\s+/g, ' ');
        },
        openConfirmDelete(payload) { // Ouvre la modale de suppression sécurisée
            const kind = payload && payload.kind ? payload.kind : '';
            const id = payload && typeof payload.id !== 'undefined' ? payload.id : null;
            const name = payload && payload.name ? payload.name : '';
            const allowDeleteAnimes = !!(payload && payload.allowDeleteAnimes);
            const message = payload && payload.message ? payload.message : '';

            const safeName = this.normalizeConfirmText(name) || (kind === 'list' ? 'cette liste' : 'cet anime');
            this.confirmOpen = true;
            this.confirmKind = kind;
            this.confirmId = id;
            this.confirmName = safeName;
            // Sécurité: inclure l'id dans la phrase à taper
            this.confirmExpected = `SUPPRIMER ${safeName} ${id}`;
            this.confirmInput = '';
            this.confirmSure = false;
            this.confirmAllowDeleteAnimes = allowDeleteAnimes;
            this.confirmDeleteAnimes = false;
            this.confirmMessage = message;
        },
        cancelConfirmDelete() { // Ferme la modale et reset l'état
            this.confirmOpen = false;
            this.confirmKind = '';
            this.confirmId = null;
            this.confirmName = '';
            this.confirmExpected = '';
            this.confirmInput = '';
            this.confirmSure = false;
            this.confirmAllowDeleteAnimes = false;
            this.confirmDeleteAnimes = false;
            this.confirmMessage = '';
        },
        isConfirmReady() { // Valide la saisie + checkbox
            const typed = this.normalizeConfirmText(this.confirmInput);
            const expected = this.normalizeConfirmText(this.confirmExpected);
            return this.confirmSure && typed === expected;
        },
        async applyConfirmDelete() { // Exécute la suppression après validation
            if (!this.isConfirmReady()) return;
            const kind = this.confirmKind;
            const id = this.confirmId;

            // Ferme la modale rapidement (UX), mais garde loading pour bloquer les actions
            this.confirmOpen = false;

            if (!id || !kind) return;

            try {
                this.loading = true;

                if (kind === 'anime') {
                    await deleteAnime(id);
                    await this.fetchAnimes();
                    await this.fetchLists();

                    // Retour à la liste si possible
                    const backListId = this.previousListId;
                    this.selectedAnimeId = null;
                    this.editProgressMode = false;
                    this.editMyStarMode = false;
                    if (backListId) {
                        this.openListDetail(backListId);
                    } else {
                        this.setView('list');
                    }
                } else if (kind === 'list') {
                    await deleteList(id, { deleteAnimes: !!this.confirmDeleteAnimes });
                    await this.fetchLists();
                    // Si on a supprimé aussi des animes, on recharge aussi les animes
                    await this.fetchAnimes();
                    this.listDetailId = null;
                    this.setView('list');
                }
            } catch (e) {
                this.error = kind === 'list'
                    ? 'Erreur lors de la suppression de la liste'
                    : "Erreur lors de la suppression de l'anime";
            } finally {
                this.loading = false;
                // Reset complet de l'état de confirmation
                this.cancelConfirmDelete();
            }
        },
        progressStatusLabel(value) { // Label statut (perso)
            const v = (value || '').toString();
            const opt = this.progressStatusOptions.find(o => o.value === v);
            return opt ? opt.label : (v || '—');
        },
        formatMyStar(value) { // Format note perso
            if (value === null || typeof value === 'undefined' || value === '') return '—';
            const n = Number(value);
            if (Number.isNaN(n)) return '—';
            return n.toFixed(1);
        },
        async fetchAnimes() { // Charger les animes
            try {
                this.loading = true;
                this.animes = await fetchAnimeList();
            } catch (e) {
                this.error = 'Erreur lors du chargement des animes';
            } finally {
                this.loading = false;
            }
        },
        async searchAniList() { // Rechercher sur AniList
            if (!this.search) { this.searchResults = []; return; }
            this.loading = true;
            try {
                const query = `query ($search: String) { Media(search: $search, type: ANIME) { id title { romaji } coverImage { medium } episodes } }`;
                const variables = { search: this.search };
                const res = await fetch('https://graphql.anilist.co', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
                    body: JSON.stringify({ query, variables })
                });
                const json = await res.json();
                this.searchResults = json.data && json.data.Media ? [json.data.Media] : [];
            } catch (e) {
                this.error = 'Erreur AniList';
            } finally {
                this.loading = false;
            }
        },
        async fetchLists() { // Charger les listes
            try {
                const res = await fetch('/lists');
                this.lists = await res.json();
            } catch (e) {
                this.error = 'Erreur lors du chargement des listes';
            }
        },
        async handleCreateList() { // Créer une nouvelle liste
            if (!this.newListName.trim()) {
                this.error = 'Le nom de la liste est requis.';
                return;
            }
            try {
                this.loading = true;
                await createList({
                    name: this.newListName,
                    color: this.newListColor,
                    description: this.newListDescription
                });
                this.newListName = '';
                this.newListColor = '#4f8cff';
                this.newListDescription = '';
                await this.fetchLists();
                this.setView('list');
            } catch (e) {
                this.error = 'Erreur lors de la création de la liste';
            } finally {
                this.loading = false;
            }
        },
        async handleAddAnime() { // Ajouter un nouvel anime
            // Vérifie que les champs essentiels sont remplis
            if (!this.animeFields.id_anilist || !this.animeFields.title) {
                this.error = "Merci de cliquer sur la loupe pour récupérer les infos de l'anime avant de valider.";
                return;
            }
            if (!this.newAnimeListId) {
                this.error = "Merci de sélectionner une liste.";
                return;
            }
            if (this.doublonCount > 0) {
                this.error = `${this.doublonCount} doublon${this.doublonCount > 1 ? 's' : ''} trouvé${this.doublonCount > 1 ? 's' : ''} : un anime du même nom existe déjà.`;
                return;
            }
            try {
                this.loading = true;
                // Prépare le payload à partir des champs
                const animePayload = {
                    id_anilist: this.animeFields.id_anilist,
                    title: this.animeFields.title,
                    title_romaji: this.animeFields.title_romaji,
                    episodes: this.animeFields.episodes,
                    status: this.animeFields.status,
                    star: this.animeFields.star,
                    tags: this.animeFields.tags ? this.animeFields.tags.split(',').map(t=>t.trim()) : [],
                    pics: this.animeFields.pics,
                    description: this.animeFields.description,
                    season: this.normalizeSeasonInput(this.newAnimeSeason, 1),
                    episode: this.newAnimeEpisode ? parseInt(this.newAnimeEpisode) : 0,
                    minute: this.newAnimeMinute ? parseInt(this.newAnimeMinute) : 0,
                    progress_status: this.newAnimeProgressStatus,
                    listId: this.newAnimeListId,
                    other1: this.animeFields.other1 || ''
                };
                await addAnime(animePayload);
                await this.fetchAnimes();
                await this.fetchLists();
                this.newAnimeName = '';
                this.newAnimeSeason = '';
                this.newAnimeEpisode = '';
                this.newAnimeMinute = '';
                this.newAnimeProgressStatus = 'plan_to_watch';
                this.animeSuggestionSelected = null;
                Object.keys(this.animeFields).forEach(k => this.animeFields[k] = '');
                this.newAnimeListId = null;
                this.setView('list');
            } catch (e) {
                this.error = "Erreur lors de l'ajout de l'anime";
            } finally {
                this.loading = false;
            }
        },
        selectList(id) { // Sélectionner une liste
            this.selectedList = id;
        },
        setView(view, animeId = null, listId = null) { // Changer de vue
            this.currentView = view;
            if (view === 'animeDetail') {
                this.selectedAnimeId = animeId;
                this.previousListId = listId;
            }
            if (view === 'listDetail' && listId) {
                this.listDetailId = listId;
            }
        },
        goHome() { // Retour à l'accueil
            this.currentView = 'home';
        },
        toggleTheme() { // Changer le thème (clair/sombre)
            const current = document.documentElement.getAttribute('data-theme') || 'light';
            const next = current === 'light' ? 'dark' : 'light';
            document.documentElement.setAttribute('data-theme', next);
            localStorage.setItem('theme', next);
        },
        openListDetail(id) { // Ouvrir les détails d'une liste
            this.listDetailId = id;
            this.listSearch = '';
            this.listSort = 'lastview';
            this.listAdvancedOpen = false;
            this.listStatusFilters = [];
            this.setView('listDetail');
        },
        toggleListAdvanced() { // Toggle recherche avancée
            this.listAdvancedOpen = !this.listAdvancedOpen;
        },
        toggleListStatusFilter(status) { // Toggle filtre statut
            const s = (status || '').toString();
            const idx = this.listStatusFilters.indexOf(s);
            if (idx === -1) this.listStatusFilters.push(s);
            else this.listStatusFilters.splice(idx, 1);
        },
        clearListFilters() { // Reset filtres recherche
            this.listSearch = '';
            this.listStatusFilters = [];
        },
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
        formatLastView(ts) { // Formater la dernière vue
            if (!ts) return 'Jamais';
            const d = new Date(ts * 1000);
            return d.toLocaleDateString('fr-FR') + ' ' + d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
        },
        getAnime(id) { // Obtenir un anime par ID
            const anime = this.animes.find(a => a.id === id) || {};
            // Supprime last_view dans progress si présent
            if (anime.progress && typeof anime.progress.last_view !== 'undefined') {
                delete anime.progress.last_view;
            }
            return anime;
        },
        startEditProgress() { // Démarrer l'édition de la progression
            const anime = this.getAnime(this.selectedAnimeId);
            this.editProgressEpisode = anime.progress && anime.progress.episode ? anime.progress.episode : 0;
            this.editProgressMinute = anime.progress && anime.progress.minute ? anime.progress.minute : 0;
            this.editProgressStatus = (anime.progress && anime.progress.status) ? anime.progress.status : 'watching';
            this.editTitle = anime.title || '';
            this.editDescription = anime.description || '';
            const seasonVal = (anime && typeof anime.season !== 'undefined' && anime.season !== null && anime.season !== '') ? anime.season : 1;
            this.editSeasonInput = String(seasonVal);
            // reset note perso (évite confusion)
            this.editMyStarMode = false;
            // Cherche other1 dans progress, puis à la racine
            this.editOther1 = (anime.progress && typeof anime.progress.other1 !== 'undefined')
                ? anime.progress.other1
                : (anime.other1 || '');
            this.editProgressMode = true;
        },
        startEditMyStar() { // Edit note perso
            const anime = this.getAnime(this.selectedAnimeId);
            const v = (anime && typeof anime.my_star !== 'undefined') ? anime.my_star : null;
            this.editMyStarValue = (v === null || typeof v === 'undefined' || v === '') ? null : Number(v);
            this.editMyStarMode = true;
        },
        cancelEditMyStar() { // Cancel note perso
            this.editMyStarMode = false;
        },
        async saveEditMyStar() { // Save note perso
            const idx = this.animes.findIndex(a => a.id === this.selectedAnimeId);
            if (idx === -1) return;
            const val = (this.editMyStarValue === null || this.editMyStarValue === '' || typeof this.editMyStarValue === 'undefined')
                ? null
                : Number(this.editMyStarValue);

            // UI update optimiste
            this.animes[idx].my_star = (val === null || Number.isNaN(val)) ? null : val;

            try {
                await patchAnime(this.selectedAnimeId, { my_star: this.animes[idx].my_star });
                await this.fetchAnimes();
            } catch (e) {
                this.error = 'Erreur lors de la sauvegarde de la note perso';
            } finally {
                this.editMyStarMode = false;
            }
        },
        cancelEditProgress() { // Annuler l'édition de la progression
            this.editProgressMode = false;
        },
        async saveEditProgress() { // Sauvegarder la progression éditée
            // Met à jour l'anime dans this.animes
            const idx = this.animes.findIndex(a => a.id === this.selectedAnimeId);
            if (idx !== -1) {
                // Saison: ne pas corrompre (accepte 1, 2.5, 2,5). Si vide => ne change pas.
                const seasonStr = (this.editSeasonInput === null || typeof this.editSeasonInput === 'undefined') ? '' : String(this.editSeasonInput).trim();
                let normalizedSeason = null;
                if (seasonStr !== '') {
                    normalizedSeason = this.normalizeSeasonInput(seasonStr, null);
                    if (normalizedSeason === null) {
                        this.error = "Saison invalide. Ex: 1, 2.5, 2,5";
                        return;
                    }
                }

                if (!this.animes[idx].progress) this.animes[idx].progress = {};
                this.animes[idx].progress.episode = this.editProgressEpisode;
                this.animes[idx].progress.minute = this.editProgressMinute;
                this.animes[idx].progress.other1 = this.editOther1;
                this.animes[idx].progress.status = this.editProgressStatus;
                this.animes[idx].title = this.editTitle;
                this.animes[idx].description = this.editDescription;
                if (normalizedSeason !== null) {
                    this.animes[idx].season = normalizedSeason;
                }
                // Met à jour last_view avec la date/heure/minute actuelle
                this.animes[idx].last_view = Math.floor(Date.now() / 1000);
                // Enregistre dans data.json via l'API PATCH
                try {
                    const patchPayload = {
                        title: this.editTitle,
                        description: this.editDescription,
                        progress: {
                            episode: this.editProgressEpisode,
                            minute: this.editProgressMinute,
                            other1: this.editOther1,
                            status: this.editProgressStatus,
                        },
                        last_view: this.animes[idx].last_view
                    };
                    if (normalizedSeason !== null) {
                        patchPayload.season = normalizedSeason;
                    }
                    await patchAnime(this.selectedAnimeId, patchPayload);
                    // Recharge la liste des animes pour être sûr
                    await this.fetchAnimes();
                } catch (e) {
                    this.error = 'Erreur lors de la sauvegarde de la progression';
                }
            }
            this.editProgressMode = false;
        },
        async confirmDeleteAnime() { // Supprimer un anime (avec confirmation)
            const anime = this.getAnime(this.selectedAnimeId);
            const title = anime && anime.title ? anime.title : 'cet anime';
            this.openConfirmDelete({
                kind: 'anime',
                id: this.selectedAnimeId,
                name: title,
                allowDeleteAnimes: false,
                message: 'Cette action est irréversible.'
            });
        },
        async confirmDeleteCurrentList() { // Supprimer une liste (avec confirmation)
            if (!this.currentListDetail || !this.currentListDetail.id) return;
            const name = this.currentListDetail.name || 'cette liste';
            this.openConfirmDelete({
                kind: 'list',
                id: this.currentListDetail.id,
                name,
                allowDeleteAnimes: true,
                message: 'Tu peux choisir de supprimer uniquement la liste, ou la liste + tous les animes qu\'elle contient.'
            });
        },
        showAnimeDetail(id) { // Afficher les détails d'un anime
            // Utilise setView pour garder un comportement cohérent (ex: retour)
            const fromListId = (this.currentView === 'listDetail' && this.listDetailId) ? this.listDetailId : null;
            this.setView('animeDetail', id, fromListId);
        }
    },
    watch: {
        search(val) {
            if (val.length > 1) this.searchAniList();
            else this.searchResults = [];
        },
        headerSearchQuery(val) {
            // Debounce léger pour éviter recalcul à chaque frappe
            if (this.headerSearchDebounceTimer) clearTimeout(this.headerSearchDebounceTimer);
            this.headerSearchDebounceTimer = setTimeout(() => {
                this.computeHeaderSearchResults();
            }, 90);
        },
        newAnimeName(val) {
            this.animeSuggestionSelected = null;
            if (val.length >= 2) {
                this.fetchAnimeSuggestions();
            } else {
                this.animeSuggestions = [];
                this.animeSuggestionDropdown = false;
            }
        }
    },
    mounted() {
        this.fetchAnimes();
        this.fetchLists();
        // Initialisation du thème au montage
        document.documentElement.setAttribute('data-theme', localStorage.getItem('theme') || 'light');

        // Tick simple pour rafraîchir l'info de limite AniList (compte à rebours)
        window.setInterval(() => {
            this.anilistRateTick = (this.anilistRateTick + 1) % 1_000_000;
        }, 1000);
    },
    template: `
    <div>
        <header class="main-header">
            <div class="header-left">
                <img src="assets/css/logo1.png" alt="Logo" class="logo-minimal" @click="goHome" style="cursor:pointer;" />
                <span class="header-title" @click="goHome" style="cursor:pointer;">Anime list</span>
                <div class="header-search-wrap">
                    <input
                        id="header-search"
                        type="text"
                        v-model="headerSearchQuery"
                        placeholder="Rechercher (local)..."
                        autocomplete="off"
                        @focus="headerSearchOpen = headerSearchResults.length > 0"
                        @blur="handleHeaderSearchBlur"
                        @keydown.down.prevent="moveHeaderSearch(1)"
                        @keydown.up.prevent="moveHeaderSearch(-1)"
                        @keydown.enter.prevent="headerSearchResults[headerSearchActiveIndex] && selectHeaderSearchSuggestion(headerSearchResults[headerSearchActiveIndex].id)"
                    />

                    <div v-if="headerSearchOpen && headerSearchResults.length" class="header-search-suggest" role="listbox" aria-label="Suggestions">
                        <div
                            v-for="(anime, idx) in headerSearchResults"
                            :key="anime.id"
                            class="header-search-item"
                            :class="{ active: idx === headerSearchActiveIndex }"
                            role="option"
                            @mousedown.prevent="selectHeaderSearchSuggestion(anime.id)"
                        >
                            <img class="header-search-thumb" :src="anime.pics" :alt="anime.title" />
                            <div class="header-search-meta">
                                <div class="header-search-title">{{ anime.title }}</div>
                                <div class="header-search-sub">{{ progressStatusLabel(anime.progress && anime.progress.status) }}</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <nav class="header-nav">
                <button class="nav-btn" id="btn-list" @click="setView('list')">List</button>
                <button class="nav-btn" id="btn-discover" @click="setView('discover')">Discover</button>
            </nav>
            <div class="header-right">
                <button id="theme-toggle" title="Changer le thème" @click="toggleTheme">🌓</button>
            </div>
        </header>
        <div v-if="currentView === 'home'">
            <h2>Bienvenue sur Anime Tracker !</h2>
            <p>Utilise le menu pour gérer tes listes ou découvrir de nouveaux animes.</p>
            <div style="margin-top:32px;">
                <h3>Derniers animes visionnés</h3>
                <div style="display:flex; gap:18px; margin-bottom:24px;">
                    <div v-for="anime in lastViewedAnimes" :key="anime.id" style="text-align:center; width:120px; cursor:pointer;" @click="showAnimeDetail(anime.id)">
                        <img :src="anime.pics" :alt="anime.title" style="width:100px; height:140px; object-fit:cover; border-radius:8px; box-shadow:0 2px 8px rgba(0,0,0,0.08);" />
                        <div style="margin-top:8px; font-size:1rem; font-weight:500;">{{ anime.title }}</div>
                    </div>
                    <div v-if="lastViewedAnimes.length === 0" style="color:#888;">Aucun anime visionné récemment.</div>
                </div>
                <h3>Animes récemment ajoutés</h3>
                <div style="display:flex; gap:18px;">
                    <div v-for="anime in recentAnimes" :key="anime.id" style="text-align:center; width:120px; cursor:pointer;" @click="showAnimeDetail(anime.id)">
                        <img :src="anime.pics" :alt="anime.title" style="width:100px; height:140px; object-fit:cover; border-radius:8px; box-shadow:0 2px 8px rgba(0,0,0,0.08);" />
                        <div style="margin-top:8px; font-size:1rem; font-weight:500;">{{ anime.title }}</div>
                    </div>
                    <div v-if="recentAnimes.length === 0" style="color:#888;">Aucun anime ajouté récemment.</div>
                </div>
            </div>
        </div>
        <div v-else-if="currentView === 'list'">
            <div style="display:flex; gap:12px; margin-bottom:16px;">
                <button class="list-btn" @click="setView('createList')">+ Créer une liste</button>
                <button class="list-btn" @click="setView('addAnime')">+ Ajouter un anime</button>
            </div>
            <div class="list-cards">
                <div v-for="list in lists" :key="list.id" class="list-card" @click="openListDetail(list.id)" style="cursor:pointer;">
                    <span class="list-name">{{ list.name }}</span>
                </div>
            </div>
        </div>
        <div v-else-if="currentView === 'createList'">
            <div class="modal-create-list">
                <button class="list-btn" style="float:right;" @click="setView('list')">Annuler</button>
                <h2>Créer une nouvelle liste</h2>
                <div class="create-list-section">
                    <label>Nom de la liste :</label>
                    <input type="text" v-model="newListName" placeholder="Nom de la liste..." style="margin-bottom:12px;" />
                </div>
                <div class="create-list-section">
                    <label>Choisir une couleur :</label>
                    <input type="color" v-model="newListColor" style="width: 48px; height: 32px; padding: 0; border: none; background: none; cursor: pointer;" />
                </div>
                <div class="create-list-section">
                    <label>Ajouter une description :</label>
                    <textarea v-model="newListDescription" placeholder="Description de la liste..." rows="3" style="width:100%; border-radius:6px; border:1px solid #ccc; padding:8px; font-size:1rem;"></textarea>
                </div>
                <div style="margin-top:32px; text-align:center;">
                    <button class="list-btn" style="width:180px;" @click="handleCreateList">Terminer</button>
                </div>
            </div>
        </div>
        <div v-else-if="currentView === 'addAnime'">
            <div class="modal-create-list add-anime-modal">
                <button class="list-btn" style="float:right;" @click="setView('list')">Annuler</button>
                <h2>Ajouter un anime</h2>
                <div class="add-anime-layout">
                    <div class="add-anime-form">
                        <div
                            class="anilist-rate-box"
                            :class="{ 'is-warning': anilistRateInfo.lastStatus === 429 || anilistRateInfo.remaining === 0 }"
                            aria-label="Infos limite AniList"
                        >
                            <div class="anilist-rate-title">AniList API (limite)</div>
                            <div class="anilist-rate-line">
                                <template v-if="anilistRateInfo.limit !== null && anilistRateInfo.remaining !== null">
                                    <strong>{{ anilistRateInfo.remaining }}</strong> restantes / {{ anilistRateInfo.limit }}
                                </template>
                                <template v-else>
                                    <strong>—</strong> (fais une requête AniList)
                                </template>
                            </div>
                            <div v-if="anilistRateInfo.resetAt" class="anilist-rate-line">Reset ~ {{ anilistRateInfo.resetInSec }}s</div>
                            <div v-else-if="anilistRateInfo.retryAfterSec" class="anilist-rate-line">Retry-After: {{ anilistRateInfo.retryAfterSec }}s</div>
                            <div v-if="anilistRateInfo.lastStatus" class="anilist-rate-line">Dernier status: {{ anilistRateInfo.lastStatus }}</div>
                            <div v-if="anilistRateInfo.lastError" class="anilist-rate-error">{{ anilistRateInfo.lastError }}</div>
                            <div class="anilist-rate-note">Données lues depuis les headers (X-RateLimit-* / Retry-After).</div>
                        </div>
                        <div class="create-list-section">
                            <label>Nom de l'anime :</label>
                            <div style="display:flex; gap:8px; align-items:center; position:relative;">
                                <input type="text" v-model="newAnimeName" placeholder="Nom de l'anime..." style="margin-bottom:12px; flex:1;" autocomplete="off" @focus="animeSuggestionDropdown = animeSuggestions.length > 0" @blur="handleAnimeInputBlur" />
                                <button class="list-btn" style="padding:6px 12px;" @click.prevent="fetchAnimeInfo">🔍</button>
                                <div v-if="animeSuggestionDropdown" class="suggestion-dropdown"
                                    :style="{
                                        position: 'absolute',
                                        left: 0,
                                        right: 0,
                                        top: '38px',
                                        zIndex: 20,
                                        background: isDarkTheme ? '#23272a' : '#fff',
                                        color: isDarkTheme ? '#f5f5f5' : '#23272a',
                                        border: '1px solid #ccc',
                                        borderRadius: '6px',
                                        boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
                                    }">
                                    <div v-if="animeSuggestionLoading" :style="{padding:'8px', color:'#888'}">Chargement...</div>
                                    <div v-else-if="animeSuggestions.length === 0" :style="{padding:'8px', color:'#888'}">Aucun résultat</div>
                                    <div v-else>
                                        <div v-for="s in animeSuggestions" :key="s.id" @mousedown.prevent="selectAnimeSuggestion(s)"
                                            :style="{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '8px',
                                                padding: '8px',
                                                cursor: 'pointer',
                                                borderBottom: '1px solid #eee',
                                                color: isDarkTheme ? '#f5f5f5' : '#23272a',
                                                background: 'transparent'
                                            }">
                                            <img :src="s.coverImage.medium" alt="cover" style="width:36px; height:36px; object-fit:cover; border-radius:4px;" />
                                            <span>{{ s.title.romaji }}</span>
                                        </div>
                                    </div>
                                </div>
                                <img v-if="animeSuggestionSelected && animeSuggestionSelected.image" :src="animeSuggestionSelected.image" alt="cover" style="width:48px; height:48px; object-fit:cover; border-radius:6px; margin-left:12px;" />
                            </div>
                            <div v-if="doublonCount > 0" style="color:#d9534f; font-size:0.95em; margin-top:2px;">{{ doublonCount }} doublon{{ doublonCount > 1 ? 's' : '' }} trouvé{{ doublonCount > 1 ? 's' : '' }}</div>
                        </div>
                        <div class="create-list-section">
                            <label>Liste :</label>
                            <select v-model="newAnimeListId" style="margin-bottom:12px; width:100%; padding:8px; border-radius:6px; border:1px solid #ccc;">
                                <option v-for="list in lists" :key="list.id" :value="list.id">{{ list.name }}</option>
                            </select>
                        </div>
                        <div class="create-list-section">
                            <label>Progression (facultatif) :</label>
                            <div style="display:flex; gap:8px; align-items:center;">
                                <input type="text" v-model="newAnimeSeason" inputmode="decimal" placeholder="Saison" style="width:70px;" />
                                <input type="number" v-model="newAnimeEpisode" min="1" placeholder="Épisode" style="width:90px;" />
                                <input type="number" v-model="newAnimeMinute" min="0" placeholder="Minute" style="width:90px;" />
                            </div>
                        </div>
                        <div class="create-list-section">
                            <label>Statut (visionnage) :</label>
                            <div style="display:flex; flex-wrap:wrap; gap:6px;">
                                <button
                                    v-for="opt in progressStatusOptions"
                                    :key="opt.value"
                                    type="button"
                                    @click="newAnimeProgressStatus = opt.value"
                                    :style="{
                                        padding: '6px 10px',
                                        borderRadius: '999px',
                                        border: '1px solid ' + (newAnimeProgressStatus === opt.value ? '#4f8cff' : '#ccc'),
                                        background: newAnimeProgressStatus === opt.value ? '#4f8cff' : (isDarkTheme ? '#23272a' : '#fff'),
                                        color: newAnimeProgressStatus === opt.value ? '#fff' : (isDarkTheme ? '#f5f5f5' : '#23272a'),
                                        cursor: 'pointer',
                                        fontSize: '0.95rem'
                                    }"
                                >
                                    {{ opt.label }}
                                </button>
                            </div>
                        </div>
                        <!-- Bloc info sur l'anime -->
                        <div :style="{
                            margin: '24px 0 0 0',
                            padding: '16px',
                            background: isDarkTheme ? '#23272a' : '#f7f7f7',
                            borderRadius: '8px',
                            border: '1px solid #eee',
                            color: isDarkTheme ? '#f5f5f5' : '#23272a'
                        }">
                            <h3 style="margin-top:0; margin-bottom:12px; font-size:1.15rem; font-weight:600;">info sur l'anime</h3>
                            <div>id_anilist: <input type="text" v-model="animeFields.id_anilist" style="width:90%;" /></div>
                            <div>title: <input type="text" v-model="animeFields.title" style="width:90%;" /></div>
                            <div>title_romaji: <input type="text" v-model="animeFields.title_romaji" style="width:90%;" /></div>
                            <div>episodes: <input type="text" v-model="animeFields.episodes" style="width:90%;" /></div>
                            <div>status: <input type="text" v-model="animeFields.status" style="width:90%;" /></div>
                            <div>star: <input type="text" v-model="animeFields.star" style="width:90%;" /></div>
                            <div>tags: <input type="text" v-model="animeFields.tags" style="width:90%;" /></div>
                            <div>pics: <input type="text" v-model="animeFields.pics" style="width:90%;" /></div>
                            <div>description: <input type="text" v-model="animeFields.description" style="width:90%;" /></div>
                            <div>autres : <input type="text" v-model="animeFields.other1" style="width:90%;" placeholder="Notes, liens, etc..." /></div>
                        </div>
                        <div style="margin-top:32px; text-align:center;">
                            <button class="list-btn" style="width:180px;" @click="handleAddAnime">Valider</button>
                        </div>
                    </div>
                    <div
                        v-if="(animeFields && animeFields.pics) || (animeSuggestionSelected && animeSuggestionSelected.image)"
                        class="add-anime-preview"
                        aria-label="Aperçu de l'anime"
                    >
                        <img
                            class="add-anime-cover"
                            :src="(animeFields && animeFields.pics) ? animeFields.pics : animeSuggestionSelected.image"
                            :alt="(animeFields && animeFields.title) ? animeFields.title : (animeSuggestionSelected ? animeSuggestionSelected.title : 'cover')"
                        />
                    </div>
                </div>
            </div>
        </div>
        <div v-else-if="currentView === 'listDetail' && currentListDetail">
            <div class="list-detail-header" style="margin-bottom:24px;">
                <h2>{{ currentListDetail.name }}</h2>
                <p>{{ currentListDetail.description }}</p>
                <button class="list-btn" style="float:right;" @click="setView('list')">Retour</button>
                <button class="list-btn" style="float:right; margin-right:10px; background:#e74c3c;" @click="confirmDeleteCurrentList">Supprimer</button>
            </div>
            <div class="list-detail-searchbar" style="margin-bottom:16px; display:flex; gap:12px; align-items:center;">
                <input type="text" v-model="listSearch" placeholder="Rechercher un anime..." style="width:220px; padding:6px 10px; border-radius:6px; border:1px solid #ccc; font-size:1rem;" />
                <select v-model="listSort" style="padding:6px 10px; border-radius:6px; border:1px solid #ccc; font-size:1rem;">
                    <option value="lastview">Vu récemment</option>
                    <option value="oldview">Vu il y a longtemps</option>
                    <option value="alpha">Ordre alphabétique (A→Z)</option>
                    <option value="alpha_desc">Ordre alphabétique (Z→A)</option>
                    <option value="rated_overall_high">Note internet (↓)</option>
                    <option value="rated_overall_low">Note internet (↑)</option>
                    <option value="rated_personal_high">Ma note (↓)</option>
                    <option value="rated_personal_low">Ma note (↑)</option>
                    <option value="episodes_most">Plus d’épisodes</option>
                    <option value="near_completion">Proche de la fin</option>
                </select>
                <button class="list-btn" type="button" @click="toggleListAdvanced" :style="{ background: listAdvancedOpen ? '#4f8cff' : undefined }">
                    Recherche avancée
                </button>
                <button v-if="listSearch || (listStatusFilters && listStatusFilters.length)" class="list-btn" type="button" @click="clearListFilters" style="background:#eee; color:#222;">
                    Reset
                </button>
            </div>

            <div v-if="listAdvancedOpen" :style="{
                marginBottom: '16px',
                padding: '12px',
                borderRadius: '10px',
                border: '1px solid ' + (isDarkTheme ? '#2f3438' : '#ddd'),
                background: isDarkTheme ? '#23272a' : '#fafafa',
                color: isDarkTheme ? '#f5f5f5' : '#23272a'
            }">
                <div style="font-weight:600; margin-bottom:8px;">Filtres</div>
                <div style="font-size:0.95rem; color:#888; margin-bottom:10px;">
                    Statut (progress)
                </div>
                <div style="display:flex; flex-wrap:wrap; gap:6px;">
                    <button
                        v-for="opt in progressStatusOptions"
                        :key="'list-filter-' + opt.value"
                        type="button"
                        @click="toggleListStatusFilter(opt.value)"
                        :style="{
                            padding: '6px 10px',
                            borderRadius: '999px',
                            border: '1px solid ' + (listStatusFilters.includes(opt.value) ? '#4f8cff' : (isDarkTheme ? '#3a3f44' : '#ccc')),
                            background: listStatusFilters.includes(opt.value) ? '#4f8cff' : (isDarkTheme ? '#1f2326' : '#fff'),
                            color: listStatusFilters.includes(opt.value) ? '#fff' : (isDarkTheme ? '#f5f5f5' : '#23272a'),
                            cursor: 'pointer',
                            fontSize: '0.95rem'
                        }"
                    >
                        {{ opt.label }}
                    </button>
                </div>
            </div>
            <div class="list-detail-animes">
                <div v-if="filteredListAnimes.length === 0" style="color:#888;">Aucun anime dans cette liste.</div>
                <div v-else>
                    <div v-for="animeRef in filteredListAnimes" :key="animeRef.id" class="anime-card-rect"
                        :style="{
                            display: 'flex',
                            alignItems: 'center',
                            background: isDarkTheme ? '#23272a' : '#f5f5f5',
                            color: isDarkTheme ? '#f5f5f5' : '#23272a',
                            borderRadius: '8px',
                            marginBottom: '12px',
                            padding: '12px',
                            boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
                            cursor: 'pointer'
                        }"
                        @click="setView('animeDetail', animeRef.id, currentListDetail.id)">
                        <img :src="getAnime(animeRef.id).pics" alt="cover" style="width:100px; height:140px; object-fit:cover; border-radius:8px; margin-right:16px;" />
                        <div style="flex:1;">
                            <div style="font-size:1.2rem; font-weight:bold;">{{ getAnime(animeRef.id).title }}</div>
                            <div style="margin-top:4px; font-size:0.95rem;">
                                Épisode : {{ getAnime(animeRef.id).progress && getAnime(animeRef.id).progress.episode ? getAnime(animeRef.id).progress.episode : 0 }}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        <div v-else-if="currentView === 'animeDetail' && selectedAnimeId" class="anime-detail-view">
            <div v-if="getAnime(selectedAnimeId).id">
                <div class="anime-detail-header" style="display:flex; align-items:flex-start; gap:24px; margin-bottom:24px;">
                    <img class="anime-detail-cover" :src="getAnime(selectedAnimeId).pics" alt="cover" style="width:180px; height:260px; object-fit:cover; border-radius:12px; box-shadow:0 2px 12px rgba(0,0,0,0.10);" />
                    <div class="anime-detail-info">
                        <div style="font-size:2rem; font-weight:bold;">
                            <span v-if="!editProgressMode">{{ getAnime(selectedAnimeId).title }}</span>
                            <span v-else>
                                <input type="text" v-model="editTitle" style="width:90%; font-size:1.25rem; padding:6px 10px; border-radius:8px; border:1px solid #ccc;" />
                            </span>
                        </div>
                        <div style="font-size:1.2rem; color:#888; margin-bottom:12px;">{{ getAnime(selectedAnimeId).title_romaji }}</div>
                        <div class="anime-detail-description" style="margin-bottom:12px; color:#555;">
                            <span v-if="!editProgressMode" class="anime-detail-description-text">{{ getAnime(selectedAnimeId).description }}</span>
                            <span v-else>
                                <textarea v-model="editDescription" rows="5" style="width:92%; border-radius:8px; border:1px solid #ccc; padding:8px; font-size:1rem;"></textarea>
                            </span>
                        </div>
                        <div style="margin-bottom:12px;">
                            <span style="font-weight:600; color:#888;">Statut :</span>
                            <span v-if="!editProgressMode">{{ progressStatusLabel(getAnime(selectedAnimeId).progress && getAnime(selectedAnimeId).progress.status) }}</span>
                            <span v-else>
                                <div style="display:flex; flex-wrap:wrap; gap:6px; margin-top:6px;">
                                    <button
                                        v-for="opt in progressStatusOptions"
                                        :key="opt.value"
                                        type="button"
                                        @click="editProgressStatus = opt.value"
                                        :style="{
                                            padding: '6px 10px',
                                            borderRadius: '999px',
                                            border: '1px solid ' + (editProgressStatus === opt.value ? '#4f8cff' : '#ccc'),
                                            background: editProgressStatus === opt.value ? '#4f8cff' : (isDarkTheme ? '#23272a' : '#fff'),
                                            color: editProgressStatus === opt.value ? '#fff' : (isDarkTheme ? '#f5f5f5' : '#23272a'),
                                            cursor: 'pointer',
                                            fontSize: '0.95rem'
                                        }"
                                    >
                                        {{ opt.label }}
                                    </button>
                                </div>
                            </span>
                        </div>
                        <div style="margin-bottom:12px;">
                            <span style="font-weight:600; color:#888;">Saison :</span>
                            <span v-if="!editProgressMode">{{ (typeof getAnime(selectedAnimeId).season !== 'undefined' && getAnime(selectedAnimeId).season !== null && getAnime(selectedAnimeId).season !== '') ? getAnime(selectedAnimeId).season : 1 }}</span>
                            <span v-else>
                                <input type="text" v-model="editSeasonInput" inputmode="decimal" style="width:90px;" placeholder="1 / 2,5" />
                            </span>
                        </div>
                        <div style="margin-bottom:12px;">
                            <span style="font-weight:600; color:#888;">Autres :</span>
                            <span v-if="!editProgressMode">{{ (getAnime(selectedAnimeId).progress && typeof getAnime(selectedAnimeId).progress.other1 !== 'undefined') ? getAnime(selectedAnimeId).progress.other1 : (getAnime(selectedAnimeId).other1 || '') }}</span>
                            <span v-else>
                                <input type="text" v-model="editOther1" style="width:80%;" placeholder="Notes, liens, etc..." />
                            </span>
                        </div>
                        <div style="margin-bottom:8px;">
                            <span v-for="tag in getAnime(selectedAnimeId).tags" :key="tag" style="display:inline-block; background:#e0e7ff; color:#2d3a5a; border-radius:6px; padding:2px 10px; margin-right:6px; font-size:0.95rem;">{{ tag }}</span>
                        </div>
                        <div style="margin-bottom:8px; font-size:1.1rem;">⭐ Internet : {{ getAnime(selectedAnimeId).star }} / 5</div>
                        <div style="margin-bottom:10px; font-size:1.05rem;">
                            <span style="font-weight:600; color:#888;">Ma note :</span>
                            <span v-if="!editMyStarMode" style="margin-left:6px;">
                                {{ formatMyStar(getAnime(selectedAnimeId).my_star) }} / 5
                                <span @click="startEditMyStar" style="color:#4f8cff; cursor:pointer; margin-left:10px; font-size:0.98rem;">noter</span>
                            </span>
                            <span v-else style="margin-left:6px;">
                                <input type="number" v-model.number="editMyStarValue" min="0" max="5" step="0.5" style="width:80px;" placeholder="/5" />
                                <span style="color:#888; margin-left:4px;">/ 5</span>
                                <button class="list-btn" style="margin-left:8px;" @click="saveEditMyStar">OK</button>
                                <button class="list-btn" style="margin-left:4px; background:#eee; color:#222;" @click="cancelEditMyStar">Annuler</button>
                            </span>
                        </div>
                        <div style="margin-bottom:8px; font-size:1.1rem;">
                            Progression :
                            <span v-if="!editProgressMode">
                                Épisode {{ getAnime(selectedAnimeId).progress && getAnime(selectedAnimeId).progress.episode ? getAnime(selectedAnimeId).progress.episode : 0 }} / {{ getAnime(selectedAnimeId).episodes }} (minute {{ getAnime(selectedAnimeId).progress && getAnime(selectedAnimeId).progress.minute ? getAnime(selectedAnimeId).progress.minute : 0 }})
                                <span @click="startEditProgress" style="color:#4f8cff; cursor:pointer; margin-left:12px; font-size:0.98rem;">éditer</span>
                            </span>
                            <span v-else>
                                <input type="number" v-model.number="editProgressEpisode" min="0" style="width:60px;" /> / {{ getAnime(selectedAnimeId).episodes }}
                                (minute <input type="number" v-model.number="editProgressMinute" min="0" style="width:60px;" />)
                                <button class="list-btn" style="margin-left:8px;" @click="saveEditProgress">OK</button>
                                <button class="list-btn" style="margin-left:4px; background:#eee; color:#222;" @click="cancelEditProgress">Annuler</button>
                            </span>
                        </div>
                        <div style="margin-bottom:8px; font-size:1.05rem; color:#888;">
                            Dernière vue : <span style="font-weight:600; color:#222;">{{ formatLastView(getAnime(selectedAnimeId).last_view) }}</span>
                        </div>
                        <button v-if="previousListId" class="list-btn" @click="setView('listDetail', null, previousListId)">Retour à la liste</button>
                        <button v-else class="list-btn" @click="goHome">Retour accueil</button>
                        <button class="list-btn" style="margin-left:10px; background:#e74c3c;" @click="confirmDeleteAnime">Supprimer</button>
                    </div>
                </div>
            </div>
            <div v-else style="color:#888;">Anime introuvable.</div>
        </div>
        <div v-else-if="currentView === 'discover'">
            <div v-if="search && searchResults.length">
                <h2>Résultats AniList</h2>
                <div class="anime-list">
                    <div v-for="anime in searchResults" :key="anime.id" class="anime-card">
                        <img :src="anime.coverImage.medium" alt="cover" style="height:100px;" />
                        <div><strong>{{ anime.title.romaji }}</strong></div>
                        <div>Épisodes : {{ anime.episodes }}</div>
                        <button class="list-btn" style="margin-top:8px;">Ajouter à ma liste</button>
                    </div>
                </div>
            </div>
            <div v-else>
                <h2>Découvrir des animes</h2>
                <p>Utilise la barre de recherche pour explorer AniList.</p>
            </div>
        </div>
        <!-- Modale de confirmation (suppression sécurisée) -->
        <div v-if="confirmOpen" class="confirm-overlay" @click.self="cancelConfirmDelete">
            <div class="confirm-modal" role="dialog" aria-modal="true">
                <div class="confirm-modal-header">
                    <div class="confirm-modal-title">Suppression - confirmation requise</div>
                    <button class="list-btn btn-ghost" type="button" @click="cancelConfirmDelete">X</button>
                </div>
                <div class="confirm-modal-body">
                    <div style="margin-bottom:6px;">
                        Tu es sur le point de supprimer : <strong>{{ confirmName }}</strong>
                    </div>
                    <div v-if="confirmMessage" class="confirm-danger-note">{{ confirmMessage }}</div>

                    <div style="margin-top:10px; font-size:0.95rem; color:#888;">
                        Tape exactement : <strong>{{ confirmExpected }}</strong>
                    </div>
                    <input class="confirm-input" type="text" v-model="confirmInput" :placeholder="confirmExpected" />

                    <label class="confirm-check">
                        <input type="checkbox" v-model="confirmSure" />
                        <span>Je suis sûr de ce que je fais (action irréversible).</span>
                    </label>

                    <label v-if="confirmKind === 'list' && confirmAllowDeleteAnimes" class="confirm-check">
                        <input type="checkbox" v-model="confirmDeleteAnimes" />
                        <span>Supprimer aussi les animes de cette liste (ils seront retirés de toutes les listes).</span>
                    </label>
                </div>
                <div class="confirm-modal-actions">
                    <button class="list-btn btn-ghost" type="button" @click="cancelConfirmDelete">Annuler</button>
                    <button class="list-btn btn-danger" type="button" :disabled="!isConfirmReady() || loading" @click="applyConfirmDelete">Supprimer</button>
                </div>
            </div>
        </div>

        <div v-if="loading">Chargement...</div>
        <div v-if="error" style="color:red">{{ error }}</div>
    </div>
    `
});
