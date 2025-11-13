let firstCard = 11
let secondCard = 9
let sum = firstCard + secondCard

if (sum < 21){
    console.log("Do you want to draw new card? 🙂")
}
else if (sum === 21){
    console.log("Wohoo! You've the blackjack! 🥳")
}
else if (sum > 21){
    console.log("You're out of the game! 😭")
}

