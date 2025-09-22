const frenchColumn = document.getElementById('frenchColumn');
const englishColumn = document.getElementById('englishColumn');
const totalMatchesSpan = document.getElementById('totalMatches');
const completedMatchesSpan = document.getElementById('completedMatches');
const remainingMatchesSpan = document.getElementById('remainingMatches');
const restartButton = document.getElementById('restartButton');

let words = [];
let unmatchedWords = [];
let selectedFrench = null;
let selectedEnglish = null;

// Allowed file types
const allowedExtensions = [".xlsx", ".xls", ".ods", ".csv", ".xlsb", ".fods"];

// File input listener
document.getElementById('fileInput').addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    const ext = file.name.slice(file.name.lastIndexOf(".")).toLowerCase();
    if (!allowedExtensions.includes(ext)) {
        alert("Invalid file type. Please upload one of the following:\n" + allowedExtensions.join(", "));
        e.target.value = ""; // reset file input
        return;
    }

    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const data = new Uint8Array(e.target.result);
            const workbook = XLSX.read(data, { type: 'array' });
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];

            const jsonData = XLSX.utils.sheet_to_json(worksheet, { defval: "" });
            words = jsonData.filter(row => row["French"] && row["English"]);
            unmatchedWords = [...words];

            if (words.length === 0) {
                alert("No valid words found. The first row must have these headers:\nFrench | English | Word Class | Pronunciation | Full Info");
                return;
            }

            updateScoreboard();
            generateCards();
        } catch (err) {
            alert("Error reading the file. Please make sure it's a valid spreadsheet.");
            console.error(err);
        }
    };
    reader.readAsArrayBuffer(file);
});

function generateCards() {
    frenchColumn.innerHTML = '';
    englishColumn.innerHTML = '';

    if (unmatchedWords.length === 0) return;

    const count = Math.min(5, unmatchedWords.length);
    const selected = [];
    const pool = [...unmatchedWords];

    while (selected.length < count) {
        const idx = Math.floor(Math.random() * pool.length);
        selected.push(pool.splice(idx, 1)[0]);
    }

    // French cards
    selected.forEach(word => {
        const card = document.createElement('div');
        card.className = 'card slide-in';
        card.dataset.french = word["French"];
        card.dataset.english = word["English"];
        card.dataset.fullinfo = word["Full Info"];
        card.dataset.wordclass = word["Word Class"];
        card.innerHTML = `<div>${word["French"]}</div><div class="pronunciation">${word["Pronunciation"]}</div>`;
        card.addEventListener('click', () => selectCard('french', card));
        frenchColumn.appendChild(card);

        requestAnimationFrame(() => card.classList.add('show'));
        card.addEventListener('animationend', () => card.classList.remove('slide-in'));
    });

    // English cards
    const englishWords = selected.map(w => w["English"]).sort(() => Math.random() - 0.5);
    englishWords.forEach(eng => {
        const card = document.createElement('div');
        card.className = 'card slide-in';
        card.dataset.english = eng;
        card.textContent = eng;
        card.addEventListener('click', () => selectCard('english', card));
        englishColumn.appendChild(card);

        requestAnimationFrame(() => card.classList.add('show'));
        card.addEventListener('animationend', () => card.classList.remove('slide-in'));
    });
}

function selectCard(type, card) {
    // Bounce effect
    card.classList.remove('bounce');
    void card.offsetWidth; // force reflow
    card.classList.add('bounce');

    if (type === 'french') {
        if (selectedFrench) selectedFrench.classList.remove('selected');
        selectedFrench = card;
    } else {
        if (selectedEnglish) selectedEnglish.classList.remove('selected');
        selectedEnglish = card;
    }
    card.classList.add('selected');

    if (selectedFrench && selectedEnglish) checkMatch();
}

function checkMatch() {
    const frenchWord = selectedFrench.dataset.french;
    const englishWord = selectedEnglish.dataset.english;

    const matchedWord = unmatchedWords.find(w => w["French"] === frenchWord && w["English"] === englishWord);

    if (matchedWord) {
        showPopup(true, matchedWord);

        // Animate removal
        selectedFrench.classList.add('remove');
        setTimeout(() => selectedFrench.remove(), 400);

        const englishCard = Array.from(englishColumn.children).find(c => c.dataset.english === englishWord);
        if (englishCard) {
            englishCard.classList.add('remove');
            setTimeout(() => englishCard.remove(), 400);
        }

        unmatchedWords = unmatchedWords.filter(w => !(w["French"] === frenchWord && w["English"] === englishWord));
    } else {
        showPopup(false);
    }

    selectedFrench.classList.remove('selected');
    selectedEnglish.classList.remove('selected');
    selectedFrench = null;
    selectedEnglish = null;
}

function showPopup(correct, word = null) {
    const overlay = document.createElement('div');
    overlay.className = 'overlay';
    document.body.appendChild(overlay);

    const popup = document.createElement('div');
    popup.className = 'popup';

    if (correct) {
        popup.innerHTML = `<span class="close">X</span>
            <div><strong>Correct!</strong></div>
            <div class="fullinfo">${word["Full Info"]}</div>
            <div class="wordclass">${word["Word Class"]}</div>`;
    } else {
        popup.innerHTML = `<span class="close">X</span>
            <div><strong>Incorrect, try again.</strong></div>`;
    }

    document.body.appendChild(popup);

    popup.querySelector('.close').addEventListener('click', () => {
        document.body.removeChild(popup);
        document.body.removeChild(overlay);
        if (correct) {
            updateScoreboard();
            generateCards();

            if (unmatchedWords.length === 0) {
                const finalOverlay = document.createElement('div');
                finalOverlay.className = 'overlay';
                document.body.appendChild(finalOverlay);

                const finalPopup = document.createElement('div');
                finalPopup.className = 'popup';
                finalPopup.innerHTML = `
                    <span class="close">X</span>
                    <div><strong>Congratulations!</strong></div>
                    <div class="fullinfo">You matched all words! You can restart or upload a new list.</div>
                `;
                document.body.appendChild(finalPopup);

                finalPopup.querySelector('.close').addEventListener('click', () => {
                    document.body.removeChild(finalPopup);
                    document.body.removeChild(finalOverlay);
                });
            }
        }
    });
}

function updateScoreboard() {
    totalMatchesSpan.textContent = words.length;
    completedMatchesSpan.textContent = words.length - unmatchedWords.length;
    remainingMatchesSpan.textContent = unmatchedWords.length;
}

// Restart button
restartButton.addEventListener('click', () => {
    unmatchedWords = [...words];
    selectedFrench = null;
    selectedEnglish = null;
    updateScoreboard();
    generateCards();
});
