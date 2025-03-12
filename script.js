// API URL
// const API_URL = "http://localhost:5000/api";
const API_URL = "https://kanban-backend-one-fawn.vercel.app/api";

// Authentication buttons
const loginForm = document.getElementById("login-form");
const registerForm = document.getElementById("register-form");
const authContainer = document.getElementById("auth-container");
const kanbanContainer = document.getElementById("kanban-container");
const logoutBtn = document.getElementById("logout-btn");
const usernameDisplay = document.getElementById("username-display");

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
let listArrays = [
  backlogListArray,
  progressListArray,
  completeListArray,
  onHoldListArray,
];

// Drag Functionality
let draggedItem;
let draggedTask;
let dragging = false;
let currentColumn;

// Event Listeners for adding items
function addEventListeners() {
  saveItemBtns.forEach((btn, index) => {
    console.log("Saving item...");
    btn.addEventListener("click", () => addItem(index));
  });

  addItems.forEach((item) => {
    item.addEventListener("keypress", (e) => {
      if (e.key === "Enter") {
        const index = Array.from(addItems).indexOf(item);
        addItem(index);
      }
    });
  });

  // // Event listeners for drag and drop
  // columnList.forEach((list) => {
  //   list.addEventListener("dragover", dragOver);
  //   list.addEventListener("drop", drop);
  // });

  // Add event listeners for login and register forms
  if (loginForm) {
    loginForm.addEventListener("submit", handleLogin);
  }

  if (registerForm) {
    registerForm.addEventListener("submit", handleRegister);
  }

  if (logoutBtn) {
    logoutBtn.addEventListener("click", handleLogout);
  }
}

// Check Authentication Status
function checkAuth() {
  const token = localStorage.getItem("token");

  if (!token) {
    // User is not authenticated, show login/register forms
    if (authContainer) authContainer.style.display = "block";
    if (kanbanContainer) kanbanContainer.style.display = "none";
    return false;
  } else {
    // User is authenticated, show kanban board
    if (authContainer) authContainer.style.display = "none";
    if (kanbanContainer) kanbanContainer.style.display = "block";

    // Display username
    const user = JSON.parse(localStorage.getItem("user"));
    if (user && usernameDisplay) {
      usernameDisplay.textContent = `Welcome, ${user.name}!`;
    }

    // Load tasks from API
    getTasks();
    return true;
  }
}

// API Functions
async function handleLogin(e) {
  console.log("Handling login...");

  e.preventDefault();

  const email = document.getElementById("login-email").value;
  const password = document.getElementById("login-password").value;

  try {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();

    if (response.ok) {
      // Save token and user data
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));

      // Show kanban board
      checkAuth();
    } else {
      // Show error message
      alert(data.msg || "Login failed");
    }
  } catch (err) {
    console.error("Login error:", err);
    alert("An error occurred during login");
  }
}

async function handleRegister(e) {
  e.preventDefault();

  const name = document.getElementById("register-name").value;
  const email = document.getElementById("register-email").value;
  const password = document.getElementById("register-password").value;

  try {
    const response = await fetch(`${API_URL}/auth/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ name, email, password }),
    });

    const data = await response.json();

    if (response.ok) {
      // Save token
      localStorage.setItem("token", data.token);

      // Get user data
      await getUserData();

      // Show kanban board
      checkAuth();
    } else {
      // Show error message
      const errorMessage = data.errors
        ? data.errors.map((err) => err.msg).join("\n")
        : data.msg;
      alert(errorMessage || "Registration failed");
    }
  } catch (err) {
    console.error("Registration error:", err);
    alert("An error occurred during registration");
  }
}

async function getUserData() {
  const token = localStorage.getItem("token");

  if (!token) return;

  try {
    const response = await fetch(`${API_URL}/auth/user`, {
      method: "GET",
      headers: {
        "x-auth-token": token,
      },
    });

    if (response.ok) {
      const userData = await response.json();
      localStorage.setItem("user", JSON.stringify(userData));
    } else {
      // Token might be invalid
      handleLogout();
    }
  } catch (err) {
    console.error("Error getting user data:", err);
  }
}

function handleLogout() {
  // Clear localStorage
  localStorage.removeItem("token");
  localStorage.removeItem("user");

  // Show login form
  checkAuth();
}

// API Task Functions
async function getTasks() {
  const token = localStorage.getItem("token");

  if (!token) return;

  try {
    const response = await fetch(`${API_URL}/tasks`, {
      method: "GET",
      headers: {
        "x-auth-token": token,
      },
    });

    if (response.ok) {
      const taskData = await response.json();

      // Reset tasks
      backlogListArray.splice(0, backlogListArray.length);
      progressListArray.splice(0, progressListArray.length);
      completeListArray.splice(0, completeListArray.length);
      onHoldListArray.splice(0, onHoldListArray.length);

      // Sort tasks by status
      taskData.forEach((task) => {
        switch (task.status) {
          case "backlog":
            backlogListArray.push({ id: task._id, title: task.title });
            break;
          case "progress":
            progressListArray.push({ id: task._id, title: task.title });
            break;
          case "complete":
            completeListArray.push({ id: task._id, title: task.title });
            break;
          case "onHold":
            onHoldListArray.push({ id: task._id, title: task.title });
            break;
        }
      });

      // Update UI
      updateDOM();
    } else {
      // Token might be invalid
      if (response.status === 401) {
        handleLogout();
      }
    }
  } catch (err) {
    console.error("Error getting tasks:", err);
  }
}

async function createTask(title, status) {
  const token = localStorage.getItem("token");

  if (!token) return;

  try {
    const response = await fetch(`${API_URL}/tasks`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-auth-token": token,
      },
      body: JSON.stringify({ title, status }),
    });

    if (response.ok) {
      // Refresh tasks
      getTasks();
    } else {
      const data = await response.json();
      // console.log(data);
      alert(data.msg || "Failed to create task");
    }
  } catch (err) {
    console.error("Error creating task:", err);
  }
}

async function updateTask(id, updates, newStatus) {
  const token = localStorage.getItem("token");

  if (!token) return;

  try {
    const response = await fetch(`${API_URL}/tasks/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "x-auth-token": token,
      },
      body: JSON.stringify({ title: updates, status: newStatus }),
    });

    if (response.ok) {
      getTasks();
    } else {
      const data = await response.json();
      alert(data.msg || "Failed to update task");
    }
  } catch (err) {
    console.error("Error updating task:", err);
  }
}

async function deleteTask(id) {
  const token = localStorage.getItem("token");

  if (!token) return;

  try {
    const response = await fetch(`${API_URL}/tasks/${id}`, {
      method: "DELETE",
      headers: {
        "x-auth-token": token,
      },
    });

    if (response.ok) {
      // Refresh tasks
      getTasks();
    } else {
      const data = await response.json();
      alert(data.msg || "Failed to delete task");
    }
  } catch (err) {
    console.error("Error deleting task:", err);
  }
}

// Get Arrays from localStorage if available, set default values if not
// function getSavedColumns() {
//   if (localStorage.getItem("backlogItems")) {
//     backlogListArray = JSON.parse(localStorage.backlogItems);
//     progressListArray = JSON.parse(localStorage.progressItems);
//     completeListArray = JSON.parse(localStorage.completeItems);
//     onHoldListArray = JSON.parse(localStorage.onHoldItems);
//   } else {
//     backlogListArray = ["Release the course", "Sit back and relax"];
//     progressListArray = ["Work on projects", "Listen to music"];
//     completeListArray = ["Being cool", "Getting stuff done"];
//     onHoldListArray = ["Being uncool"];
//   }
// }

// Set localStorage Arrays
// function updateSavedColumns() {
//   listArrays = [
//     backlogListArray,
//     progressListArray,
//     completeListArray,
//     onHoldListArray,
//   ];
//   const arrayNames = ["backlog", "progress", "complete", "onHold"];

//   arrayNames.forEach((arrayName, index) => {
//     localStorage.setItem(
//       `${arrayName}Items`,
//       JSON.stringify(listArrays[index])
//     );
//   });
// }

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
  content.textContent = item.title;
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
  listEl.setAttribute("ondragstart", `drag(event, ${index}, ${column})`);
  listEl.id = index;

  columnEl.appendChild(listEl);
}

function deleteItem(id, column) {
  const selectedArray = listArrays[column];
  deleteTask(selectedArray[id].id);
  selectedArray.splice(id, 1);
  updateDOM();
}

// Update Columns in DOM - Reset HTML, Filter Array, Update localStorage
function updateDOM() {
  // Check localStorage once
  // if (!updatedOnLoad) {
  //   getSavedColumns();
  // }

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
  // updateSavedColumns();
}

// Add Item
function addItem(column) {
  const itemText = addItems[column].textContent;
  console.log("Adding item " + itemText);

  if (!itemText) return;

  // Determine status based on column
  let status;
  switch (column) {
    case 0:
      status = "backlog";
      break;
    case 1:
      status = "progress";
      break;
    case 2:
      status = "complete";
      break;
    case 3:
      status = "onHold";
      break;
  }

  // Create task via API
  createTask(itemText.trim(), status);

  // Add to colum
  addToColumn(column);
}
// Update Item - Delete
function updateItem(id, column) {
  console.log(`Updating element ${id} -> colum ${column}`);
  const selectedArray = listArrays[column];
  const selectedColumnEl = columnList[column].children;
  if (!dragging) {
    if (!selectedColumnEl[id].textContent) {
      deleteTask(selectedArray[id].id);
      // selectedArray.splice(id, 1);
    } else {
      let content = selectedColumnEl[id].textContent;
      updateTask(selectedArray[id].id, content);
      // selectedArray[id] = content;
    }
    updateDOM();
  }
}

function statusByColumn(column) {
  let status;

  switch (column) {
    case 0:
      status = "backlog";
      break;
    case 1:
      status = "progress";
      break;
    case 2:
      status = "complete";
      break;
    case 3:
      status = "onHold";
      break;
  }

  return status;
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
function drag(e, index, column) {
  draggedItem = e.target;
  const selectedArray = listArrays[column];
  draggedTask = selectedArray[index];
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
  updateTask(draggedTask.id, draggedTask.title, statusByColumn(currentColumn));
  // rebuildArrays();
  updateDOM();
}

// On Load
function init() {
  // Check if user is authenticated
  const isAuthenticated = checkAuth();

  // Set up event listeners
  addEventListeners();
  updateDOM();
}

// Initialize on load
document.addEventListener("DOMContentLoaded", init);
