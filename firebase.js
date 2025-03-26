import { initializeApp } from "https://www.gstatic.com/firebasejs/11.3.1/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, onAuthStateChanged } 
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
      session();
      // Retrieve user profile once
      const profileRef = doc(db, "User", user.uid, "UserInfo", "Profile");
      const profileSnap = await getDoc(profileRef);
      const profileData = profileSnap.exists() ? profileSnap.data() : {};
      const username = profileData.username || "User";
      const usericon = profileData.icon || "./imgs/rabbit.png";
      userDiv.innerHTML = `
        <div class="user-info">
          <img src="${usericon}" alt="User Icon">
          <span class="username">${username}</span>
          <button onclick="Myfunction.logout()">Logout</button>
        </div>
      `;
    } else {
      userDiv.innerHTML = `<button id="Login" onclick="Login()">Login</button>`;
    }
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

  const bookId = book.ia?.[0];
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

// Tracks reading time (active time only) and updates Firestore.
// Tracks reading time (active time only) and updates Firestore.
function trackReadingTime(userId, bookId, totalRead, thisWeekRead, weekStart) {
  if (!userId || !bookId) {
    console.error("Missing userId or bookId");
    return;
  }
  
  let activeStart = Date.now();
  let trackingInterval;
  let inactivityTimeout;
  
  // Variables for continuous active reading tracking.
  let readNowSeconds = 0;
  let readNowInterval;
  
  const reader = document.getElementById("reader");
  let track = true;
  
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
        }
      }, 30000);
      
      // Stop tracking if the reader is not visible.
      if (computedStyle.display === "none") {
        stopTracking();
      }
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
  function startReadNowInterval() {
    return setInterval(() => {
      readNowSeconds++;
      // Every 30 seconds, show a notification and reset the counter.
      if (readNowSeconds >= 30) {
        showLongReadingNotification();
        readNowSeconds = 0;
      }
    }, 1000);
  }
  
  // Starts the interval that checks active reading time and updates Firestore.
  function startTracking() {
    clearInterval(trackingInterval);
    // Start the continuous active counter.
    readNowInterval = startReadNowInterval();
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
    clearInterval(trackingInterval);
    clearTimeout(inactivityTimeout);
    clearInterval(readNowInterval);
    console.log("Reading tracking stopped.");
    readNowSeconds = 0;
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
  
  // ---------- Utility Functions & Global Exposure ----------


const Myfunction = {
  login,
  register,
  logout,
  checkUserStatus,
  showBookActionWindow
};

window.Myfunction = Myfunction;
window.onload = () => {
  checkUserStatus();
};