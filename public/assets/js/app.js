// Vue.js app entry point
const app = new Vue({
    el: '#app',
    data: {
        currentView: 'home', // Vue actuelle ('home', 'list', 'discover')
        animes: [], // Liste des animes
        search: '', // Barre de recherche
        searchResults: [], // Résultats de recherche AniList
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
        listSort: 'lastview', // Tri des listes ('lastview', 'alpha')
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
        // Note perso
        editMyStarMode: false, // Mode édition note perso
        editMyStarValue: null, // Valeur note perso
        editOther1: '', // Édition champ libre
    },
    computed: {
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
            } else if (this.listSort === 'lastview') {
                arr = arr.slice().sort((a, b) => (b.last_view || 0) - (a.last_view || 0));
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
                    season: this.newAnimeSeason ? parseInt(this.newAnimeSeason) : 1,
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
        async fetchAnimeSuggestions() { // Suggestions d'animes
            const q = this.newAnimeName.trim();
            if (q.length < 2) { this.animeSuggestions = []; this.animeSuggestionDropdown = false; return; }
            this.animeSuggestionLoading = true;
            this.animeSuggestionError = '';
            try {
                const query = `query ($search: String) { Page(perPage: 6) { media(search: $search, type: ANIME) { id title { romaji } coverImage { medium } } } }`;
                const variables = { search: q };
                const res = await fetch('https://graphql.anilist.co', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
                    body: JSON.stringify({ query, variables })
                });
                const json = await res.json();
                this.animeSuggestions = (json.data && json.data.Page && json.data.Page.media) ? json.data.Page.media : [];
                this.animeSuggestionDropdown = this.animeSuggestions.length > 0;
            } catch (e) {
                this.animeSuggestionError = 'Erreur AniList';
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
                const res = await fetch('https://graphql.anilist.co', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
                    body: JSON.stringify({ query, variables })
                });
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
                if (!this.animes[idx].progress) this.animes[idx].progress = {};
                this.animes[idx].progress.episode = this.editProgressEpisode;
                this.animes[idx].progress.minute = this.editProgressMinute;
                this.animes[idx].progress.other1 = this.editOther1;
                this.animes[idx].progress.status = this.editProgressStatus;
                this.animes[idx].title = this.editTitle;
                this.animes[idx].description = this.editDescription;
                // Met à jour last_view avec la date/heure/minute actuelle
                this.animes[idx].last_view = Math.floor(Date.now() / 1000);
                // Enregistre dans data.json via l'API PATCH
                try {
                    await patchAnime(this.selectedAnimeId, {
                        title: this.editTitle,
                        description: this.editDescription,
                        progress: {
                            episode: this.editProgressEpisode,
                            minute: this.editProgressMinute,
                            other1: this.editOther1,
                            status: this.editProgressStatus,
                        },
                        last_view: this.animes[idx].last_view
                    });
                    // Recharge la liste des animes pour être sûr
                    await this.fetchAnimes();
                } catch (e) {
                    this.error = 'Erreur lors de la sauvegarde de la progression';
                }
            }
            this.editProgressMode = false;
        },
        showAnimeDetail(id) { // Afficher les détails d'un anime
            this.selectedAnimeId = id;
            this.currentView = 'animeDetail';
        }
    },
    watch: {
        search(val) {
            if (val.length > 1) this.searchAniList();
            else this.searchResults = [];
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
    },
    template: `
    <div>
        <header class="main-header">
            <div class="header-left">
                <img src="assets/css/logo1.png" alt="Logo" class="logo-minimal" @click="goHome" style="cursor:pointer;" />
                <span class="header-title" @click="goHome" style="cursor:pointer;">Anime list</span>
                <input id="header-search" type="text" placeholder="Rechercher..." />
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
            <div class="modal-create-list">
                <button class="list-btn" style="float:right;" @click="setView('list')">Annuler</button>
                <h2>Ajouter un anime</h2>
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
                        <input type="number" v-model="newAnimeSeason" min="1" placeholder="Saison" style="width:70px;" />
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
        </div>
        <div v-else-if="currentView === 'listDetail' && currentListDetail">
            <div class="list-detail-header" style="margin-bottom:24px;">
                <h2>{{ currentListDetail.name }}</h2>
                <p>{{ currentListDetail.description }}</p>
                <button class="list-btn" style="float:right;" @click="setView('list')">Retour</button>
            </div>
            <div class="list-detail-searchbar" style="margin-bottom:16px; display:flex; gap:12px; align-items:center;">
                <input type="text" v-model="listSearch" placeholder="Rechercher un anime..." style="width:220px; padding:6px 10px; border-radius:6px; border:1px solid #ccc; font-size:1rem;" />
                <select v-model="listSort" style="padding:6px 10px; border-radius:6px; border:1px solid #ccc; font-size:1rem;">
                    <option value="lastview">Dernier vu</option>
                    <option value="alpha">Ordre alphabétique</option>
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
        <div v-else-if="currentView === 'animeDetail' && selectedAnimeId">
            <div v-if="getAnime(selectedAnimeId).id">
                <div style="display:flex; align-items:flex-start; gap:24px; margin-bottom:24px;">
                    <img :src="getAnime(selectedAnimeId).pics" alt="cover" style="width:180px; height:260px; object-fit:cover; border-radius:12px; box-shadow:0 2px 12px rgba(0,0,0,0.10);" />
                    <div>
                        <div style="font-size:2rem; font-weight:bold;">
                            <span v-if="!editProgressMode">{{ getAnime(selectedAnimeId).title }}</span>
                            <span v-else>
                                <input type="text" v-model="editTitle" style="width:90%; font-size:1.25rem; padding:6px 10px; border-radius:8px; border:1px solid #ccc;" />
                            </span>
                        </div>
                        <div style="font-size:1.2rem; color:#888; margin-bottom:12px;">{{ getAnime(selectedAnimeId).title_romaji }}</div>
                        <div style="margin-bottom:12px; color:#555;">
                            <span v-if="!editProgressMode">{{ getAnime(selectedAnimeId).description }}</span>
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
                        <button class="list-btn" @click="setView('listDetail', null, previousListId)">Retour à la liste</button>
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
        <div v-if="loading">Chargement...</div>
        <div v-if="error" style="color:red">{{ error }}</div>
    </div>
    `
});
