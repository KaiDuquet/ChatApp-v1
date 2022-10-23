const socket = io();

socket.on('message', msgObj => {
	addMessageToChatWindow(msgObj)
})

socket.on('roomData', roomData => {
	updateRoomData(roomData);
})

function addMessageToChatWindow(msgObj) {
	const msgDiv = document.createElement('div')
	const pName = document.createElement('p')
	const pText = document.createElement('p')

	msgDiv.classList.add('message')

	if (msgObj.username === undefined) {
		msgDiv.classList.add("local")
		pName.innerHTML = ''
	}
	else {
		msgDiv.classList.add("other")
		pName.innerHTML = msgObj.username
	}
	pText.innerText = msgObj.text;

	pName.classList.add('name')
	pText.classList.add('text')
	msgDiv.appendChild(pName)
	msgDiv.appendChild(pText)
	document.getElementById("mainChat").appendChild(msgDiv)
}

function sendMessage() {
	const message = document.getElementById('msgField').value.trim()
	if (message === '')
		return
	addMessageToChatWindow({ text: message })
	socket.emit('sendMessage', message)
	document.getElementById('msgField').value = ''
}

function updateRoomData(roomData) {
	const users = roomData.users;

	const usersDiv = document.getElementById('users');
	usersDiv.innerHTML = "";

	for (let user of users) {
		const userElement = document.createElement('li');
		userElement.classList.add('user');
		
		const userSpanName = document.createElement('span');
		userSpanName.classList.add('name');

		if (user.id === socket.id) {
			userSpanName.style.color = "rgb(165, 220, 252)";
		}

		userSpanName.innerHTML = user.name;
		userElement.appendChild(userSpanName);
		usersDiv.appendChild(userElement);
	}
}

// Maybe consider only sending message on enter if msgField is focused
function handleKeyDown(event) {
	const ENTER_KEY = 13
	if (event.keyCode === ENTER_KEY) {
		sendMessage()
		return false
	}
}

function attemptConnect() {
	const username = document.getElementById('usernameField').value.trim();
	if (username === '')
		return
	socket.emit('join', username, joinRoomCallback);
}

// Callbacks
function joinRoomCallback(err) {
	if (err) {
		alert(err)
	}
	else {
		const connectContainer = document.getElementById('connect')
		const mainContainer = document.getElementById('main')
		const spanName = document.getElementById('connectedAsName');

		connectContainer.style.display = 'none';
		mainContainer.style.display = 'block';
		
		spanName.innerHTML = document.getElementById('usernameField').value.trim();
		document.getElementById('usernameField').value = '';
	}
}



document.addEventListener('DOMContentLoaded', () => {
	document.getElementById('sendButton').addEventListener('click', sendMessage)
	document.addEventListener('keydown', handleKeyDown)
	document.getElementById('connectButton').addEventListener('click', attemptConnect)
})