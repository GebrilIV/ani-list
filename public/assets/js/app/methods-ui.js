// app/methods-ui.js - Méthodes de navigation et interface utilisateur
function getUIMethods() {
    return {
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
        formatLastView(ts) { // Formater la dernière vue
            if (!ts) return 'Jamais';
            const d = new Date(ts * 1000);
            return d.toLocaleDateString('fr-FR') + ' ' + d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
        },
        showAnimeDetail(id) { // Afficher les détails d'un anime
            // Utilise setView pour garder un comportement cohérent (ex: retour)
            const fromListId = (this.currentView === 'listDetail' && this.listDetailId) ? this.listDetailId : null;
            this.setView('animeDetail', id, fromListId);
        },
    };
}
