
function toggleDropdown(menuId) {
    const dropdown = document.getElementById(menuId);
    dropdown.style.display = dropdown.style.display === "block" ? "none" : "block";
}


function togglePopup() {
    const popup = document.getElementById('hclPopup');
    const overlay = document.getElementById('overlay');
    const isVisible = popup.style.display === 'block';

    popup.style.display = isVisible ? 'none' : 'block';
    overlay.style.display = isVisible ? 'none' : 'block';
}
function togglereader() {
    const popup = document.getElementById('reader');
    const overlay = document.getElementById('overlay');
    const isVisible = popup.style.display === 'block';

    popup.style.display = isVisible ? 'none' : 'block';
    overlay.style.display = isVisible ? 'none' : 'block';
}
//book functions

let books = [];
let currentPage = 0;
const booksPerPage = 10;

function clearReader() {
  document.getElementById("reader").innerHTML = "";
}

function renderBooks() {
  const resultsDiv = document.getElementById("results");
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
      : "https://via.placeholder.com/100x150?text=No+Cover";

    const infoDiv = document.createElement("div");
    infoDiv.className = "book-info";
    const title = book.title || "No Title";
    const authors = book.author_name ? book.author_name.join(", ") : "Unknown Author";
    infoDiv.innerHTML = `<h3>${title}</h3><p><strong>Author(s):</strong> ${authors}</p>`;

    if (book.ia && book.ia.length > 0) {
      const readBtn = document.createElement("button");
      readBtn.className = "read-button";
      readBtn.textContent = "Read";
      readBtn.addEventListener("click", function() {
        togglereader();
        const iaId = book.ia[0];
        const embedUrl = `https://archive.org/embed/${iaId}?ui=embed`;
        document.getElementById("reader").innerHTML = `<button class="close-button" onclick="togglereader()">Close</button><h2>Reading: ${title}</h2><iframe src="${embedUrl}" frameborder="0" allowfullscreen></iframe>`;
        document.getElementById("reader").scrollIntoView({ behavior: "smooth" });
      });
      infoDiv.appendChild(readBtn);
    } else {
      const infoLink = document.createElement("a");
      infoLink.href = `https://openlibrary.org${book.key}`;
      infoLink.target = "_blank";
      infoLink.textContent = "View Details";
      infoDiv.appendChild(infoLink);
    }

    div.appendChild(coverImg);
    div.appendChild(infoDiv);
    resultsDiv.appendChild(div);
  });

  document.getElementById("prevPage").disabled = currentPage === 0;
  document.getElementById("nextPage").disabled = end >= books.length;
}

document.getElementById("searchForm").addEventListener("submit", function(e) {
  e.preventDefault();
  clearReader();
  search();
});
function search(){
    const query = document.getElementById("query").value;
    const resultsDiv = document.getElementById("results");
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
}
function renderPagination() {
  const navDiv = document.getElementById("navigation");
  navDiv.innerHTML = "";
  for (let x = 0; x < Math.ceil(books.length / booksPerPage); x++) {
    const nav = document.createElement("button");
    nav.className = "navigation";
    nav.textContent = x + 1;
    nav.value = x;
    nav.addEventListener("click", function() {
      currentPage = parseInt(this.value);
      renderBooks();
    });
    navDiv.appendChild(nav);
  }
}
document.getElementById("prevPage").addEventListener("click", function() {
  if (currentPage > 0) {
    currentPage--;
    renderBooks();
  }
});

document.getElementById("nextPage").addEventListener("click", function() {
  if ((currentPage + 1) * booksPerPage < books.length) {
    currentPage++;
    renderBooks();
  }
});
document.addEventListener("DOMContentLoaded", function() {
    // Only run if a search input with the id "query" exists on the page
    const searchInput = document.getElementById("query");
    if (!searchInput) return;
  
    // Array of 100 default keywords
    const defaultKeywords = [
      "mythology",
      "journey to the east",
      "fairy tales",
      "history",
      "literature",
      "adventure",
      "classics",
      "poetry",
      "romance",
      "mystery",
      "science fiction",
      "fantasy",
      "biography",
      "memoir",
      "thriller",
      "drama",
      "philosophy",
      "self-help",
      "psychology",
      "economics",
      "politics",
      "sociology",
      "art",
      "architecture",
      "cooking",
      "travel",
      "education",
      "nature",
      "environment",
      "technology",
      "innovation",
      "sports",
      "music",
      "cinema",
      "theatre",
      "dance",
      "comedy",
      "horror",
      "detective",
      "crime",
      "suspense",
      "war",
      "fantasy adventure",
      "historical fiction",
      "science",
      "space",
      "astronomy",
      "biology",
      "chemistry",
      "physics",
      "mathematics",
      "geography",
      "culture",
      "religion",
      "spirituality",
      "meditation",
      "yoga",
      "leadership",
      "management",
      "business",
      "entrepreneurship",
      "marketing",
      "finance",
      "investing",
      "software",
      "programming",
      "engineering",
      "design",
      "graphic design",
      "photography",
      "illustration",
      "urban planning",
      "history of art",
      "modern art",
      "Renaissance",
      "Baroque",
      "Romanticism",
      "impressionism",
      "abstract art",
      "sculpture",
      "ceramics",
      "literary classics",
      "modern literature",
      "postmodernism",
      "science non-fiction",
      "environmental science",
      "health",
      "fitness",
      "nutrition",
      "cooking recipes",
      "gardening",
      "travel guides",
      "personal finance",
      "self improvement",
      "mystical journeys",
      "urban legends",
      "travel memoirs",
      "world cultures",
      "adventure tales",
      "historical myths"
    ];
  
    // Parse URL query parameters to check for an existing "query"
    const params = new URLSearchParams(window.location.search);
    let keyword = params.get("query");
  
    // If there's no query parameter, select a random keyword from the list
    if (!keyword) {
      const randomIndex = Math.floor(Math.random() * defaultKeywords.length);
      keyword = defaultKeywords[randomIndex];
      
    }
  
    // Set the search input's value to the selected keyword
    searchInput.value = keyword;
    search();
  });
  
 function Login(){
    console.log("works");
    const overlay = document.getElementById('overlay');
    const popup = document.createElement('div');
        popup.id = 'authPopup';
        popup.innerHTML = `
            <div class="popup-content">
                <button class="close-button" onclick="closePopup()">close</button>
                <h2 id="authTitle">Login</h2>
                
                <form id="loginForm">
                    <input type="text" id="loginEmail" placeholder="Email or Username" required>
                    <input type="password" id="loginPassword" placeholder="Password" required>
                    <button class="button" onclick='login()'>Login</button>
                    <p>Don't have an account? <a href="#" onclick="switchToRegister()">Register</a></p>
                </form>

                <form id="registerForm" style="display: none;">
                    <input type="text" id="registerUsername" placeholder="Username" required>
                    <input type="text" id="registerEmail" placeholder="Email" required>
                    <input type="password" id="registerPassword" placeholder="Password" required>
                    <input type="password" id="registerConfirmPassword" placeholder="Confirm Password" required>
                    <button class="button" onclick='register'>Sign-up</button>
                    <p>Already have an account? <a href="#" onclick="switchToLogin()">Login</a></p>
                </form>
            </div>
        `;
        document.body.appendChild(popup);
    

    popup.style.display = 'block';
    overlay.style.display = 'block';
};

function closePopup() {
    document.getElementById('authPopup').style.display = 'none';
    document.getElementById('overlay').style.display = 'none';
}

function switchToRegister() {
    document.getElementById('authTitle').innerText = "Register";
    document.getElementById('loginForm').style.display = "none";
    document.getElementById('registerForm').style.display = "block";
}

function switchToLogin() {
    document.getElementById('authTitle').innerText = "Login";
    document.getElementById('loginForm').style.display = "block";
    document.getElementById('registerForm').style.display = "none";
}
function showAlert(message) {
  // Check if an alert already exists
  let existingPopup = document.getElementById("popup-alert");
  if (existingPopup) {
      existingPopup.remove();
  }

  // Create the pop-up container
  const popup = document.createElement("div");
  popup.id = "popup-alert";
  popup.className = "popup-container";

  // Create the message div
  const messageDiv = document.createElement("div");
  messageDiv.className = "popup-message";
  messageDiv.innerText = message;

  // Create the close button
  const closeButton = document.createElement("button");
  closeButton.className = "popup-close";
  closeButton.innerText = "×";
  closeButton.onclick = function () {
      popup.style.opacity = "0";
      setTimeout(() => popup.remove(), 300); // Smooth fade-out effect
  };

  // Append elements
  popup.appendChild(messageDiv);
  popup.appendChild(closeButton);
  document.body.appendChild(popup);

  // Show the popup with animation
  setTimeout(() => {
      popup.style.opacity = "1";
      popup.style.transform = "translate(-50%, -50%) scale(1)";
  }, 50);

  // Auto close after 3 seconds
  setTimeout(() => {
      popup.style.opacity = "0";
      setTimeout(() => popup.remove(), 300);
  }, 3000);
}
