// app/methods-edit.js - Méthodes d'édition (progression, note, suppression)
function getEditMethods() {
    return {
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
        cancelEditProgress() { // Annuler l'édition de la progression
            this.editProgressMode = false;
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
    };
}
