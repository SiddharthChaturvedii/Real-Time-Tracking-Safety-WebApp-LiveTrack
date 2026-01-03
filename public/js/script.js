const socket = io("http://localhost:3000");

// username PER TAB ONLY
let username = sessionStorage.getItem("username") || "Guest";

// store party info
let partyCode = null;
let partyUsers = [];


function saveName() {
  username = document.getElementById("username").value || "Guest";
  sessionStorage.setItem("username", username);
  socket.emit("register-user", username);

  if (markers[socket.id]) {
    markers[socket.id].bindTooltip(`You (${username})`);
  }
}

// register immediately on load too
socket.emit("register-user", username);


// ===================
// MAP
// ===================
const map = L.map("map", { attributionControl: false }).setView([20, 0], 3);

L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  maxZoom: 19
}).addTo(map);


// ===================
// ICON COLORS — FIXED
// ===================
const iconColors = ["red", "blue", "green", "gold", "violet", "orange"];

function getColorFromId(id) {
  return iconColors[
    [...id].reduce((a, c) => a + c.charCodeAt(0), 0) % iconColors.length
  ];
}

function getIcon(color) {
  return L.icon({
    iconUrl: `https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-${color}.png`,
    shadowUrl:
      "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    shadowSize: [41, 41],
  });
}


const markers = {};
let firstUpdate = true;



// ===================
// SEND GPS CONTINUOUSLY
// ===================
if (navigator.geolocation) {
  navigator.geolocation.watchPosition((pos) => {
    socket.emit("send-location", {
      latitude: pos.coords.latitude,
      longitude: pos.coords.longitude
    });
  });
}



// ===================
// PARTY FUNCTIONS
// ===================

window.createParty = () => {
  socket.emit("createParty", username);
};

window.joinParty = () => {
  const code = prompt("Enter party code");
  if (!code) return;
  socket.emit("joinParty", { partyCode: code.trim(), username });
};



// ===================
// PARTY EVENTS
// ===================

// When you CREATE a party
socket.on("partyCreated", (data) => {
  partyCode = data.partyCode;
  partyUsers = data.users;

  alert(`🎉 Party Created!\nShare this code:\n\n${partyCode}`);
  console.log("Party users:", partyUsers);
});


// When you JOIN a party
socket.on("partyJoined", (data) => {
  partyCode = data.partyCode;
  partyUsers = data.users;

  alert(`🎉 Joined Party\nCode: ${partyCode}`);
  console.log("Party users:", partyUsers);
});


// Errors
socket.on("partyError", (msg) => alert(msg));


// Someone else joined your party
socket.on("userJoined", (user) => {
  partyUsers.push(user);
  console.log("User joined:", user);
});


// ===================
// RECEIVE LOCATIONS — PARTY ONLY
// ===================
socket.on("receive-location", (data) => {
  const { id, username, latitude, longitude } = data;

  const color = getColorFromId(id);

  if (!markers[id]) {
    markers[id] = L.marker([latitude, longitude], {
      icon: getIcon(color)
    }).addTo(map);

    markers[id].bindTooltip(
      id === socket.id ? `You (${username})` : username
    );
  } 
  else {
    markers[id].setLatLng([latitude, longitude]);
  }

  if (id === socket.id && firstUpdate) {
    map.setView([latitude, longitude], 16);
    firstUpdate = false;
  }
});



// ===================
// HANDLE DISCONNECT
// ===================
socket.on("user-disconnected", (id) => {
  if (markers[id]) {
    map.removeLayer(markers[id]);
    delete markers[id];
  }

  partyUsers = partyUsers.filter(u => u.id !== id);
});

socket.on("partyCreated", (data) => {
  partyCode = data.partyCode;
  partyUsers = data.users;

  document.getElementById("status").innerText = "Hosting Party";
  document.getElementById("code").innerText = partyCode;

  alert(`🎉 Party Created!\nShare this code:\n\n${partyCode}`);
});

socket.on("partyJoined", (data) => {
  partyCode = data.partyCode;
  partyUsers = data.users;

  document.getElementById("status").innerText = "In Party";
  document.getElementById("code").innerText = partyCode;

  alert(`🎉 Joined Party\nCode: ${partyCode}`);
});
