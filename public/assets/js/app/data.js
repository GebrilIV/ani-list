// app/data.js - État initial et configuration
function getInitialData() {
    return {
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
    };
}
