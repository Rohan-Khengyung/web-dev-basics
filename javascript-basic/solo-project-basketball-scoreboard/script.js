
let homeScore = document.getElementById("home-score")
let guestScore = document.getElementById("guest-score")

//Home function
let addOne = 0
let addTwo = 0
let addThree = 0
function plusOne(){
    addOne += 1
    let scoreOne = addOne + addTwo + addThree
    homeScore.textContent = scoreOne
}
function plusTwo(){
    addTwo += 2
    let scoreTwo = addOne + addTwo + addThree
    homeScore.textContent = scoreTwo
}
function plusThree(){
    addThree += 3
    let scoreThree = addOne + addTwo + addThree
    homeScore.textContent = scoreThree
}



//Guest functions
let addOnes = 0
let addTwos = 0
let addThrees = 0
function plusOnes(){
    addOnes += 1
    let scoreOnes = addOnes + addTwos + addThrees
    guestScore.textContent = scoreOnes
}
function plusTwos(){
    addTwos += 2
    let scoreTows = addOnes + addTwos + addThrees
    guestScore.textContent = scoreTows
}
function plusThrees(){
    addThrees += 3
    let scoreThrees = addOnes + addTwos + addThrees
    guestScore.textContent = scoreThrees
}

//Next Game
function nextGame(){
    addOne = 0
    addTwo = 0
    addThree = 0
    addOnes = 0
    addTwos = 0
    addThrees = 0
    guestScore.textContent = 0
    homeScore.textContent = 0
}