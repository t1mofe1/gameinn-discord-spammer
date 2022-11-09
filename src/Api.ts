import express from 'express';
import helmet from 'helmet';

export async function initAPI() {
	const api = express();

	api.use(helmet());
	api.use(express.json());

	api.get('/', async (_, res) => {
		res.sendFile('/index.html');
	});

	api.get('*', async (_, res) => {
		res.status(404).send(`Oops! You entered 404 zone. If you don't want to get restricted, please go back or follow to <a href="/">home</a>. Thanks :3`);
	});

	return api;
}
