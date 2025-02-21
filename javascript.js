
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
