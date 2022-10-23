const http = require('http');
const fs = require('fs');
const url = require('url');
const server = http.createServer(app);

const { Server } = require('socket.io')
const io = new Server(server);

const PORT = process.env.PORT || 3000
const ROOT_DIR = 'html'

///////////////////////////////////////

const MIME_TYPES = {
	'css': 'text/css',
	'gif': 'image/gif',
	'htm': 'text/html',
	'html': 'text/html',
	'ico': 'image/x-icon',
	'jpeg': 'image/jpeg',
	'jpg': 'image/jpeg',
	'js': 'application/javascript',
	'json': 'application/json',
	'png': 'image/png',
	'svg': 'image/svg+xml',
	'txt': 'text/plain'
}

function get_mime(filename) {
	for (let ext in MIME_TYPES) {
		if (filename.indexOf(ext, filename.length - ext.length) !== -1) {
		return MIME_TYPES[ext]
		}
	}
	return MIME_TYPES['txt']
}

///////////////////////////////////////

function app(req, res) {
	const urlObj = url.parse(req.url, true, false)
	console.log("\n==============================")
	console.log("PATHNAME: " + urlObj.pathname)
	console.log("REQUEST : " + ROOT_DIR + urlObj.pathname)
	console.log("METHOD  : " + req.method)

	const filePath = ROOT_DIR + urlObj.pathname
	if (urlObj.pathname === '/') filePath += 'index.html'

	fs.readFile(filePath, (err, data) => {
		if (err) {
			console.log('ERROR: ' + JSON.stringify(err))
			//respond with not found 404 to client
			res.writeHead(404);
			res.end(JSON.stringify(err))
		}
		else {
			res.writeHead(200, {
			  'Content-Type': get_mime(filePath)
			})
			res.end(data)
		}
	})
}

const users = []
const MAIN_ROOM = "main_room"

io.on('connection', socket => {
	console.log(`Server: socket ${socket.id} connected`)

	socket.on('join', (username, callback) => {
		username = username.trim();

		const { err, user } = addUser(socket.id, username, MAIN_ROOM);
		if (err)
			return callback(err);

		socket.emit('message', { username: 'Server', text: `You joined chat as: ${user.name}.`});
		socket.broadcast.to(user.room).emit('message', { username: 'Server', text: `${user.name} joined the chat.`})
		socket.join(user.room)

		io.to(user.room).emit('roomData', {
			room: user.room,
			users: users
		})
		callback();
	})
	socket.on('disconnect', () => {
		console.log(`Server: socket ${socket.id} disconnected`)

		const user = removeUser(socket.id);
		if (user) {
			io.to(user.room).emit('message', { username: 'Server', text: `${user.name} left the chat.`})
			io.to(user.room).emit('roomData', {
				room: user.room,
				users: users
			})
		}
	})
	socket.on('sendMessage', (message) => {
		const user = getUser(socket.id);
		if (!user) return;
		socket.broadcast.to(user.room).emit('message', { username: user.name, text: message });
		socket.broadcast.to(user.room).emit('roomData', {
			room: user.room,
			users: users
		})
	})
})

function addUser(id, name, room) {
	name = name.trim();
	room = room.trim();

	const existingUser = users.find((user) => user.name === name && user.room === room);

	if (existingUser) {
		return { err: "Username is currently taken" };
	}
	const user = { id, name, room };
	users.push(user);
	return { user };
}

function removeUser(id) {
	const index = users.findIndex(user => user.id === id);

	if (index !== -1) {
		return users.splice(index, 1)[0];
	}
}

function getUser(id) {
	return users.find(user => user.id === id);
}

server.listen(PORT)

console.log(`Server Running on port ${PORT} | CTRL-C to quit`)
console.log(`To Test:`)
console.log(`Open several browsers to: http://localhost:3000/index.html`)
