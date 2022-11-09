import { Server as HTTPServer } from 'http';
import { Server as SocketServer } from 'socket.io';

type SocketOptions = {
	http: HTTPServer;
};
export async function initSocket(options: SocketOptions) {
	const { http } = options;

	let clients = {};
	const updateClients = (newClients: object) => (clients = newClients);

	const io = new SocketServer(http);

	io.on('connection', (socket) => {
		console.log(`User "${socket.id}" is connected!`);
	});

	return { io, updateClients };
}
