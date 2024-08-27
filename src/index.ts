/**
 * Welcome to Cloudflare Workers! This is your first worker.
 *
 * - Run `npm run dev` in your terminal to start a development server
 * - Open a browser tab at http://localhost:8787/ to see your worker in action
 * - Run `npm run deploy` to publish your worker
 *
 * Bind resources to your worker in `wrangler.toml`. After adding bindings, a type definition for the
 * `Env` object can be regenerated with `npm run cf-typegen`.
 *
 * Learn more at https://developers.cloudflare.com/workers/
 */
import {Hono} from 'hono'
import { logger } from 'hono/logger'
const app = new Hono();

app.use(logger())

// log headers
app.use(async(c, next) => {

	Array.from(c.req.raw.headers.entries()).forEach(([key, value]) => {
		console.log(`${key}: ${value}`)
	})
	await next()
})


// IP Filtering
// This function will act like a layer 3 firewall and can do IP filtering
// for the web service. This is useful for blocking unwanted traffic.
app.use(async(c, next) => {
	const ipAdress = c.req.raw.headers.get('x-real-ip')!
	console.log(`client ip: ${ipAdress}`)

	const ipFilterList: string[] = [
		// add IP addresses here to block them
	]

	if(ipFilterList.includes(ipAdress)) {
		return c.text("IP Blocked", 403)
	}

	await next()
})

// Authorization Header
// This acts as a layer 7 firewall and can be used to block unauthorized requests
app.use(async(c, next) => {
	const secureHeaderValues: Map<string, string> = new Map<string, string>([
		["secure-header-1", "this is my secret value"],
		//["another example key", "another example value"]

	])

	for (const [key, value] of secureHeaderValues.entries()) {
		console.log(`checking ${key} header`)
		console.log(c.req.raw.headers.get(key))
		if(c.req.raw.headers.get(key) !== value) {
			return c.text("Missing Secure Header", 401)
		}
	}

	await next()
})

app.get('/', async (c, res) => {
	return c.text('Hello World', 200)
});

// filter for a different header here

app.use(async(c, next) => {
	const secureHeaderValues: Map<string, string> = new Map<string, string>([
		["secure-header-2", "this is my secret value"],
		//["another example key", "another example value"]
	])

	for (const [key, value] of secureHeaderValues.entries()) {
		console.log(`checking ${key} header`)
		console.log(c.req.raw.headers.get(key))
		if(c.req.raw.headers.get(key) !== value) {
			return c.text("Missing Secure Header 2", 401)
		}
	}

	await next()
})

app.get("/2", async (req, res) => {
	return req.text('Hello World 2', 200)
})

export default  app
