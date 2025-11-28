/*
Conversion Factors:
1 meter = 3.281 feet
1 liter = 0.264 gallon
1 kilogram = 2.204 pound
*/

const convBtn = document.getElementById("convert-btn");
const inputValue = document.getElementById("input-value");
const lengthResult = document.getElementById("length-result");
const volumeResult = document.getElementById("volume-result");
const massResult = document.getElementById("mass-result");

// Conversion factors
const conversionFactors = {
    meterToFeet: 3.281,
    feetToMeter: 1 / 3.281,
    literToGallon: 0.264,
    gallonToLiter: 1 / 0.264,
    kiloToPound: 2.204,
    poundToKilo: 1 / 2.204
};

// Format number to 3 decimal places
function formatNumber(num) {
    return Number(num.toFixed(3));
}

// Convert units and update display
function convertUnits() {
    const value = parseFloat(inputValue.value);
    
    // Validate input
    if (isNaN(value) || value < 0) {
        alert("Please enter a valid positive number");
        inputValue.value = "";
        resetResults();
        return;
    }
    
    // Length conversion
    const metersToFeet = formatNumber(value * conversionFactors.meterToFeet);
    const feetToMeters = formatNumber(value * conversionFactors.feetToMeter);
    lengthResult.textContent = `${value} meters = ${metersToFeet} feet | ${value} feet = ${feetToMeters} meters`;
    
    // Volume conversion
    const litersToGallons = formatNumber(value * conversionFactors.literToGallon);
    const gallonsToLiters = formatNumber(value * conversionFactors.gallonToLiter);
    volumeResult.textContent = `${value} liters = ${litersToGallons} gallons | ${value} gallons = ${gallonsToLiters} liters`;
    
    // Mass conversion
    const kilosToPounds = formatNumber(value * conversionFactors.kiloToPound);
    const poundsToKilos = formatNumber(value * conversionFactors.poundToKilo);
    massResult.textContent = `${value} kilos = ${kilosToPounds} pounds | ${value} pounds = ${poundsToKilos} kilos`;
}

// Reset results to default state
function resetResults() {
    lengthResult.textContent = "Enter a value to convert";
    volumeResult.textContent = "Enter a value to convert";
    massResult.textContent = "Enter a value to convert";
}

// Event listener for convert button
convBtn.addEventListener("click", convertUnits);

// Event listener for Enter key
inputValue.addEventListener("keypress", function(event) {
    if (event.key === "Enter") {
        convertUnits();
    }
});

// Event listener for input changes to reset if empty
inputValue.addEventListener("input", function() {
    if (this.value === "") {
        resetResults();
    }
});

// Initialize with a default value or example
window.addEventListener('load', function() {
    inputValue.focus();
});

// Add input validation to prevent negative numbers
inputValue.addEventListener('change', function() {
    if (this.value < 0) {
        this.value = Math.abs(this.value);
    }
});