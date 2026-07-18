// app/methods-crud.js - Méthodes CRUD (créer, lire, modifier, supprimer)
function getCRUDMethods() {
    return {
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
        getAnime(id) { // Obtenir un anime par ID
            const anime = this.animes.find(a => a.id === id) || {};
            // Supprime last_view dans progress si présent
            if (anime.progress && typeof anime.progress.last_view !== 'undefined') {
                delete anime.progress.last_view;
            }
            return anime;
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
    };
}
