import { Client } from 'Client';
import { Client as DiscordClient, Collection, MessageOptions } from 'discord.js';

type ClientManagerProps = {
	inviteLink: string;
	message: string | MessageOptions;
};

export class ClientManager {
	inviteLink: string;
	message: string | MessageOptions;
	clients: Collection<string, Client>;

	constructor(options: ClientManagerProps) {
		const { inviteLink, message } = options;

		this.inviteLink = inviteLink;
		this.message = message;
		this.clients = new Collection();
	}

	addClient(token: string) {
		const client = new Client({
			token,
			message: this.message,
			inviteLink: this.inviteLink,
		});

		this.clients.set(token, client);

		return client;
	}
}
