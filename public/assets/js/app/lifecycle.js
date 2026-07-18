// app/lifecycle.js - Hooks du cycle de vie
function getLifecycleHooks() {
    return {
        async mounted() {
            // Initialiser l'API manager
            if (typeof ApiManager !== 'undefined') {
                await ApiManager.init();
                // Charger les providers dans le data
                this.availableProviders = ApiManager.getProviders();
                this.selectedApiProvider = ApiManager.getCurrentProvider();
            }
            
            this.fetchAnimes();
            this.fetchLists();
            // Initialisation du thème au montage
            document.documentElement.setAttribute('data-theme', localStorage.getItem('theme') || 'light');

            // Tick simple pour rafraîchir les infos de limite (compte à rebours)
            window.setInterval(() => {
                this.apiRateTick = (this.apiRateTick + 1) % 1_000_000;
                this.anilistRateTick = (this.anilistRateTick + 1) % 1_000_000;
            }, 1000);
        }
    };
}
