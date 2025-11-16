
const characters = ["A","B","C","D","E","F","G","H","I","J","K","L","M","N","O","P","Q","R","S","T","U","V","W","X","Y","Z"
    ,"a","b","c","d","e","f","g","h","i","j","k","l","m","n","o","p","q","r","s","t","u","v","w","x","y","z",
     "0", "1", "2", "3", "4", "5", "6", "7", "8", "9",
     "~","`","!","@","#","$","%","^","&","*","(",")","_","-","+","=","{","[","}","]",",","|",":",";","<",">",".","?","/"];

let passwordElOne = document.getElementById("password-one")
let passwordElTwo = document.getElementById("password-two")

let passwordLength = 15
// takes out the random characters from the constant array 'characters'
function getRandomCharacter(){
    let randomChar = Math.floor(Math.random() * characters.length)
    return characters[randomChar]
}     
getRandomCharacter()


function getRandomPassword(){ // function to create random password
    let randomPassword = "" // empty strings
    for(i = 0; i < passwordLength; i++){ // starts the loop then end at 15 range which is passwordLenght
        randomPassword += getRandomCharacter() // takes the random character from the function getRandomCharacter() and adds the each random character of after another 14 times beacuse its goes upto only 14
     }
    return randomPassword
}
 
const generatedPasswordOne = getRandomPassword() // vairables that stores the getRandomPassword() function for the first password 

const generatedPasswordTwo = getRandomPassword() // vairables that stores the getRandomPassword() function for the second password 

// prints out the generatedPasswordOne and generatedPasswordTwo using the textCotent in the index.html docuemnts
function password(){
    passwordElOne.textContent = generatedPasswordOne
    passwordElTwo.textContent = generatedPasswordTwo
}