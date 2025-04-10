import { initializeApp } from "https://www.gstatic.com/firebasejs/11.3.1/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, onAuthStateChanged,updatePassword  } 
  from "https://www.gstatic.com/firebasejs/11.3.1/firebase-auth.js";
import { getFirestore, collection, doc, setDoc, getDoc, deleteDoc, getDocs } 
  from "https://www.gstatic.com/firebasejs/11.3.1/firebase-firestore.js";

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyD9Bti6OGhX19OVbLn6n6t6uAaM_4V_jSY",
  authDomain: "rabbit-hole-a0713.firebaseapp.com",
  projectId: "rabbit-hole-a0713",
  storageBucket: "rabbit-hole-a0713.firebasestorage.app",
  messagingSenderId: "5363591807",
  appId: "1:5363591807:web:ba1c15747a119cb383ed4a",
  measurementId: "G-BLCWQGCX0Y"
};



// ---------- Firebase Initialization ----------
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// ---------- User Authentication Status ----------
function checkUserStatus() {
  const userDiv = document.querySelector(".User");
  onAuthStateChanged(auth, async (user) => {
   
    if (user) {
      const currentPage = window.location.pathname.split("/").pop();
      if (currentPage === "user.html") {
        loadProfileSummary();
      }
     if(document.getElementById("icon")){
      loadUserInfo();
     }
      session();
      // Retrieve user profile once
      const profileRef = doc(db, "User", user.uid, "UserInfo", "Profile");
      const profileSnap = await getDoc(profileRef);
      const profileData = profileSnap.exists() ? profileSnap.data() : {};
      const username = profileData.username || "User";
      const usericon = profileData.icon || "./imgs/rabbit.png";
      userDiv.innerHTML = `
        <div class="user-info">
         <a href="user.html">
            <img src="${usericon}" alt="User Icon">
            </a>
            <a href="user.html" class="user-link">
            <span class="username">${username}</span>
            </a>
          <button onclick="Myfunction.logout()">Logout</button>
        </div>
      `; document.querySelector(".user-link").style.textDecoration = "none";
      document.querySelector(".user-link").style.color = "inherit";
    } else {
      userDiv.innerHTML = `<button id="Login" onclick="Login()">Login</button>`;
    }Check();
  });
}

// ---------- Session Timer Functions ----------
const session_length = 60 * 60 * 1000; // 1 hour
const noti_time = 10 * 60 * 1000;        // 10 minutes warning

let sessionTimer, notiTimer, countdownInterval;

function session() {
  resettimer();
  // Listen for user activity to reset timers
  document.addEventListener("mousemove", resettimer);
  document.addEventListener("click", resettimer);
  document.addEventListener("keydown", resettimer);
}

function resettimer() {
  if (sessionTimer) clearTimeout(sessionTimer);
  if (notiTimer) clearTimeout(notiTimer);
  if (countdownInterval) clearInterval(countdownInterval);
  const warnDiv = document.getElementById("session-warning");
  if (warnDiv) warnDiv.remove();

  sessionTimer = setTimeout(() => {
    logout("Logging out due to session expiration.");
  }, session_length);

  notiTimer = setTimeout(() => {
    warning("Your session is going to end in ");
  }, session_length - noti_time);
}

function warning(msg) {
  let warnDiv = document.getElementById("session-warning");
  if (!warnDiv) {
    warnDiv = document.createElement("div");
    warnDiv.id = "session-warning";
    warnDiv.style.position = "fixed";
    warnDiv.style.top = "90px";
    warnDiv.style.right = "20px";
    warnDiv.style.backgroundColor = "rgba(255, 0, 0, 0.8)";
    warnDiv.style.color = "white";
    warnDiv.style.padding = "15px";
    warnDiv.style.borderRadius = "8px";
    warnDiv.style.boxShadow = "0 2px 5px rgba(0,0,0,0.3)";
    warnDiv.style.zIndex = "1000";
    document.body.appendChild(warnDiv);
  }

  warnDiv.innerHTML = msg + "<span style='color:lightblue;' id='countdown'></span>";
  let countdownTime = noti_time / 1000;
  const countdownElem = document.getElementById("countdown");
  countdownElem.textContent = formatTime(countdownTime);

  countdownInterval = setInterval(() => {
    countdownTime--;
    if (countdownTime <= 0) {
      clearInterval(countdownInterval);
      warnDiv.innerHTML = "Session expired!";
    } else {
      countdownElem.textContent = formatTime(countdownTime);
    }
  }, 1000);
}

function formatTime(hours) {
  const totalSeconds = Math.floor(hours * 3600); // Convert hours to seconds
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;

  return `${h.toString().padStart(2, "0")}h ${m.toString().padStart(2, "0")}m ${s.toString().padStart(2, "0")}s`;
}


// ---------- Login Function ----------
async function login() {
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value.trim();
  if (!email) {
    showAlert("Email cannot be empty");
    return;
  }
  if (!password) {
    showAlert("Password cannot be empty");
    return;
  }
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    showAlert("Login successful! Welcome back.");
    const profileRef = doc(db, "User", user.uid, "UserInfo", "Profile");
    const profileSnap = await getDoc(profileRef);
    if (profileSnap.exists()) {
      const profileData = profileSnap.data();
      const lastSignedIn = profileData.lastSignedIn;
      if (lastSignedIn) {
        const gapMs = Date.now() - lastSignedIn.toDate().getTime();
        const gapDays = Math.floor(gapMs / (1000 * 60 * 60 * 24));
        if (gapDays === 1) {
          const newStreak = (profileData.streaks || 0) + 1;
          await setDoc(profileRef, { streaks: newStreak }, { merge: true });
          showAlert("Congratulations on your " + newStreak + " day streak of learning!", "orange", 10);
        } else if (gapDays > 1) {
          const currentStreak = profileData.streaks || 0;
          await setDoc(profileRef, { streaks: 1 }, { merge: true });
          showAlert("Oops, you lost your " + currentStreak + " day streak.", "orange", 10);
        }
      }
    } else {
      console.log("No such document!");
    }
    // Update lastSignedIn regardless of streak status
    await setDoc(profileRef, { lastSignedIn: new Date() }, { merge: true });
    closePopup();
  } catch (error) {
    console.error(error.message);
    if (error.code === 'auth/wrong-password') {
      showAlert("Invalid password. Please try again.");
    } else if (error.code === 'auth/user-not-found') {
      showAlert("No user found with this email. Please register.");
    } else {
      showAlert("Invalid username or password");
    }
  }
}

// ---------- Registration Function ----------
async function register() {
  const email = document.getElementById("email_r").value.trim();
  const password = document.getElementById("password_r").value.trim();
  const password_v = document.getElementById("password_v").value.trim();
  const username = document.getElementById("username").value.trim();
  if (!username) {
    showAlert("Username cannot be empty");
    return;
  }
  if (!email) {
    showAlert("Email cannot be empty");
    return;
  }
  if (!password) {
    showAlert("Password cannot be empty");
    return;
  }
  if (password.length < 6) {
    showAlert("Password must be at least 6 characters long.");
    return;
  }
  if (password !== password_v) {
    showAlert("Passwords do not match. Please re-enter your password.");
    return;
  }
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    const userDocRef = doc(db, "User", user.uid);
    const userData = {
      username: username,
      email: email,
      scores: 0,
      medals: null,
      streaks: 1,
      lastSignedIn: new Date(),
      icon: null
    };
    await setDoc(userDocRef, {});
    await setDoc(doc(collection(userDocRef, "UserInfo"), "Profile"), userData);
    // Initialize empty collections (if needed)
    await setDoc(doc(collection(userDocRef, "Game"),), {});
    await setDoc(doc(collection(userDocRef, "BookShelf"),), {});
    showAlert("Registration successful! Welcome to Rabbit Hole.");
    closePopup();
  } catch (error) {
    console.error(error.message);
    if (error.code === 'auth/email-already-in-use') {
      showAlert("This email is already registered. Please try logging in or use another email.");
    } else if (error.code === 'auth/invalid-email') {
      showAlert("Invalid email format. Please enter a valid email.");
    } else {
      showAlert("Registration failed: " + error.message);
    }
  }document.querySelector(".username").textContent = username;

}

// ---------- Logout Function ----------
function logout(msg) {
  signOut(auth)
    .then(() => {
      if (msg) {
        alert(msg);
      } else {
        showAlert("Logged out, see you later.");
      }
    })
    .catch(error => {
      console.error("Error logging out:", error.message);
    });
}

// ---------- Book reading window ----------

async function showBookActionWindow(book) {
  let floatingDiv = document.getElementById("bookActionWindow");
  if (!floatingDiv) {
    floatingDiv = document.createElement("div");
    floatingDiv.id = "bookActionWindow";
    Object.assign(floatingDiv.style, {
      position: "fixed",
      top: "5px",
      right: "5px",
      backgroundColor: "#fff",
      border: "1px solid #ccc",
      padding: "10px",
      boxShadow: "0 2px 5px rgba(0,0,0,0.3)",
      zIndex: "2000"
    });
    document.body.appendChild(floatingDiv);
  }
  
  const user = auth.currentUser;
  if (!user) {
    floatingDiv.innerHTML = `<button onclick="Login()">Sign in to add to shelf</button>`;
    showBookActionWindow(book);
    return;
  }

  const bookId = book.bookid || (book.ia ? book.ia[0] : undefined);
  if (!bookId) {
    console.error("Book ID is missing.");
    showAlert("Error: Book data is incomplete.", "#f44336", 3);
    return;
  }
  
  console.log("Checking book ID:", bookId);

  const docRef = doc(db, "User", user.uid, "BookShelf", bookId);
  let exists = false;
  let totalRead = 0;
  let thisWeekRead = 0;
  let lastMondayStored = null;

  try {
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      exists = true;
      const bookData = docSnap.data();
      totalRead = bookData.totalRead || 0;
      thisWeekRead = bookData.thisWeekRead || 0;
      lastMondayStored = bookData.weekStart ? new Date(bookData.weekStart.toDate()) : getLastMonday();
    }
  } catch (error) {
    console.error("Error checking bookshelf:", error);
  }

  // Get the current week's Monday
  const currentMonday = getLastMonday();
  const daysDifference = Math.floor((currentMonday - lastMondayStored) / (1000 * 60 * 60 * 24));

  // Reset weekly reading if today’s Monday is different from stored Monday and the gap is ≥7 days
  if (daysDifference >= 7) {
    thisWeekRead = 0;
    lastMondayStored = currentMonday;
  }

  if (exists) {
    // Retrieve profile data from Firestore.
    const profileRef = doc(db, "User", user.uid, "UserInfo", "Profile");
    const profileSnap = await getDoc(profileRef);
    const profileData = profileSnap.exists() ? profileSnap.data() : {};
    const username = profileData.username || "User";
    
    floatingDiv.innerHTML = `
    <p>Signed in as ${username}</p>
    <p><strong>Total Reading Time:</strong> <span id="totalReadTime">${totalRead.toFixed(2)}</span> </p>
    <p><strong>Reading Time This Week:</strong> <span id="thisWeekReadTime">${thisWeekRead.toFixed(2)}</span> </p>
    <p id="activity-warning" style="color: red; display: none;">Inactive! Tracking paused.</p>
    <button id="removeShelfButton">Delete from Bookshelf</button>
  `;
  
    document.getElementById("removeShelfButton").onclick = () => removeFromShelf(book);
    trackReadingTime(user.uid, bookId, totalRead, thisWeekRead, lastMondayStored);
  } else {
    // In case the book doesn't exist in bookshelf, retrieve the username similarly.
    const profileRef = doc(db, "User", user.uid, "UserInfo", "Profile");
    const profileSnap = await getDoc(profileRef);
    const profileData = profileSnap.exists() ? profileSnap.data() : {};
    const username = profileData.username || "User";
  
    floatingDiv.innerHTML = `
      <p>Signed in as ${username}</p>
      <button id="addShelfButton">Add to Bookshelf</button>
    `;
    document.getElementById("addShelfButton").onclick = () => addToShelf(book);
  }
  

  console.log("Book Details:", book);
}

let trackingInterval;
let inactivityTimeout;
let readNowSeconds = 0;
let readNowInterval;
let track = true;
function trackReadingTime(userId, bookId, totalRead, thisWeekRead, weekStart) {
  if (!userId || !bookId) {
    console.error("Missing userId or bookId");
    return;
  }
  
  let activeStart = Date.now();
  const reader = document.getElementById("reader");

  
  // Called whenever an activity event occurs.
  function onActivity() {
    if (!reader || window.getComputedStyle(reader).display !== "block") {
      return; // Do nothing if reader is hidden.
    }
    const computedStyle = window.getComputedStyle(reader);
    const warningElem = document.getElementById("activity-warning");
  
    if (track) {
  
      // If a warning is shown, resume tracking.
      if (warningElem && warningElem.style.display === "block") {
        activeStart = Date.now();
        startTracking();
        if (warningElem) warningElem.style.display = "none";
      }
      // Reset inactivity timeout.
      clearTimeout(inactivityTimeout);
      inactivityTimeout = setTimeout(() => {
        clearInterval(trackingInterval);
        clearInterval(readNowInterval);
        if (warningElem) {
          warningElem.style.display = "block";
          console.log("inactivity detected");
        }
      }, 20000);
      
      // Stop tracking if the reader is not visible.

    }
  }
  
  function updateUI() {
    const totalReadElement = document.getElementById("totalReadTime");
    const thisWeekReadElement = document.getElementById("thisWeekReadTime");
    if (totalReadElement && thisWeekReadElement) {
      totalReadElement.innerText = `${totalRead.toFixed(2)} hours`;
      thisWeekReadElement.innerText = `${thisWeekRead.toFixed(2)} hours`;
    }
  }
  
  // Displays a discreet notification at the top-right.
  function showLongReadingNotification() {
    let notif = document.getElementById("longReadingNotification");
    if (!notif) {
      notif = document.createElement("div");
      notif.id = "longReadingNotification";
      Object.assign(notif.style, {
        position: "fixed",
        top: "10px",
        right: "10px",
        backgroundColor: "rgba(255,165,0,0.9)",
        color: "#fff",
        padding: "8px 12px",
        borderRadius: "4px",
        zIndex: "2100",
        fontSize: "14px",
        boxShadow: "0 2px 4px rgba(0,0,0,0.3)"
      });
      notif.innerHTML = "You've been reading continuously for 30 sec.<br>Consider taking a break.";
      document.body.appendChild(notif);
      // Remove the notification after 5 seconds.
      setTimeout(() => {
        if (notif) notif.remove();
      }, 5000);
    }
  }
  
  // Starts an interval that updates the continuous active reading counter every second.
 
  
  // Starts the interval that checks active reading time and updates Firestore.
  function startTracking() {

    stopTracking();
    track=true;
    readNowInterval = setInterval(async() => {
      if (!reader || window.getComputedStyle(reader).display !== "block") {
        return; // Do nothing if reader is hidden.
      }
      readNowSeconds++;
      // Every 30 seconds, show a notification and reset the counter.
      if (readNowSeconds >= 30) {
        showLongReadingNotification();
        readNowSeconds = 0;
      }
    }, 1000);
    trackingInterval = setInterval(async () => {
      const computedStyle = window.getComputedStyle(reader);
      if (computedStyle.display === "none") {
        stopTracking();
        return;
      }
      
      const now = Date.now();
      const activeTimeMs = now - activeStart;
      console.log(`Active Time: ${(activeTimeMs / 1000).toFixed(2)} sec`);
      
      // If at least 1 minute of active reading has passed.
      if (activeTimeMs >= 60000) {
        const hoursToAdd = activeTimeMs / (1000 * 60 * 60); // Convert ms to hours
        const currentMonday = getLastMonday();
        console.log("Current Monday:", currentMonday.getTime(), "Stored weekStart:", weekStart.getTime());
        if (currentMonday.getTime() !== weekStart.getTime()) {
          thisWeekRead = 0;  // Reset weekly reading
          weekStart = currentMonday;
        }
        
        try {
          const docRef = doc(db, "User", userId, "BookShelf", bookId);
          await setDoc(docRef, {
            totalRead: totalRead + hoursToAdd,
            thisWeekRead: thisWeekRead + hoursToAdd,
            weekStart: weekStart
          }, { merge: true });
          console.log(`Added ${hoursToAdd.toFixed(2)} hours to reading time.`);
          totalRead += hoursToAdd;
          thisWeekRead += hoursToAdd;
          updateUI();
        } catch (error) {
          console.error("Error updating reading time:", error);
        }
        activeStart = Date.now();
      }
    }, 60000); // Check every 1 minute.
  }
  
  // Stops the tracking process and clears the continuous reading counter.
  function stopTracking() {
    if (trackingInterval !== null) {
      clearInterval(trackingInterval);
      trackingInterval = null;
    }
    if (readNowInterval !== null) {
      clearInterval(readNowInterval);
      readNowInterval = null;
    }
    if (inactivityTimeout !== null) {
      clearTimeout(inactivityTimeout);
      inactivityTimeout = null;
    }
    track = false;
    readNowSeconds = 0;
    console.log("Reading tracking stopped.");
  }
  
 
  window.addEventListener("mousemove", onActivity);
  window.addEventListener("keydown", onActivity);
  window.addEventListener("click", onActivity);
  
  startTracking();
  onActivity();
}

// Get the last Monday's date (Monday is the start of the week)
function getLastMonday() {
  const now = new Date();
  const day = now.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  const diff = now.getDate() - day + (day === 0 ? -6 : 1); // Adjust for Sunday.
  return new Date(now.setDate(diff));
}

  
  
// Firebase-dependent: Add the current book to the user's bookshelf in Firestore.
async function addToShelf(book) {
    const user = auth.currentUser;
   
    // Construct book data using the properties returned by the API.
    const bookData = {
      bookName: book.title || "No Title",
      bookid: book.ia[0],
      bookUrl: "https://archive.org/embed/${"+book.ia[0]+"}?ui=embed",
      coverUrl: book.cover_i 
        ? `https://covers.openlibrary.org/b/id/${book.cover_i}-M.jpg`
        : "./imgs/default_cover.png",
      totalRead: 0,      // Initial total read time (in seconds)
      thisWeekRead: 0,    // Initial this-week read (in seconds)
      lastMondayStored: getLastMonday(),
    };
  
    // Use book.key as the document ID (ensuring it's a valid string).
    const bookId = book.ia[0];
    if (!bookId) {
      console.error("Book key is missing. Cannot add to shelf.");
      showAlert("Error: Book data is incomplete.", "#f44336", 3);
      return;
    }
  
    try {
      await setDoc(doc(db, "User", user.uid, "BookShelf", bookId), bookData, { merge: true });
      showAlert("Book added to your shelf!", "#4CAF50", 3);
      showBookActionWindow(book);
    } catch (error) {
      console.error("Error adding to shelf:", error.message);
      showAlert("Error adding book to shelf.", "#f44336", 3);
    }
  }
    
  // Firebase-dependent: Remove the current book from the user's bookshelf in Firestore.
  async function removeFromShelf(book) {
    const user = auth.currentUser;
    if (!user) {
      promptSignIn();
      return;
    }
    const bookId = book.ia[0];
    if (!bookId) {
      console.error("Book key is missing. Cannot remove from shelf.");
      showAlert("Error: Book data is incomplete.", "#f44336", 3);
      return;
    }
    try {
      await deleteDoc(doc(db, "User", user.uid, "BookShelf", bookId));
      showAlert("Book removed from your shelf.", "#4CAF50", 3);
      showBookActionWindow(book);
    } catch (error) {
      console.error("Error removing book from shelf:", error.message);
      showAlert("Error removing book from shelf.", "#f44336", 3);
    }
  } 
  // ---------- Bookshelf/leaderbroad ----------
  // Toggle between Leaderboard and Bookshelf views in the right box.
// Use "leaderboard" as the initial state.
var BS_LB = "leaderboard";

// Check if the user is signed in and display the appropriate right box.
async function Check() {
  const user = auth.currentUser;
  const rightbox = document.querySelector(".leaderboard");

  if (user) {
    // Create a toggle button with absolute positioning on the top left of rightbox.
    // Use the event parameter to capture the button
  

    // Append the toggle button to rightbox and set rightbox initial content as leaderboard.
    rightbox.innerHTML=`
    <button id="switch" onclick="Myfunction.toggleRightboxView()">Switch to Bookshelf</button>
        <h3 style="margin-top: 0;">Time-based Leaderboard</h3>
        <div class="leaderboard-section">
          <h4>Weekly</h4>
          <ul>
            <li>1. Alice - 15h</li>
            <li>2. Bob - 12h</li>
            <li>3. Charlie - 10h</li>
          </ul>
        </div>
        <div class="leaderboard-section">
          <h4>Subtotal</h4>
          <ul>
            <li>1. Alice - 100h</li>
            <li>2. Bob - 85h</li>
            <li>3. Charlie - 75h</li>
          </ul>
        </div>
        <h3>Score-based Leaderboard</h3>
        <div class="leaderboard-section">
          <h4>Weekly</h4>
          <ul>
            <li>1. Alice - 5000 pts</li>
            <li>2. Bob - 4500 pts</li>
            <li>3. Charlie - 4000 pts</li>
          </ul>
        </div>
        <div class="leaderboard-section">
          <h4>Subtotal</h4>
          <ul>
            <li>1. Alice - 50000 pts</li>
            <li>2. Bob - 42000 pts</li>
            <li>3. Charlie - 39000 pts</li>
          </ul>
        </div>
    `;
  } else {
    // If no user is signed in, simply show the leaderboard.
    rightbox.innerHTML = `
        <h3>Time-based Leaderboard</h3>
        <div class="leaderboard-section">
          <h4>Weekly</h4>
          <ul>
            <li>1. Alice - 15h</li>
            <li>2. Bob - 12h</li>
            <li>3. Charlie - 10h</li>
          </ul>
        </div>
        <div class="leaderboard-section">
          <h4>Subtotal</h4>
          <ul>
            <li>1. Alice - 100h</li>
            <li>2. Bob - 85h</li>
            <li>3. Charlie - 75h</li>
          </ul>
        </div>
        <h3>Score-based Leaderboard</h3>
        <div class="leaderboard-section">
          <h4>Weekly</h4>
          <ul>
            <li>1. Alice - 5000 pts</li>
            <li>2. Bob - 4500 pts</li>
            <li>3. Charlie - 4000 pts</li>
          </ul>
        </div>
        <div class="leaderboard-section">
          <h4>Subtotal</h4>
          <ul>
            <li>1. Alice - 50000 pts</li>
            <li>2. Bob - 42000 pts</li>
            <li>3. Charlie - 39000 pts</li>
          </ul>
        </div>
    `;
  }
}

// Toggle between the leaderboard view and the bookshelf view.
async function toggleRightboxView() {
  // Use the event target as the switchButton.
  const rightbox = document.querySelector(".leaderboard");

  if (BS_LB === "leaderboard") {
    BS_LB = "bookshelf";
  
    const user = auth.currentUser;
    if (!user) return; // In case the user is not signed in

    // Fetch books from Firestore.
    const userBookshelfRef = collection(db, "User", user.uid, "BookShelf");
    const booksSnapshot = await getDocs(userBookshelfRef);
    const books = [];
    booksSnapshot.forEach(doc => {
      const data = doc.data();
      books.push({ id: doc.id, ...data });
    });

    const itemsPerPage = 10;
    let currentPage = 1;

    function renderBooksPage(page) {
      // Clear rightbox but preserve the switch button.
      rightbox.innerHTML = `<button id="switch" onclick="Myfunction.toggleRightboxView()">Switch to Leaderboard</button>`;
      
      const startIndex = (page - 1) * itemsPerPage;
      const endIndex = Math.min(startIndex + itemsPerPage, books.length);
    
      // Loop over the paginated books.
      for (let i = startIndex; i < endIndex; i++) {
        const book = books[i];
    if(books[i].bookName!=undefined){//check if this book have a book id

        // Create a section for this individual book.
        const section = document.createElement("div");
        section.className = "leaderboard-section";
        section.style.border = "1px solid #ccc";
        section.style.padding = "10px";
        section.style.marginBottom = "10px";
    
        // Create a flex container to hold the left and right parts.
        const flexContainer = document.createElement("div");
        flexContainer.style.display = "flex";
        flexContainer.style.alignItems = "center";
        flexContainer.style.gap="10px";
        flexContainer.style.justifyContent = "space-between";
    
        // Left container: book name and read button (vertical stack).
        const leftContainer = document.createElement("div");
        leftContainer.style.display = "flex";
        leftContainer.style.flexDirection = "column";
        leftContainer.style.justifyContent = "center";
        leftContainer.style.gap = "10px"; // spacing between name and button
    
        const bookName = document.createElement("span");
        bookName.innerText = book.bookName || book.title || "No Title";
        bookName.style.fontWeight = "bold";
        bookName.style.fontSize = "1.1em";
    
        const readBtn = document.createElement("button");
        readBtn.className = "read-button";
        readBtn.textContent = "Read";
        readBtn.addEventListener("click", () => {
          Myfunction.showBookActionWindow(book);
          togglereader();
          const iaId = book.bookid || (book.ia ? book.ia[0] : undefined);
          if (iaId) {
            const embedUrl = `https://archive.org/embed/${iaId}?ui=embed`;
            const readerDiv = document.getElementById("reader");
            if (readerDiv) {
              readerDiv.innerHTML = `
                <button class="close-button" onclick="togglereader()">Close</button>
                <h2>Reading: ${book.bookName || book.title}</h2>
                <iframe src="${embedUrl}" frameborder="0" allowfullscreen></iframe>
              `;
              readerDiv.scrollIntoView({ behavior: "smooth" });
            }
          }
        });
    
        leftContainer.appendChild(bookName);
        leftContainer.appendChild(readBtn);
    
        // Right container: cover image.
        const rightContainer = document.createElement("div");
        const coverImg = document.createElement("img");
        coverImg.src = book.coverUrl || "/imgs/default_cover.png";
        coverImg.alt = book.bookName || book.title || "Book Cover";
        coverImg.style.width = "100px"; // adjust as needed
        coverImg.style.objectFit = "cover";
        rightContainer.appendChild(coverImg);
    
        // Append the left and right containers to the flex container.
        flexContainer.appendChild(rightContainer);
        flexContainer.appendChild(leftContainer);
    
        // Append the flex container to the section.
        section.appendChild(flexContainer);
    
        // Append the section to the rightbox.
        rightbox.appendChild(section);
      }
      }
    
      // Add pagination controls if necessary.
      if (books.length > itemsPerPage) {
        const paginationDiv = document.createElement("div");
        paginationDiv.className = "pagination";
    
        if (page > 1) {
          const prevBtn = document.createElement("button");
          prevBtn.innerText = "Previous";
          prevBtn.addEventListener("click", () => renderBooksPage(page - 1));
          paginationDiv.appendChild(prevBtn);
        }
    
        if (endIndex < books.length) {
          const nextBtn = document.createElement("button");
          nextBtn.innerText = "Next";
          nextBtn.addEventListener("click", () => renderBooksPage(page + 1));
          paginationDiv.appendChild(nextBtn);
        }
    
        rightbox.appendChild(paginationDiv);
      }
    }
    
    
    renderBooksPage(currentPage);
  } else {
    // Switch back to leaderboard view.
    BS_LB = "leaderboard";

    rightbox.innerHTML =`
    <button id="switch" onclick="Myfunction.toggleRightboxView()">Switch to Bookshelf</button>
      <h3 style="margin-top: 0;">Time-based Leaderboard</h3>
      <div class="leaderboard-section">
        <h4>Weekly</h4>
        <ul>
          <li>1. Alice - 15h</li>
          <li>2. Bob - 12h</li>
          <li>3. Charlie - 10h</li>
        </ul>
      </div>
      <div class="leaderboard-section">
        <h4>Subtotal</h4>
        <ul>
          <li>1. Alice - 100h</li>
          <li>2. Bob - 85h</li>
          <li>3. Charlie - 75h</li>
        </ul>
      </div>
      <h3>Score-based Leaderboard</h3>
      <div class="leaderboard-section">
        <h4>Weekly</h4>
        <ul>
          <li>1. Alice - 5000 pts</li>
          <li>2. Bob - 4500 pts</li>
          <li>3. Charlie - 4000 pts</li>
        </ul>
      </div>
      <div class="leaderboard-section">
        <h4>Subtotal</h4>
        <ul>
          <li>1. Alice - 50000 pts</li>
          <li>2. Bob - 42000 pts</li>
          <li>3. Charlie - 39000 pts</li>
        </ul>
      </div>
    `;
  }
}
async function loadUserInfo() {
  const user = auth.currentUser;
  if (!user)  return;
  
  const profileRef = doc(db, "User", user.uid, "UserInfo", "Profile");
  try {
    const profileSnap = await getDoc(profileRef);
    const profileData = profileSnap.exists() ? profileSnap.data() : {};
    const username = profileData.username || "User";
    const usericon = profileData.icon || "./imgs/rabbit.png";
    // Update your user_info div.
    document.getElementById("icon").innerHTML = `<img src="${usericon}" alt="User Icon" style="border: 1px black solid; width: 150px; border-radius: 50%;">`;
    document.getElementById("username").innerText = username;
    document.getElementById("username").style.fontSize="24px";
    document.getElementById("username").style.margin="20px";

  } catch (error) {
    console.error("Error fetching profile:", error);
    showAlert("Error fetching user profile.", "#f44336", 3);
  }
}

function editprofile() {
  const user = auth.currentUser;
  if (!user) {
    showAlert("Please sign in first.", "#f44336", 3);
    return;
  }
  
  const profileRef = doc(db, "User", user.uid, "UserInfo", "Profile");
  
  // Fetch current profile data.
  getDoc(profileRef)
    .then((docSnap) => {
      let profileData = {};
      if (docSnap.exists()) {
        profileData = docSnap.data();
      }
      const currentUsername = profileData.username || "";
      const currentEmail = profileData.email || "";
      const currentIcon = profileData.icon || "./imgs/rabbit.png";
      
      // Create an overlay modal.
      const modal = document.createElement("div");
      modal.id = "editProfileModal";
      Object.assign(modal.style, {
        position: "fixed",
        top: "0",
        left: "0",
        width: "100%",
        height: "100%",
        backgroundColor: "rgba(0,0,0,0.5)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: "3000"
      });
      
      // Create a content container for the form.
      const content = document.createElement("div");
      Object.assign(content.style, {
        backgroundColor: "#fff",
        padding: "20px",
        borderRadius: "8px",
        width: "400px",
        boxShadow: "0 2px 10px rgba(0,0,0,0.3)"
      });
      
      content.innerHTML = `
        <h2>Edit Profile</h2>
        <form id="editProfileForm">
          <div style="margin-bottom:10px;">
            <label for="editUsername">Username:</label><br>
            <input type="text" id="editUsername" name="username" value="${currentUsername}" style="width: 100%; padding: 5px;">
          </div>
          <div style="margin-bottom:10px;">
            <label for="editEmail">Email:</label><br>
            <input type="email" id="editEmail" name="email" value="${currentEmail}" style="width: 100%; padding: 5px;">
          </div>
          <div style="margin-bottom:10px;">
            <label for="editPassword">New Password:</label><br>
            <input type="password" id="editPassword" name="password" value="" style="width: 100%; padding: 5px;">
          </div>
          <div style="margin-bottom:10px;">
            <label for="editConfirmPassword">Confirm Password:</label><br>
            <input type="password" id="editConfirmPassword" name="confirmPassword" value="" style="width: 100%; padding: 5px;">
          </div>
          <div style="margin-bottom:10px;">
            <label for="editIcon">Icon (Image):</label><br>
            <input type="file" id="editIcon" accept="image/*">
            <br>
            <img id="previewIcon" src="${currentIcon}" alt="Current Icon" style="width: 80px; margin-top: 10px;">
          </div>
          <div style="text-align: right;">
            <button type="button" id="cancelEdit">Cancel</button>
            <button type="submit">Save</button>
          </div>
        </form>
      `;
      
      modal.appendChild(content);
      document.body.appendChild(modal);
      
      // Preview new icon image.
      document.getElementById("editIcon").addEventListener("change", function(e) {
        const file = e.target.files[0];
        if (file) {
          const reader = new FileReader();
          reader.onload = function(ev) {
            document.getElementById("previewIcon").src = ev.target.result;
          };
          reader.readAsDataURL(file);
        }
      });
      
      // Cancel button.
      document.getElementById("cancelEdit").addEventListener("click", function() {
        document.body.removeChild(modal);
      });
      
      // Form submission.
      document.getElementById("editProfileForm").addEventListener("submit", async function(e) {
        e.preventDefault();
        const newUsername = document.getElementById("editUsername").value.trim();
        const newEmail = document.getElementById("editEmail").value.trim();
        const newPassword = document.getElementById("editPassword").value;
        const confirmPassword = document.getElementById("editConfirmPassword").value;
        const newIcon = document.getElementById("previewIcon").src;
        
        
        // Prepare updated data.
        const updatedData = {
          username: newUsername,
          email: newEmail,
          icon: newIcon
        };
        
        try {
          await setDoc(profileRef, updatedData, { merge: true });
          showAlert("Profile updated successfully.", "#4CAF50", 3);
          // Update the user_info section.
          document.getElementById("icon").innerHTML = `<img src="${newIcon}" alt="User Icon" style="width:80px;">`;
          document.getElementById("username").innerText = newUsername;
          document.body.removeChild(modal);
        } catch (error) {
          console.error("Error updating profile:", error);
          showAlert("Error updating profile.", "#f44336", 3);
        } 
        if(newPassword.length===0){

        }
        else if ( newPassword !== confirmPassword) {
          showAlert("Passwords do not match.", "#f44336", 3);
          return;
        }else{
          console.log(newPassword.length);
          updateUserPassword(newPassword,confirmPassword);
        }
      });
      
    })
    .catch((err) => {
      console.error("Error fetching profile:", err);
      showAlert("Error fetching profile.", "#f44336", 3);
    });
}
async function updateUserPassword(newPassword, confirmPassword) {
  const user = auth.currentUser;
  if (!user) {
    showAlert("You must be logged in to update your password.", "#f44336", 3);
    return;
  }

  if (newPassword !== confirmPassword) {
    showAlert("Passwords do not match!", "#f44336", 3);
    return;
  }

  try {
    await updatePassword(user, newPassword);
    showAlert("Password updated successfully!", "#4CAF50", 3);
  } catch (error) {
    if (error.code === "auth/requires-recent-login") {
      showAlert("Please log in again before changing your password.", "#f44336", 3);
    } else {
      showAlert(`Error: ${error.message}`, "#f44336", 3);
    }
  }
}

async function calculateTotalReadingTime(userId) {
  const bookshelfRef = collection(db, "User", userId, "BookShelf");
  const bookshelfSnap = await getDocs(bookshelfRef);
  let totalReadingTime = 0;
  bookshelfSnap.forEach(doc => {
    const data = doc.data();
    console.log("a"+ data.totalRead);
    if (data.totalRead) {
      totalReadingTime += data.totalRead; // assuming totalRead is in hours
    }
  });

  return totalReadingTime;
}

async function loadProfileSummary() {
  const user = auth.currentUser;
  if (!user) return;
  console.log("loading")
  // Assume you have functions to calculate total reading time from the bookshelf,
  // and that the user profile contains a "streaks" attribute.
  const totalReadingTime = await calculateTotalReadingTime(user.uid); // e.g., in hrs
  const profileRef = doc(db, "User", user.uid, "UserInfo", "Profile");
  const profileSnap = await getDoc(profileRef);
  const profileData = profileSnap.exists() ? profileSnap.data() : {};
  const streaks = profileData.streaks || 0;
  
  // Update the UI elements
  document.getElementById("totalReadingTime").innerText = totalReadingTime.toFixed(2) + " hrs";
  document.getElementById("streaks").innerText = streaks + " days";
  document.getElementById("gameScore").innerText = "0";
}

// Call loadProfileSummary when needed, for example on page load:
document.addEventListener("DOMContentLoaded", loadProfileSummary);



  
  // ---------- Utility Functions & Global Exposure ----------


const Myfunction = {
  login,
  register,
  logout,
  checkUserStatus,
  showBookActionWindow,
  toggleRightboxView,
  editprofile
};

window.Myfunction = Myfunction;
window.onload = () => {
  checkUserStatus();
};