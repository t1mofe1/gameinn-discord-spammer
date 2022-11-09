import { Client as DiscordClient, Collection, Guild, GuildMember, Intents, Message, MessageOptions, Snowflake, User } from 'discord.js';

enum SpamStatusState {
	WAITING,
	SENT,
	ERROR,
}
type SpamStatus = { state: SpamStatusState.WAITING | SpamStatusState.SENT } | { state: SpamStatusState.ERROR; error: string };

type SpamUser = {
	from: Guild | 'DM';
	user: User;
	messages: Message[];
	status: SpamStatus;
};

type SpamClientOptions = {
	inviteLink: string;
	message: string | MessageOptions;
	token: string;
};
export class Client {
	client: DiscordClient;
	inviteLink: string;
	message: string | MessageOptions;
	token: string;
	users: Collection<Snowflake, SpamUser>;

	constructor(options: SpamClientOptions) {
		const { inviteLink, message, token } = options;

		this.inviteLink = inviteLink;
		this.message = message;
		this.token = token;
		this.users = new Collection();
		this.client = new DiscordClient({
			presence: {
				activities: [
					{
						name: inviteLink,
					},
				],
			},
			intents: [Intents.FLAGS.DIRECT_MESSAGES, Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MEMBERS],
		});
	}

	async sendMessage(member: GuildMember | User) {
		const user = member instanceof GuildMember ? member.user : member;
		const from = member instanceof GuildMember ? member.guild : 'DM';

		const spamUser: SpamUser = {
			from,
			user,
			messages: [],
			status: { state: SpamStatusState.WAITING },
		};

		this.users.set(user.id, spamUser);

		await user
			.send(this.message)
			.then((message) => {
				spamUser.messages.push(message);
				spamUser.status = {
					state: SpamStatusState.SENT,
				};
			})
			.catch((err) => (spamUser.status = { state: SpamStatusState.ERROR, error: String(err.message ?? err) }));
	}

	async initEvents() {
		this.client.on('ready', async () => {
			if (!this.client.user) return;

			console.log(`Client '$${this.token}' initialized as ${this.client.user.tag}!`);
		});

		this.client.on('messageCreate', async (message) => {
			console.log({ event: 'messageCreate', message });

			if (message.author.bot) return;

			const spamUser = this.users.get(message.author.id) ?? (await this.sendMessage(message.author))!;

			spamUser.messages.push(message);
		});

		this.client.on('guildCreate', async (guild) => {
			console.log({ event: 'guildCreate', guild });

			guild.members
				.fetch()
				.then((members) => members.filter((member) => !member.user.bot))
				.then((members) => members.forEach((member) => this.sendMessage(member)));
		});
	}

	async start() {
		await this.client.login(this.token);

		return this;
	}
}
