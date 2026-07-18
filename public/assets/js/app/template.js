// app/template.js - Template Vue.js
function getTemplate() {
    return `
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
                    <option value="episodes_most">Plus d'épisodes</option>
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
    `;
}
