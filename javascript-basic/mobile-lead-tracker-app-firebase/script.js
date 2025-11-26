import { initializeApp } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-app.js"
import { getDatabase } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-database.js"
 
 const firebaseConfig = {
    databaseURL: "https://leads-tracker-app-181ea-default-rtdb.asia-southeast1.firebasedatabase.app/"
 }
 

const app = initializeApp(firebaseConfig)
const database = getDatabase(app)


const inputEl = document.getElementById("input-el")
const inputBtn = document.getElementById("input-btn")
const ulEl = document.getElementById("ul-el")
const deleteBtn = document.getElementById("delete-btn")



function render(leads) {
    let listItems = ""
    for (let i = 0; i < leads.length; i++) {
        listItems += `
            <li>
                <a target='_blank' href='${leads[i]}'>
                    ${leads[i]}
                </a>
            </li>
        `
    }
    ulEl.innerHTML = listItems
}


deleteBtn.addEventListener("dblclick", function() {
    myLeads = []
    render()
})

inputBtn.addEventListener("click", function() {
    myLeads.push(inputEl.value)
    inputEl.value = ""
    render()
})