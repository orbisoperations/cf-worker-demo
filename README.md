# Cloudlfare Worker Example for Understanding Application Security Basics

This repo contains an example cloudflare worker with a simple API service to help
new security practitioners understand the basics of application security.

There are a few helper functions included to do IP filtering and HTTPS header checking.

For more docs on what types of information is available in the request object see:

- [hono js](https://hono.dev/docs/api/context)
- [Cloudflare Workers Docs](https://developers.cloudflare.com/workers/)

## Setup

### Get this Repo

Clone this repo to your local machine.

If you are using the IDX lab you will need to install the `pnpm` package manager.

IDX will prompt you to install the first time you attempt to use `pnpm`.

#### IDX Specific Config

You can add the folling line to your `.idx/dev.nix` file:

```nix
packages = [
    pkgs.corepack_21
  ];
```

Once added, it will ask to rebuild your environment and `pnpm`
will be in your current environment.

### Install Dependencies

Run the following command to install the dependencies:

```bash
pnpm install
```

#### Install Wrangler (if not install project packages)

Follow the [steps provided by Cloudflare](https://developers.cloudflare.com/workers/wrangler/install-and-update/) to install wrangler. Wrangler is the CLI tool
build by Cloudflare to help you manage your workers.

### Configure wrangler.toml

The `wranger.toml` file is the configuration file for your worker.

In this file the only thing that you need to change is the `name` value.

```toml
#:schema node_modules/wrangler/config-schema.json
# change this name to create a new domain to deploy
name = "security-demo" # <- THIS ONE HERE
main = "src/index.ts"
workers_dev = true
compatibility_date = "2024-08-06"
compatibility_flags = ["nodejs_compat"]
```

Once a unique name is chosen, you can deploy the worker to the cloudflare network.

### Deploy the Worker

To deploy the worker to the cloudflare network, run the following command:

```bash
export CLOUDFLARE_API_TOKEN="pasteyourtokenhere"
wrangler deploy
```

You should see some output that looks like:

```bash
pnpm wrangler deploy

 ⛅️ wrangler 3.69.1 (update available 3.72.2)
-------------------------------------------------------

Total Upload: 48.33 KiB / gzip: 11.77 KiB
Worker Startup Time: 0 ms
Uploaded security-demo (2.94 sec)
Published security-demo (0.66 sec)
  https://security-demo.someacccount-17d.workers.dev
Current Deployment ID: dd8b5f4f-9e56-4e1b-902b-bb052b75fd43
Current Version ID: dd8b5f4f-9e56-4e1b-902b-bb052b75fd43

```

With the worker successfully deloyed, you can now access the worker at the URL provided in the output.

In order to see the logs of the worker, you can run the following command:

```bash
wrangler tail
```

Once connected you should see logs like:

```bash
GET https://security-demo.someaccount-17d.workers.dev/ - Ok @ 8/26/2024, 9:27:16 PM
  (log)   <-- GET /
  (log) accept: */*
  (log) accept-encoding: gzip, br
  (log) cf-connecting-ip: 67.181.51.197
  (log) cf-ipcountry: US
  (log) cf-ray: 8b994ee29eaf9e59
  (log) cf-visitor: {"scheme":"https"}
  (log) connection: Keep-Alive
  (log) host: security-demo.cloudaccounts-17d.workers.dev
  (log) postman-token: d6db1b8b-d0a8-4471-8992-e86b22a6073e
  (log) test: TestVal
  (log) user-agent: PostmanRuntime/7.41.2
  (log) x-forwarded-proto: https
  (log) x-real-ip: 67.181.51.197
  (log) client ip: 67.181.51.197
  (log) checking secure-header-1 header
  (log) null
  (log)   --> GET / 401 0ms
```

When use a curl command like:

```bash
curl -X GET https://security-demo.someaccount-17d.workers.dev/
```

## IP Filtering

The Ip filtering function:

```typescript
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
```

When using this function, adding an IP address to the `ipFilterList` will block that IP address from accessing the worker.

## HTTPS Header Checking

```typescript
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
```

When using this function, adding a key value pair to the `secureHeaderValues` map will check the request headers for that key value pair. If the key value pair is not present, the worker will return a 401 status code.

Any set of Key Pairs can be added to the `secureHeaderValues` map and will block/grant access.
