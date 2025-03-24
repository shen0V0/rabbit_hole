// --- UI Toggle Functions ---
const toggleDropdown = menuId => {
  const dropdown = document.getElementById(menuId);
  if (dropdown) {
    dropdown.style.display = dropdown.style.display === "block" ? "none" : "block";
  }
};

const togglePopup = () => {
  const popup = document.getElementById('hclPopup');
  const overlay = document.getElementById('overlay');
  if (popup && overlay) {
    const isVisible = popup.style.display === 'block';
    popup.style.display = isVisible ? 'none' : 'block';
    overlay.style.display = isVisible ? 'none' : 'block';
  }
};

const togglereader = () => {
  const reader = document.getElementById('reader');
  const overlay = document.getElementById('overlay');
  const book_window=document.getElementById("bookActionWindow");
  if (reader && overlay) {
    const isVisible = reader.style.display === 'block';
    reader.style.display = isVisible ? 'none' : 'block';
    overlay.style.display = isVisible ? 'none' : 'block';
    book_window.style.display = isVisible ? 'none' : 'block';
  }

};

// --- Book Functions & Pagination ---
let books = [];
let currentPage = 0;
const booksPerPage = 10;

const clearReader = () => {
  const reader = document.getElementById("reader");
  if (reader) reader.innerHTML = "";
};

const renderBooks = () => {
  const resultsDiv = document.getElementById("results");
  if (!resultsDiv) return;
  resultsDiv.innerHTML = "";
  const start = currentPage * booksPerPage;
  const end = start + booksPerPage;
  const paginatedBooks = books.slice(start, end);

  paginatedBooks.forEach(book => {
    const div = document.createElement("div");
    div.className = "book";

    const coverImg = document.createElement("img");
    coverImg.src = book.cover_i 
      ? `https://covers.openlibrary.org/b/id/${book.cover_i}-M.jpg` 
      : "./imgs/default_cover.png";

    const infoDiv = document.createElement("div");
    infoDiv.className = "book-info";
    const title = book.title || "No Title";
    const authors = book.author_name ? book.author_name.join(", ") : "Unknown Author";
    infoDiv.innerHTML = `<h3>${title}</h3><p><strong>Author(s):</strong> ${authors}</p>`;

    if (book.ia && book.ia.length > 0) {
      const readBtn = document.createElement("button");
      readBtn.className = "read-button";
      readBtn.textContent = "Read";
      readBtn.addEventListener("click", () => {
        Myfunction.showBookActionWindow(book);
        togglereader();
        const iaId = book.ia[0];
        const embedUrl = `https://archive.org/embed/${iaId}?ui=embed`;
        const readerDiv = document.getElementById("reader");
        if (readerDiv) {
          readerDiv.innerHTML = `
            <button class="close-button" onclick="togglereader()">Close</button>
            <h2>Reading: ${title}</h2>
            <iframe src="${embedUrl}" frameborder="0" allowfullscreen></iframe>
          `;
          readerDiv.scrollIntoView({ behavior: "smooth" });
        }
      });
      infoDiv.appendChild(readBtn);
    } else {
      const infoLink = document.createElement("a");
      infoLink.href = `https://openlibrary.org${book.key}`;
      infoLink.target = "_blank";
      infoLink.textContent = "View Details";
      infoDiv.appendChild(infoLink);
    }

    div.append(coverImg, infoDiv);
    resultsDiv.appendChild(div);
  });

  document.getElementById("prevPage").disabled = currentPage === 0;
  document.getElementById("nextPage").disabled = end >= books.length;
};

const renderPagination = () => {
  const navDiv = document.getElementById("navigation");
  if (!navDiv) return;
  navDiv.innerHTML = "";
  for (let i = 0; i < Math.ceil(books.length / booksPerPage); i++) {
    const nav = document.createElement("button");
    nav.className = "navigation";
    nav.textContent = i + 1;
    nav.value = i;
    nav.addEventListener("click", function() {
      currentPage = parseInt(this.value, 10);
      renderBooks();
    });
    navDiv.appendChild(nav);
  }
};

document.getElementById("prevPage")?.addEventListener("click", () => {
  if (currentPage > 0) {
    currentPage--;
    renderBooks();
  }
});

document.getElementById("nextPage")?.addEventListener("click", () => {
  if ((currentPage + 1) * booksPerPage < books.length) {
    currentPage++;
    renderBooks();
  }
});

document.getElementById("searchForm")?.addEventListener("submit", e => {
  e.preventDefault();
  clearReader();
  search();
});

const search = () => {
  const query = document.getElementById("query")?.value;
  const resultsDiv = document.getElementById("results");
  if (!query || !resultsDiv) return;
  resultsDiv.innerHTML = "<p>Loading...</p>";

  fetch("https://openlibrary.org/search.json?q=" + encodeURIComponent(query))
    .then(response => response.json())
    .then(data => {
      books = data.docs || [];
      currentPage = 0;
      renderBooks();
      renderPagination();
    })
    .catch(error => {
      resultsDiv.innerHTML = "<p>Error retrieving results.</p>";
      console.error("Error fetching data:", error);
    });
};

document.addEventListener("DOMContentLoaded", () => {
  const searchInput = document.getElementById("query");
  if (!searchInput) return;

  const defaultKeywords = [
    "mythology", "journey to the east", "fairy tales", "history", "literature", "adventure", "classics", "poetry", "romance",
    "mystery", "science fiction", "fantasy", "biography", "memoir", "thriller", "drama", "philosophy", "self-help", "psychology",
    "economics", "politics", "sociology", "art", "architecture", "cooking", "travel", "education", "nature", "environment", "technology",
    "innovation", "sports", "music", "cinema", "theatre", "dance", "comedy", "horror", "detective", "crime", "suspense", "war", "fantasy adventure",
    "historical fiction", "science", "space", "astronomy", "biology", "chemistry", "physics", "mathematics", "geography", "culture", "religion",
    "spirituality", "meditation", "yoga", "leadership", "management", "business", "entrepreneurship", "marketing", "finance", "investing",
    "software", "programming", "engineering", "design", "graphic design", "photography", "illustration", "urban planning", "history of art",
    "modern art", "Renaissance", "Baroque", "Romanticism", "impressionism", "abstract art", "sculpture", "ceramics", "literary classics",
    "modern literature", "postmodernism", "science non-fiction", "environmental science", "health", "fitness", "nutrition", "cooking recipes",
    "gardening", "travel guides", "personal finance", "self improvement", "mystical journeys", "urban legends", "travel memoirs", "world cultures",
    "adventure tales", "historical myths"
  ];

  const params = new URLSearchParams(window.location.search);
  let keyword = params.get("query") || defaultKeywords[Math.floor(Math.random() * defaultKeywords.length)];
  searchInput.value = keyword;
  search();
});

// --- Authentication Popup Functions ---
function Login() {
  const overlay = document.getElementById('overlay');
  let popup = document.getElementById('authPopup');
  if (!popup) {
    popup = document.createElement('div');
    popup.id = 'authPopup';
    popup.innerHTML = `
      <div class="popup-content">
        <button class="close-button" onclick="closePopup()">Close</button>
        <h2 id="authTitle">Login</h2>
        <form id="loginForm">
          <input type="text" id="email" placeholder="Email" required>
          <input type="password" id="password" placeholder="Password" required>
          <button type="button" class="button" onclick="Myfunction.login()">Login</button>
          <p>Don't have an account? <a href="#" onclick="switchToRegister(); return false;">Register</a></p>
        </form>
        <form id="registerForm" style="display: none;">
          <input type="text" id="username" placeholder="Username" required>
          <input type="text" id="email_r" placeholder="Email" required>
          <input type="password" id="password_r" placeholder="Password" required>
          <input type="password" id="password_v" placeholder="Confirm Password" required>
          <button type="button" class="button" onclick="Myfunction.register()">Sign-up</button>
          <p>Already have an account? <a href="#" onclick="switchToLogin(); return false;">Login</a></p>
        </form>
      </div>
    `;
    document.body.appendChild(popup);
  }
  popup.style.display = 'block';
  overlay.style.display = 'block';
}

function closePopup() {
  const popup = document.getElementById('authPopup');
  const overlay = document.getElementById('overlay');
  if (popup) popup.style.display = 'none';
  if (overlay) overlay.style.display = 'none';
}

function switchToRegister() {
  const authTitle = document.getElementById('authTitle');
  const loginForm = document.getElementById('loginForm');
  const registerForm = document.getElementById('registerForm');
  if (authTitle && loginForm && registerForm) {
    authTitle.innerText = "Register";
    loginForm.style.display = "none";
    registerForm.style.display = "block";
  }
}

function switchToLogin() {
  const authTitle = document.getElementById('authTitle');
  const loginForm = document.getElementById('loginForm');
  const registerForm = document.getElementById('registerForm');
  if (authTitle && loginForm && registerForm) {
    authTitle.innerText = "Login";
    loginForm.style.display = "block";
    registerForm.style.display = "none";
  }
}

function showAlert(message, color, lasting) {
  const existingPopup = document.getElementById("popup-alert");
  if (existingPopup) existingPopup.remove();

  const popup = document.createElement("div");
  popup.id = "popup-alert";
  popup.className = "popup-container";
  if (color) popup.style.background = color;

  const messageDiv = document.createElement("div");
  messageDiv.className = "popup-message";
  messageDiv.innerText = message;

  const closeButton = document.createElement("button");
  closeButton.className = "popup-close";
  closeButton.innerText = "×";
  closeButton.onclick = () => {
    popup.style.opacity = "0";
    setTimeout(() => popup.remove(), 300);
  };

  popup.append(messageDiv, closeButton);
  document.body.appendChild(popup);

  setTimeout(() => {
    popup.style.opacity = "1";
    popup.style.transform = "translate(-50%, -50%) scale(1)";
  }, 50);

  // lasting is in seconds; default is 3 seconds.
  setTimeout(() => {
    popup.style.opacity = "0";
    setTimeout(() => popup.remove(), 300);
  }, (lasting ? lasting * 1000 : 3000));
}
