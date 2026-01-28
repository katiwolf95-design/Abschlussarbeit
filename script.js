// ==========================
// STATE & DOM ELEMENTE
// ==========================

//Formular & Eingabe
const ingredientForm = document.getElementById('ingredientForm');
const ingredientInput = document.getElementById('ingredientInput');
const ingredientList = document.getElementById('ingredientList');

//Button & Container
const searchRecipesButton = document.getElementById('searchRecipesButton');
const recipeResults = document.getElementById('recipeResults');

//Modal-Elemente
const modalImage = document.getElementById('modalImage');
const modalTitle = document.getElementById('modalTitle');
const modalIngredients = document.getElementById('modalIngredients');
const modalInstructions = document.getElementById('modalInstructions');

// Globaler Zustand – Speichert alle vom Nutzer eingegebenen Zutaten
let ingredients = [];

//API Key
const API_KEY = "f90a19952d71418697b679100605c25b";

//Bootstrap Modal
const recipeModal = new bootstrap.Modal(
    document.getElementById('recipeModal'));


// ==========================
// FAVORITEN (LocalStorage)
// ==========================

function getFavorites() {
    return JSON.parse(localStorage.getItem("favorites")) || [];
}

function toggleFavorite(recipe) {
    const favorites = getFavorites();
    const exists = favorites.find(r => r.id === recipe.id);

    const updated = exists
        ? favorites.filter(r => r.id !== recipe.id)
        : [...favorites, recipe];
    
    localStorage.setItem("favorites", JSON.stringify(updated));
}

function isFavorite(recipeId) {
    const favorites = getFavorites();
    return favorites.some(r => r.id === recipeId);
}

//Favoriten zeigen
function showFavorites() {
    const favorites = getFavorites();

    if (favorites.length === 0) {
        recipeResults.innerHTML = `
            <p class="text-center text-muted">
                Noch keine Favoriten gespeichert.
            </p>
        `;
        return;
    }

    displayRecipesWithMatches(favorites);
    recipeResults.scrollIntoView({ behavior: "smooth" });
}

//Favoritenzähler aktualisieren
function updateFavCount() {
    document.getElementById('favCount').textContent = getFavorites().length;
}



// ==========================
// ZUTATEN-LOGIK
// (Hinzufügen, Entfernen, Vorschläge)
// ==========================

//Zutaten Vorschlagliste (statisch)
const ingredientSuggestions = [
    "Tomate",
    "Käse",
    "Brot",
    "Ei",
    "Milch",
    "Öl",
    "Butter",
    "Salz",
    "Pfeffer",
    "Zucker",
    "Mehl",
    "Reis",
    "Nudeln",
    "Zwiebel",
    "Knoblauch",
    "Kartoffeln",
    "Gurke",
    "Apfel",
    "Banane",
    "Orange",
    "Birne",
    "Trauben",
    "Zitrone",
    "Limette",
    "Brokkoli",
    "Blumenkohl",
    "Spinat",
    "Pilze",
    "Mais",
    "Erbsen",
    "Linsen",
    "Kichererbsen",
    "Karotten",
    "Paprika",
    "Salat",
    "Joghurt",
    "Creme Fraiche",
    "Hähnchen",
    "Rindfleisch",
    "Fisch",
    "Schinken",
    "Hackfleisch",
    "Hähnchenbrust",
    "Hähnchen", 
    "Karotte",
    "Putenfleisch",
    "Weißkohl",
    "Zucchini",
    "Aubergine",
    "Fetakäse",
    "Pute",
    "Putenbrust",
    "Frischkäse",
    "Mozzarella",
    "Parmesan"
];

// Formular absenden - Zutat hinzufügen
ingredientForm.addEventListener('submit', function(event) {
    event.preventDefault();
    
    const ingredient = ingredientInput.value.trim().toLowerCase();

    if (ingredient === '') {return;}

    if (ingredients.includes(ingredient)) {
        alert("Diese Zutat wurde bereits hinzugefügt.");
        ingredientInput.value = '';
        ingredientInput.focus();
        return;
    }

    ingredients.push(ingredient);
    ingredientInput.value = '';

    updateIngredientList();
    ingredientInput.focus();            /** Nach jeder abgeschlossenen Nutzeraktion wird der Fokus bewusst zurück 
                                        * in das Eingabefeld gesetzt, um eine flüssige Mehrfacheingabe zu ermöglichen. */
});

//Vorschläge beim Tippen anzeigen
const suggestionsList = document.getElementById('ingredientSuggestions');

//Keyboard-Navigation für Vorschläge
let activeSuggestionsIndex = -1;

//Zeigt passende Zutatenvorschläge während der Eingabe an
ingredientInput.addEventListener('input', function() {
    const value = ingredientInput.value.toLowerCase().trim();
    suggestionsList.innerHTML = '';
    activeSuggestionsIndex = -1;

    if (value.length < 2) return;

    const matches = ingredientSuggestions.filter(function (item) {
        return item.toLowerCase().startsWith(value);
    });

    matches.forEach(function (match) {
        const listItem = document.createElement('li');
        listItem.className = "list-group-item list-group-item-action";
        listItem.textContent = match;

        listItem.addEventListener('click', function() {
            addIngredientFromSuggestion(match); 
        });

        suggestionsList.appendChild(listItem);
        });
});

ingredientInput.addEventListener('keydown', function (event) {
    const items = suggestionsList.querySelectorAll('li');
    if (items.length === 0) return;

    if (event.key === "ArrowDown") {
        event.preventDefault();
        activeSuggestionsIndex =
            (activeSuggestionsIndex + 1) % items.length;
    }

    if (event.key === "ArrowUp") {
        event.preventDefault();
        activeSuggestionsIndex =
            (activeSuggestionsIndex - 1 + items.length) % items.length;
    }

    if (event.key === "Enter" && activeSuggestionsIndex >= 0) {
        event.preventDefault();
        items [activeSuggestionsIndex].click();
        activeSuggestionsIndex = -1;
        return;
    }

    items.forEach((item, index) => {
        item.classList.toggle(
            "active",
            index == activeSuggestionsIndex
        );
    });
});


// ==========================
// UI-HILFSFUNKTIONEN
// ==========================

// Zeigt einen Ladeindikator währed des API-Requests
function showLoading() {
    recipeResults.innerHTML = `
        <div class="text-center my-4">
            <div class="spinner-border" role="statue"></div>
            <p class="mt-2">Rezepte werden geladen...</p>
        </div>
    `;
}       /** Diese Funktion ist eine reine UI-Hilfsfunktion und zeigt dem Nutzer, 
         * dass da gerade was passiert */
        

//Zutat aus Vorschlag übernehmen
function addIngredientFromSuggestion(ingredient) {
    ingredient = ingredient.toLowerCase();

    if (ingredients.includes(ingredient)) {
        alert("Diese Zutat wurde bereits hinzugefügt.");
        ingredientInput.value = '';
        suggestionsList.innerHTML = '';
        return;
    }

    ingredients.push(ingredient);
    ingredientInput.value = '';
    suggestionsList.innerHTML = '';

    updateIngredientList();
    ingredientInput.focus();        //Führt wieder in das Eingabefeld
}                       //Beim Anklicken eines Vorschlag wird die Zutat direkt übernommen und die Eingabe geleert.

//ZutatenListe aktualisieren
function updateIngredientList() {
    ingredientList.innerHTML = '';

    clearAllBtn.style.display = ingredients.length > 0 ? 'block' : 'none';

    ingredients.forEach(function(ingredient, index) {
        const listItem = document.createElement('li');
        listItem.className = "list-group-item d-flex justify-content-between align-items-center";
        listItem.textContent = ingredient;

        const removeButton = document.createElement('button');
        removeButton.className = "btn btn-sm btn-outline-danger";
        removeButton.innerHTML = '&times;';
        removeButton.setAttribute('aria-label', 'Zutat entfernen');

        removeButton.addEventListener('click', function() {
            removeIngredient(index);
        });

        listItem.appendChild(removeButton);
        ingredientList.appendChild(listItem);
    });
}

//Entfernt eine Zutat aus dem Array und rendert neu
function removeIngredient(index) {
    ingredients.splice(index, 1);
    updateIngredientList();
    ingredientInput.focus();
}

//"Alle Zutaten löschen" Button
const clearAllBtn = document.getElementById("clearAllBtn");

clearAllBtn.addEventListener("click", function() {
    ingredients = [];
    updateIngredientList();
    clearAllBtn.style.display = "none";
});

// ==========================
// API-KOMMUNIKATION (Spoonacular)
// ==========================

/**
 * Lädt passende Rezepte von der Spoonacular API
 * basierend auf den eingegebenen Zutaten.
 */
async function loadRecipesFromAPI() {
    const ingredientString = ingredients.join(",");

    const response = await fetch(
        `https://api.spoonacular.com/recipes/findByIngredients` +
        `?ingredients=${ingredientString}` +
        `&number=12` +
        `&ranking=1` +
        `&ignorePantry=true` +
        `&apiKey=${API_KEY}`
    );

    const data =await response.json();
    return data;
}      //Die API filtert Rezepte serverseitig anhand der Zutaten, was die Client-Logik vereinfacht.


// ==========================
// UI-RENDERING
// (Loading, Rezeptkarten, Modal)
// ==========================   

// Lädt Detailinformationen zu einem Rezept und öffnet das Modal
async function loadRecipeDetails(recipeId) {
    const response = await fetch(
        `https://api.spoonacular.com/recipes/${recipeId}/information?apiKey=${API_KEY}`
    );

    const recipe = await response.json();

    modalTitle.textContent = recipe.title;
    modalImage.src = recipe.image;
    modalInstructions.innerHTML = recipe.instructions || "Keine Anleitung verfügbar.";

    modalIngredients.innerHTML = '';
    recipe.extendedIngredients.forEach(item => {
        const li = document.createElement("li");
        li.textContent = item.original;
        modalIngredients.appendChild(li);
    });

    recipeModal.show();
}                           

//Suche starten
searchRecipesButton.addEventListener('click', async () => {

    //Grundzutaten zu imgredients hinzufügen
    const baseIngredients = document.querySelectorAll('.form-check-input:checked');

    baseIngredients.forEach(checkbox => {
        const ingredient = checkbox.value;
        if (!ingredients.includes(ingredient)) {
            ingredients.push(ingredient);
        }
    }); 

    if (ingredients.length === 0) {
        alert("Bitte füge mindestens eine Zutat hinzu.");
        return;
    }

    showLoading();

    try {
        const recipes = await loadRecipesFromAPI();
        if (recipes.length === 0) {
            recipeResults.innerHTML = `
                <p class="text-muted text-center mt-4">
                    Keine passenden Rezepte gefunden.
                </p>
            `;
            return;
        }

        displayRecipesWithMatches(recipes);
        recipeResults.scrollIntoView({behavior: "smooth"});     //So wird der Nutzer automatisch zu den Ergebnissen geführt
        
    } catch (error) {
        recipeResults.innerHTML = `
            <p class="text-danger text-center mt-4">
                Fehler beim Laden der Rezepte.
            </p>
        `;
        console.error(error);
    }
});

//Erstellt dynamisch Rezeptkarten aus den API-Daten
function displayRecipesWithMatches(recipes) {
    recipeResults.innerHTML = '';

    recipes.forEach(recipe => {
        const col = document.createElement('div');
        col.className = 'col';

        col.innerHTML = `
            <div class="card h-100 position-relative">
                <button 
                    class="btn btn-sm favorite-btn position-absolute top-0 end-0 m-2
                    ${isFavorite(recipe.id) ? 'btn-danger' : 'btn-outline-danger'}"
                    title="Merken für später">
                    ♥
                </button>
                
                <img 
                    src="${recipe.image}" 
                    class="card-img-top" 
                    alt="${recipe.title}">
                
                <div class="card-body">
                    <h5 class="card-title">
                        ${recipe.title}
                    </h5>

                    <p class="card-text">
                        <strong>✅ Vorhanden (${recipe.usedIngredientCount}):</strong><br>
                        ${recipe.usedIngredients.map(i => i.name).join(', ')}
                    </p>   
                    
                    ${recipe.missedIngredientCount > 0 ? `
                        <p class="card-text text-danger">
                            <strong>❌ Fehlt (${recipe.missedIngredientCount}):</strong><br>
                            ${recipe.missedIngredients.map(i => i.name).join(', ')}
                        </p>
                    ` : ''}
        
                    <button 
                        class="btn btn-primary btn-action btn-sm">
                        Details ansehen
                    </button>   
                </div>
            </div>
        `;

        //Favoriten
        const favBtn = col.querySelector(".favorite-btn");
        
        favBtn.addEventListener("click", function (e) {
            e.stopPropagation();

            toggleFavorite(recipe);

            if (isFavorite(recipe.id)) {
            favBtn.classList.remove("btn-outline-danger");
            favBtn.classList.add("btn-danger");
            } else {
                favBtn.classList.remove("btn-danger");
                favBtn.classList.add("btn-outline-danger");
            }

            updateFavCount();
        });

        //Details
        const detailsBtn = col.querySelector(".btn-primary");

        detailsBtn.addEventListener('click', function() {
            loadRecipeDetails(recipe.id);
        });

        recipeResults.appendChild(col);
    });
}                        //Die Rezeptauswahl wurde angepasst, um die Anzahl der übereinstimmenden Zutaten anzuzeigen.

console.log("JS-Datei geladen bis hierhin");
updateFavCount();
