// intialize the count as 0 
// listen for clicks on the increment button
// increment the count variable when the button is clicked
// change the count-el in the HTML to reflect the new count

// document.getElementById("count-el").innerText = 5

// camelCase

let countEl = document.getElementById("count-el")

console.log(countEl)

let count = 0

function increment() {
    console.log("clicked")
    count += 1
    countEl.innerText = count
    console.log(count)
}

