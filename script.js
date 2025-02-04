const addBtns = document.querySelectorAll(".add-btn:not(.solid)");
const saveItemBtns = document.querySelectorAll(".solid");
const addItemContainers = document.querySelectorAll(".add-container");
const addItems = document.querySelectorAll(".add-item");
// Item Lists
const columnList = document.querySelectorAll(".drag-item-list");
const backlogList = document.getElementById("backlog-list");
const progressList = document.getElementById("progress-list");
const completeList = document.getElementById("complete-list");
const onHoldList = document.getElementById("on-hold-list");

// Items
let updatedOnLoad = false;

// Initialize Arrays
let backlogListArray = [];
let progressListArray = [];
let completeListArray = [];
let onHoldListArray = [];
let listArrays = [];

// Drag Functionality
let draggedItem;
let dragging = false;
let currentColumn;

// Get Arrays from localStorage if available, set default values if not
function getSavedColumns() {
  if (localStorage.getItem("backlogItems")) {
    backlogListArray = JSON.parse(localStorage.backlogItems);
    progressListArray = JSON.parse(localStorage.progressItems);
    completeListArray = JSON.parse(localStorage.completeItems);
    onHoldListArray = JSON.parse(localStorage.onHoldItems);
  } else {
    backlogListArray = ["Release the course", "Sit back and relax"];
    progressListArray = ["Work on projects", "Listen to music"];
    completeListArray = ["Being cool", "Getting stuff done"];
    onHoldListArray = ["Being uncool"];
  }
}

// Set localStorage Arrays
function updateSavedColumns() {
  listArrays = [
    backlogListArray,
    progressListArray,
    completeListArray,
    onHoldListArray,
  ];
  const arrayNames = ["backlog", "progress", "complete", "onHold"];

  arrayNames.forEach((arrayName, index) => {
    localStorage.setItem(
      `${arrayName}Items`,
      JSON.stringify(listArrays[index])
    );
  });
}

// Filter arrays to remove empty items
function filterArray(array) {
  const filteredArray = array.filter((item) => item !== null && item !== "");

  return filteredArray;
}

// Create DOM Elements for each list item
function createItemEl(columnEl, column, item, index) {
  // List Item
  const listEl = document.createElement("li");
  listEl.classList.add("drag-item");

  const wrapper = document.createElement("div");
  wrapper.classList.add("drag-item-wrapper");

  const content = document.createElement("span");
  content.textContent = item;
  content.contentEditable = true;
  content.setAttribute("onfocusout", `updateItem(${index}, ${column})`);

  const deleteBtn = document.createElement("button");
  deleteBtn.innerHTML = '<i class="fas fa-trash-alt"></i>';
  deleteBtn.classList.add("delete-btn");
  deleteBtn.setAttribute("onclick", `deleteItem(${index}, ${column})`);

  wrapper.appendChild(content);
  wrapper.appendChild(deleteBtn);
  listEl.appendChild(wrapper);

  listEl.draggable = true;
  listEl.setAttribute("ondragstart", "drag(event)");
  listEl.id = index;

  columnEl.appendChild(listEl);
}

function deleteItem(id, column) {
  const selectedArray = listArrays[column];
  selectedArray.splice(id, 1);
  updateDOM();
}

// Update Columns in DOM - Reset HTML, Filter Array, Update localStorage
function updateDOM() {
  // Check localStorage once
  if (!updatedOnLoad) {
    getSavedColumns();
  }

  // Backlog Column
  backlogList.textContent = "";
  backlogListArray.forEach((backlogItem, index) => {
    createItemEl(backlogList, 0, backlogItem, index);
  });

  // Progress Column
  progressList.textContent = "";
  progressListArray.forEach((progressItem, index) => {
    createItemEl(progressList, 1, progressItem, index);
  });

  // Complete Column
  completeList.textContent = "";
  completeListArray.forEach((completeItem, index) => {
    createItemEl(completeList, 2, completeItem, index);
  });

  // On Hold Column
  onHoldList.textContent = "";
  onHoldListArray.forEach((onHoldItem, index) => {
    createItemEl(onHoldList, 3, onHoldItem, index);
  });

  // Run getSavedColumns only once, Update Local Storage
  updatedOnLoad = true;
  updateSavedColumns();
}

// Update Item - Delete
function updateItem(id, column) {
  console.log(`Updating element ${id} -> colum ${column}`);
  const selectedArray = listArrays[column];
  const selectedColumnEl = columnList[column].children;
  if (!dragging) {
    if (!selectedColumnEl[id].textContent) {
      selectedArray.splice(id, 1);
    } else {
      selectedArray[id] = selectedColumnEl[id].textContent;
    }
    updateDOM();
  }
}

// Add to Column List
function addToColumn(column) {
  const itemText = addItems[column].textContent;
  const selectedArray = listArrays[column];
  selectedArray.push(itemText);
  addItems[column].textContent = "";
  updateDOM();
}

function showInputBox(column) {
  addBtns[column].style.visibility = "hidden";
  saveItemBtns[column].style.display = "flex";
  addItemContainers[column].style.display = "flex";
}

function hideInputBox(column) {
  addBtns[column].style.visibility = "visible";
  saveItemBtns[column].style.display = "none";
  addItemContainers[column].style.display = "none";
  addToColumn(column);
}

function rebuildArrays() {
  backlogListArray = filterArray(
    Array.from(backlogList.children).map((i) => i.textContent)
  );
  progressListArray = filterArray(
    Array.from(progressList.children).map((i) => i.textContent)
  );
  completeListArray = filterArray(
    Array.from(completeList.children).map((i) => i.textContent)
  );
  onHoldListArray = filterArray(
    Array.from(onHoldList.children).map((i) => i.textContent)
  );

  updateDOM();
}

// When Item Starts Dragging
function drag(e) {
  draggedItem = e.target;
  dragging = true;
}

// Column allows for item to drop
function allowDrop(e) {
  e.preventDefault();
}

// When Item Enters Column Area
function dragEnter(column) {
  columnList[column].classList.add("over");
  currentColumn = column;
}

// Droppint Item in Column
function drop(e) {
  e.preventDefault();
  columnList.forEach((column) => {
    column.classList.remove("over");
  });
  // Add Item to the Column
  const parent = columnList[currentColumn];
  parent.appendChild(draggedItem);
  dragging = false;
  rebuildArrays();
}

// On Load
updateDOM();
