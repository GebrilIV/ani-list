// app/watchers.js - Observateurs (watchers)
function getWatchers() {
    return {
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
    };
}
