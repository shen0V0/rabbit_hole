import { initializeApp } from "https://www.gstatic.com/firebasejs/11.3.1/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/11.3.1/firebase-analytics.js";
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, onAuthStateChanged } 
from "https://www.gstatic.com/firebasejs/11.3.1/firebase-auth.js";

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
let isAlertActive = false; // Tracks whether an alert is already shown

function showAlert(message) {
    if (!isAlertActive) {
        isAlertActive = true;
        alert(message);
        isAlertActive = false;
    }
}

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth(app);

// Function to handle user authentication state
function checkUserStatus() {
    const userDiv = document.querySelector(".User");
    onAuthStateChanged(auth, (user) => {
        if (user) {
            // User is logged in
            const username = user.email || "User"; // Fallback if username is not set
            userDiv.innerHTML = `
                <div class="user-info">
                    <span class="username">${username}</span>
                    <button onclick="Myfunction.logout()">Logout</button>
                </div>
            `;
        } else {
            // User is not logged in
            userDiv.innerHTML = `
            <div class="login">
                <input type="email" id="email" placeholder="Enter your email">
                <input type="password" id="password" placeholder="Enter your password">
                </div>
                <button onclick="Myfunction.login()">Login</button>
                <button onclick="Myfunction.register()">Register</button>
            `;
        }
    });
}

// Function to handle Email/Password login
function login() {
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value.trim();
    var x=true;

    if (!email) {
        showAlert("Username cannot be empty");
        return;
    }
    else if (!password) {
        showAlert("Password cannot be empty");
        return;
    }else{

    // Firebase login
    signInWithEmailAndPassword(auth, email, password)
    .then(() => {
        if(x){
        showAlert("Login successful! Welcome back.")
    }}).catch(error => {
            x==false;
            console.log(error.message);
            if (error.code === 'auth/wrong-password') {
                showAlert("Invalid password. Please try again.");
            } else if (error.code === 'auth/user-not-found') {
                showAlert("No user found with this email. Please register.");
            } else {
                showAlert("invaild username or password");
            }
        });
    } 
}


// Function to register a new user
function register() {
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value.trim();
    var x=true;
    if (!email) {
        showAlert("Username cannot be empty");
    } else if (!password) {
        showAlert("Password cannot be empty");
    } else if (password.length < 6) {
        showAlert("Password must be at least 6 characters long.");
    } else {
        createUserWithEmailAndPassword(auth, email, password)
        .then(() => {
            if(x){
            showAlert("Registration successful! Welcome to rabbit hole.");
            }
        })
            .catch(error => {
                x=false;
                if (error.code === 'auth/email-already-in-use') {
                    showAlert("This email is already registered. Please try logging in or use another email.");
                } else if (error.code === 'auth/invalid-email') {
                    showAlert("Invalid email format. Please enter a valid email.");
                } else {
                    showAlert("Registration failed: " + error.message);
                }
            });
            
    }
}


// Function to log out
function logout() {
    signOut(auth)
        .then(() => {
            console.log("User logged out");
        })
        .catch(error => {
            console.error("Error logging out:", error.message);
        });
}

// Expose functions globally
const Myfunction = {
    login,
    register,
    logout,
    checkUserStatus
};

// Make functions available in HTML by attaching them to `window`
window.Myfunction = Myfunction;

// Run checkUserStatus on page load
window.onload = () => {
    checkUserStatus();
};
