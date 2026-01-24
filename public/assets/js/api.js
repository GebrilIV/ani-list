// Fonctions pour appels backend
const API_BASE = '';

async function fetchAnimeList() {
    const res = await fetch(`${API_BASE}/anime`);
    return res.json();
}

// Créer une nouvelle liste
async function createList({ name, color, description }) {
    const res = await fetch(`${API_BASE}/lists`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, color, description })
    });
    if (!res.ok) throw new Error('Erreur lors de la création de la liste');
    return res.json();
}

// Ajouter un anime
async function addAnime(animeData) {
    const res = await fetch(`${API_BASE}/anime`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(animeData)
    });
    if (!res.ok) throw new Error('Erreur lors de l\'ajout de l\'anime');
    return res.json();
}

// Mettre à jour la progression d'un anime
async function updateAnimeProgress(id, progress) {
    const res = await fetch(`${API_BASE}/anime/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ progress })
    });
    if (!res.ok) throw new Error('Erreur lors de la mise à jour de la progression');
    return res.json();
}

// Mettre à jour un anime (titre, description, progress, etc.)
async function patchAnime(id, payload) {
    const res = await fetch(`${API_BASE}/anime/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error('Erreur lors de la mise à jour de l\'anime');
    return res.json();
}
