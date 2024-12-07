// API Configuration
const API_BASE_URL = '';

// Global state
let currentPresentation = null;
let presentations = [];
let selectedSongs = {};
let selectedVerses = {};

document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
    setupEventListeners();
});

function initializeApp() {
    switchTab('presentation');
    loadPresentations();
    initializeDateInput();
    setupBibleVerseHandlers();
}

function initializeDateInput() {
    const today = new Date();
    const dateInput = document.getElementById('presentation-date');
    dateInput.value = today.toISOString().split('T')[0];

    const formattedDate = today.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
    });
    console.log('Formatted date:', formattedDate);
}

function setupEventListeners() {
    // Search input handling for songs tab
    const searchInput = document.getElementById('song-search');
    if (searchInput) {
        searchInput.addEventListener('input', debounce(function(e) {
            fetchSongs(e.target.value);
        }, 300));
    }

    document.getElementById('newPresentationBtn')?.addEventListener('click', () => {
        openModal('presentationModal');
        initializeDateInput();
        setupBibleVerseHandlers(); // Add this line
    });

    // Tab switching
    const tabs = document.querySelectorAll('.tab');
    tabs.forEach(tab => {
        tab.addEventListener('click', function() {
            const tabName = this.dataset.tab;
            switchTab(tabName);
        });
    });

    // Sidebar menu
    const menuItems = document.querySelectorAll('.sidebar-menu li');
    menuItems.forEach(item => {
        item.addEventListener('click', function() {
            const tabName = this.dataset.tab;
            switchTab(tabName);
        });
    });

    // Control buttons
    document.getElementById('prevButton')?.addEventListener('click', previousSlide);
    document.getElementById('nextButton')?.addEventListener('click', nextSlide);
    document.getElementById('goLiveButton')?.addEventListener('click', goLive);

    // New presentation button
    document.getElementById('newPresentationBtn')?.addEventListener('click', () => {
        openModal('presentationModal');
        initializeDateInput();
    });

    // New announcement button
    document.getElementById('newAnnouncementBtn')?.addEventListener('click', () => openModal('announcementModal'));

    // Settings changes
    document.getElementById('theme')?.addEventListener('change', handleThemeChange);
    document.getElementById('font-size')?.addEventListener('change', handleFontSizeChange);

    // Setup song search handlers for presentation modal
    setupPresentationModalHandlers();
}

function setupPresentationModalHandlers() {
    // Setup handlers for each song search input in the presentation modal
    const songSearchInputs = [
        'opening-song-1-search',
        'opening-song-2-search',
        'worship-song-search',
        'closing-song-search'
    ];

    songSearchInputs.forEach(inputId => {
        const input = document.getElementById(inputId);
        if (input) {
            input.addEventListener('input', debounce((e) => {
                searchSongs(e, `${inputId}-results`);
            }, 300));
        }
    });
}

function switchTab(tabName) {
    // Update tab active states
    document.querySelectorAll('.tab').forEach(t => {
        t.classList.toggle('active', t.dataset.tab === tabName);
    });

    document.querySelectorAll('.sidebar-menu li').forEach(item => {
        item.classList.toggle('active', item.dataset.tab === tabName);
    });

    // Show/hide content based on selected tab
    document.querySelectorAll('.tab-content').forEach(content => {
        content.style.display = 'none';
    });

    const selectedContent = document.getElementById(`${tabName}-content`);
    if (selectedContent) {
        selectedContent.style.display = 'block';
    }

    // Load tab-specific content
    switch(tabName) {
        case 'presentation':
            loadPresentations();
            break;
        case 'songs':
            fetchSongs();
            break;
        case 'bible-verses':
            initializeBibleVerses();
            break;
        case 'announcements':
            loadAnnouncements();
            break;
    }
}

// Modal Functions
function openModal(modalId) {
    document.getElementById(modalId).style.display = 'block';
}

function closeModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
    // Clear form inputs
    const modal = document.getElementById(modalId);
    modal.querySelectorAll('input, textarea').forEach(input => {
        input.value = '';
    });

    // Clear selected songs and verses if closing presentation modal
    if (modalId === 'presentationModal') {
        selectedSongs = {};
        selectedVerses = {};
    }
}

// Song Functions for Presentation Modal
async function searchSongs(event, resultsId) {
    const searchTerm = event.target.value;
    const resultsDiv = document.getElementById(resultsId);

    if (searchTerm.length < 2) {
        resultsDiv.classList.remove('active');
        return;
    }

    try {
        const response = await fetch(`/api/songs?search=${encodeURIComponent(searchTerm)}`);
        const songs = await response.json();

        if (songs.length > 0) {
            resultsDiv.innerHTML = songs.map(song => `
                <div class="search-result-item" onclick="selectSong('${song.song_id}', '${resultsId}')">
                    ${escapeHtml(song.title)} (#${song.song_number})
                </div>
            `).join('');
            resultsDiv.classList.add('active');
        } else {
            resultsDiv.innerHTML = '<div class="search-result-item">No songs found</div>';
            resultsDiv.classList.add('active');
        }
    } catch (error) {
        console.error('Error searching songs:', error);
        resultsDiv.innerHTML = '<div class="search-result-item error">Error searching songs</div>';
        resultsDiv.classList.add('active');
    }
}

async function selectSong(songId, resultsId) {
    try {
        const response = await fetch(`/api/songs/${songId}`);
        const song = await response.json();

        const sectionId = resultsId.replace('-results', '');
        const selectedDiv = document.getElementById(`${sectionId}-selected`);

        selectedSongs[sectionId] = {
            ...song,
            slides: createLyricSlides(song.lyrics)
        };

        selectedDiv.innerHTML = `
            <h5>${escapeHtml(song.title)}</h5>
            <p>Number of slides: ${selectedSongs[sectionId].slides.length}</p>
            <button class="button" onclick="removeSong('${sectionId}')">Remove</button>
        `;
        selectedDiv.classList.add('active');

        // Hide results and clear search
        document.getElementById(resultsId).classList.remove('active');
        document.getElementById(`${sectionId}-search`).value = '';
    } catch (error) {
        console.error('Error selecting song:', error);
    }
}

function removeSong(sectionId) {
    delete selectedSongs[sectionId];
    const selectedDiv = document.getElementById(`${sectionId}-selected`);
    selectedDiv.innerHTML = '';
    selectedDiv.classList.remove('active');
}

function createLyricSlides(lyrics) {
    const lines = lyrics.split('\n').filter(line => line.trim());
    const slides = [];
    for (let i = 0; i < lines.length; i += 4) {
        slides.push(lines.slice(i, i + 4).join('\n'));
    }
    return slides;
}

// Bible Verse Functions
function searchBibleVerse(sectionId) {
    const book = document.getElementById(`${sectionId}-book`).value;
    const chapter = document.getElementById(`${sectionId}-chapter`).value;
    const startVerse = document.getElementById(`${sectionId}-verse-start`).value;
    const endVerse = document.getElementById(`${sectionId}-verse-end`).value;

    const previewDiv = document.getElementById(`${sectionId}-preview`);
    previewDiv.innerHTML = `${book} ${chapter}:${startVerse}-${endVerse}`;

    selectedVerses[sectionId] = {
        book,
        chapter,
        startVerse,
        endVerse
    };
}

// Presentation Functions
function savePresentation() {
    const name = document.getElementById('presentation-name').value;
    const dateInput = document.getElementById('presentation-date').value;

    if (!name || !dateInput) {
        alert('Please fill in the required fields');
        return;
    }

    const date = new Date(dateInput);
    const formattedDate = date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
    });

    // Create slides array in order
    const slides = [];

    // Add opening songs
    if (selectedSongs['opening-song-1']) {
        slides.push(...selectedSongs['opening-song-1'].slides.map(lyrics => ({
            type: 'song',
            title: selectedSongs['opening-song-1'].title,
            content: lyrics
        })));
    }

    if (selectedSongs['opening-song-2']) {
        slides.push(...selectedSongs['opening-song-2'].slides.map(lyrics => ({
            type: 'song',
            title: selectedSongs['opening-song-2'].title,
            content: lyrics
        })));
    }

    // Add prayer slide
    slides.push({
        type: 'prayer',
        content: 'Prayer'
    });

    // Add worship song
    if (selectedSongs['worship-song']) {
        slides.push(...selectedSongs['worship-song'].slides.map(lyrics => ({
            type: 'song',
            title: selectedSongs['worship-song'].title,
            content: lyrics
        })));
    }

    // Add Bible verse slides
    if (selectedVerses['bible-verse']) {
        slides.push({
            type: 'bible-verse',
            content: selectedVerses['bible-verse']
        });
    }

    // Add key verse slides
    if (selectedVerses['key-verse']) {
        slides.push({
            type: 'key-verse',
            content: selectedVerses['key-verse']
        });
    }

    // Add offering slide
    slides.push({
        type: 'offering',
        content: 'Offering'
    });

    // Add closing song
    if (selectedSongs['closing-song']) {
        slides.push(...selectedSongs['closing-song'].slides.map(lyrics => ({
            type: 'song',
            title: selectedSongs['closing-song'].title,
            content: lyrics
        })));
    }

    const newPresentation = {
        id: Date.now(),
        name: name,
        date: formattedDate,
        slides: slides
    };

    presentations.push(newPresentation);
    addPresentationToList(newPresentation);
    closeModal('presentationModal');
}

function addPresentationToList(presentation) {
    const presentationList = document.getElementById('presentationList');
    const presentationElement = document.createElement('div');
    presentationElement.className = 'presentation-item';

    const slideCount = presentation.slides ? presentation.slides.length : 0;

    presentationElement.innerHTML = `
        <div class="presentation-info">
            <div class="presentation-header">
                <span class="presentation-title">${escapeHtml(presentation.name)} (${presentation.date})</span>
                <span class="slide-count">${slideCount} slides</span>
            </div>
            <div class="presentation-actions">
                <button class="button" onclick="editPresentation(${presentation.id})">Edit</button>
                <button class="button" onclick="deletePresentation(${presentation.id})">Delete</button>
            </div>
        </div>
    `;
    presentationList.appendChild(presentationElement);
}

function loadPresentations() {
    const presentationList = document.getElementById('presentationList');
    presentationList.innerHTML = ''; // Clear existing presentations
    presentations.forEach(presentation => addPresentationToList(presentation));
}

function editPresentation(presentationId) {
    const presentation = presentations.find(p => p.id === presentationId);
    if (presentation) {
        currentPresentation = presentation;
        console.log('Editing presentation:', presentation);
    }
}

function deletePresentation(presentationId) {
    if (confirm('Are you sure you want to delete this presentation?')) {
        presentations = presentations.filter(p => p.id !== presentationId);
        loadPresentations();
    }
}

// Utility Functions
function escapeHtml(unsafe) {
    return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function handleError(message) {
    const songList = document.getElementById('songList');
    songList.innerHTML = `
        <li class="song-item error">${message}</li>
    `;
}

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Control Functions
function previousSlide() {
    console.log('Previous slide');
}

function nextSlide() {
    console.log('Next slide');
}

function goLive() {
    console.log('Going live');
}

// Settings Functions
function handleThemeChange(event) {
    const theme = event.target.value;
    document.body.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
}

function handleFontSizeChange(event) {
    const fontSize = event.target.value;
    document.body.setAttribute('data-font-size', fontSize);
    localStorage.setItem('fontSize', fontSize);
}

// Bible Verse Functions
function initializeBibleVerses() {
    const verseList = document.getElementById('verseList');
    if (verseList) {
        verseList.innerHTML = '<div class="loading">Loading Bible verses...</div>';
    }
}

// Announcement Functions
function saveAnnouncement() {
    const title = document.getElementById('announcement-title').value;
    const content = document.getElementById('announcement-content').value;

    if (!title || !content) {
        alert('Please fill in all fields');
        return;
    }

    const announcement = {
        id: Date.now(),
        title: title,
        content: content,
        date: new Date().toISOString()
    };

    addAnnouncementToList(announcement);
    closeModal('announcementModal');
}

function addAnnouncementToList(announcement) {
    const announcementList = document.getElementById('announcementList');
    const announcementElement = document.createElement('div');
    announcementElement.className = 'announcement-item';
    announcementElement.innerHTML = `
        <div class="announcement-info">
            <span class="announcement-title">${escapeHtml(announcement.title)}</span>
            <div class="announcement-actions">
                <button class="button" onclick="editAnnouncement(${announcement.id})">Edit</button>
                <button class="button" onclick="deleteAnnouncement(${announcement.id})">Delete</button>
                </div>
        </div>
        <div class="announcement-content">${escapeHtml(announcement.content)}</div>
    `;
    announcementList.appendChild(announcementElement);
}

function loadAnnouncements() {
    // Implement loading announcements from storage/database
    console.log('Loading announcements');
}

// Bible verse search functionality
async function searchBibleBooks(searchTerm) {
    try {
        const response = await fetch(`/api/bible/books?search=${encodeURIComponent(searchTerm)}`);
        const books = await response.json();
        return books;
    } catch (error) {
        console.error('Error searching Bible books:', error);
        return [];
    }
}

async function fetchBibleVerses(book, chapter, verseStart, verseEnd) {
    try {
        const params = new URLSearchParams({
            book: book,
            chapter: chapter,
            verse_start: verseStart,
            verse_end: verseEnd
        });

        const response = await fetch(`/api/bible/search?${params}`);
        const verses = await response.json();
        return verses;
    } catch (error) {
        console.error('Error fetching Bible verses:', error);
        return [];
    }
}

// Setup Bible verse search handlers
function setupBibleVerseHandlers() {
    const bibleInputIds = ['bible-verse', 'key-verse'];

    bibleInputIds.forEach(sectionId => {
        const bookInput = document.getElementById(`${sectionId}-book`);
        const chapterInput = document.getElementById(`${sectionId}-chapter`);
        const verseStartInput = document.getElementById(`${sectionId}-verse-start`);
        const verseEndInput = document.getElementById(`${sectionId}-verse-end`);
        const previewDiv = document.getElementById(`${sectionId}-preview`);

        if (bookInput) {
            // Add book search functionality
            bookInput.addEventListener('input', debounce(async (e) => {
                const searchTerm = e.target.value;
                if (searchTerm.length < 2) return;

                const books = await searchBibleBooks(searchTerm);
                const resultsDiv = document.createElement('div');
                resultsDiv.className = 'bible-book-results';
                resultsDiv.innerHTML = books.map(book => `
                    <div class="search-result-item" onclick="selectBibleBook('${sectionId}', '${book.book}')">
                        ${escapeHtml(book.book)}
                    </div>
                `).join('');

                // Remove existing results if any
                const existingResults = bookInput.parentElement.querySelector('.bible-book-results');
                if (existingResults) {
                    existingResults.remove();
                }

                bookInput.parentElement.appendChild(resultsDiv);
            }, 300));
        }

        // Add search button handler
        const searchButton = document.querySelector(`button[onclick="searchBibleVerse('${sectionId}')"]`);
        if (searchButton) {
            searchButton.onclick = async () => {
                const book = bookInput.value;
                const chapter = chapterInput.value;
                const verseStart = verseStartInput.value;
                const verseEnd = verseEndInput.value;

                if (!book || !chapter || !verseStart) {
                    previewDiv.innerHTML = '<div class="error">Please fill in required fields</div>';
                    return;
                }

                const verses = await fetchBibleVerses(book, chapter, verseStart, verseEnd || verseStart);

                if (verses.length > 0) {
                    const verseText = verses.map(v => `${v.text}`).join(' ');
                    previewDiv.innerHTML = `
                        <div class="verse-content">
                            <h4>${book} ${chapter}:${verseStart}${verseEnd ? '-' + verseEnd : ''}</h4>
                            <p>${escapeHtml(verseText)}</p>
                        </div>
                    `;

                    // Store selected verses
                    selectedVerses[sectionId] = {
                        book,
                        chapter,
                        verseStart,
                        verseEnd: verseEnd || verseStart,
                        text: verseText
                    };
                } else {
                    previewDiv.innerHTML = '<div class="error">No verses found</div>';
                }
            };
        }
    });
}

function selectBibleBook(sectionId, bookName) {
    const bookInput = document.getElementById(`${sectionId}-book`);
    bookInput.value = bookName;

    // Remove the results dropdown
    const resultsDiv = bookInput.parentElement.querySelector('.bible-book-results');
    if (resultsDiv) {
        resultsDiv.remove();
    }
}

// Add to your existing setupEventListeners function
function addBibleSearchToEventListeners() {
    document.getElementById('newPresentationBtn')?.addEventListener('click', () => {
        openModal('presentationModal');
        initializeDateInput();
        setupBibleVerseHandlers(); // Add this line
    });
}

async function searchBibleBooks(searchTerm) {
    try {
        const response = await fetch(`/api/bible/books?search=${encodeURIComponent(searchTerm)}`);
        const books = await response.json();
        return books;
    } catch (error) {
        console.error('Error searching Bible books:', error);
        return [];
    }
}

async function fetchBibleVerses(book, chapter, verseStart, verseEnd) {
    try {
        const params = new URLSearchParams({
            book: book,
            chapter: chapter,
            verse_start: verseStart,
            verse_end: verseEnd || verseStart
        });

        const response = await fetch(`/api/bible/search?${params}`);
        const verses = await response.json();
        return verses;
    } catch (error) {
        console.error('Error fetching Bible verses:', error);
        return [];
    }
}

function setupBibleVerseHandlers() {
    const bibleInputIds = ['bible-verse', 'key-verse'];

    bibleInputIds.forEach(sectionId => {
        const bookInput = document.getElementById(`${sectionId}-book`);
        const chapterInput = document.getElementById(`${sectionId}-chapter`);
        const verseStartInput = document.getElementById(`${sectionId}-verse-start`);
        const verseEndInput = document.getElementById(`${sectionId}-verse-end`);
        const previewDiv = document.getElementById(`${sectionId}-preview`);
        const searchButton = document.getElementById(`${sectionId}-search-button`);

        if (bookInput) {
            // Add book search functionality
            bookInput.addEventListener('input', debounce(async (e) => {
                const searchTerm = e.target.value;
                if (searchTerm.length < 2) return;

                const books = await searchBibleBooks(searchTerm);
                displayBookResults(books, sectionId, bookInput);
            }, 300));

            // Handle clicking outside of book results
            document.addEventListener('click', (e) => {
                if (!bookInput.contains(e.target)) {
                    removeBookResults(bookInput);
                }
            });
        }

        if (searchButton) {
            searchButton.addEventListener('click', async () => {
                await handleVerseSearch(sectionId, bookInput, chapterInput, verseStartInput, verseEndInput, previewDiv);
            });
        }
    });
}

function displayBookResults(books, sectionId, bookInput) {
    removeBookResults(bookInput);

    if (books.length === 0) return;

    const resultsDiv = document.createElement('div');
    resultsDiv.className = 'bible-book-results';
    resultsDiv.innerHTML = books.map(book => `
        <div class="search-result-item" onclick="selectBibleBook('${sectionId}', '${escapeHtml(book.book)}')">
            ${escapeHtml(book.book)}
        </div>
    `).join('');

    bookInput.parentElement.appendChild(resultsDiv);
}

function removeBookResults(bookInput) {
    const existingResults = bookInput.parentElement.querySelector('.bible-book-results');
    if (existingResults) {
        existingResults.remove();
    }
}

function selectBibleBook(sectionId, bookName) {
    const bookInput = document.getElementById(`${sectionId}-book`);
    bookInput.value = bookName;
    removeBookResults(bookInput);
}

async function handleVerseSearch(sectionId, bookInput, chapterInput, verseStartInput, verseEndInput, previewDiv) {
    const book = bookInput.value;
    const chapter = chapterInput.value;
    const verseStart = verseStartInput.value;
    const verseEnd = verseEndInput.value;

    if (!book || !chapter || !verseStart) {
        previewDiv.innerHTML = '<div class="error">Please fill in required fields</div>';
        return;
    }

    const verses = await fetchBibleVerses(book, chapter, verseStart, verseEnd);

    if (verses.length > 0) {
        const verseText = verses.map(v => v.text).join(' ');
        previewDiv.innerHTML = `
            <div class="verse-content">
                <h4>${escapeHtml(book)} ${chapter}:${verseStart}${verseEnd ? '-' + verseEnd : ''}</h4>
                <p>${escapeHtml(verseText)}</p>
            </div>
        `;

        selectedVerses[sectionId] = {
            book,
            chapter: parseInt(chapter),
            startVerse: parseInt(verseStart),
            endVerse: verseEnd ? parseInt(verseEnd) : parseInt(verseStart),
            text: verseText
        };
    } else {
        previewDiv.innerHTML = '<div class="error">No verses found</div>';
    }
}