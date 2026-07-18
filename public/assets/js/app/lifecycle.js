// app/lifecycle.js - Hooks du cycle de vie
function getLifecycleHooks() {
    return {
        mounted() {
            this.fetchAnimes();
            this.fetchLists();
            // Initialisation du thème au montage
            document.documentElement.setAttribute('data-theme', localStorage.getItem('theme') || 'light');

            // Tick simple pour rafraîchir l'info de limite AniList (compte à rebours)
            window.setInterval(() => {
                this.anilistRateTick = (this.anilistRateTick + 1) % 1_000_000;
            }, 1000);
        }
    };
}
