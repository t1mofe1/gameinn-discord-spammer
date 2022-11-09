import { initAPI } from './Api';
import { initClient } from './Client';
import { getTokens } from 'ProxyManager';
import { initSocket } from 'Socket';
import { Server as HTTPServer } from 'http';

const inviteLink = 'discord.gg/Na7u9DyqgP';
const messageContent = `Hello! I'm sorry for disturbing you. I saw that we're on same discord nft server and wanted to invite you to our own discord server. If you could join us, we would be able to have a more active community. ${inviteLink}`;

async function main() {
	const api = await initAPI();
	const http = new HTTPServer(api);
	const { io, updateClients } = await initSocket({ http });

	const tokens = await getTokens();

	// TODO: event emitter for all clients, send events to socket client
	const clients = tokens.map(async (token) => ({ [token]: await initClient({ inviteLink, messageContent, token }) }));
	updateClients(clients);

	const PORT = process.env.PORT || 80;
	http.listen(PORT, () => console.log(`API working on port ${PORT}`));
}
main();
