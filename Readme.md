# DiggyDB - Amazon Route53 as a blazingly fast and reliable database 🚀

> 🚧 This is currently a work in progress, and subject to change. Yes, it's a serious thing too...

This one is 100% inspired by [Corey Quinn](https://twitter.com/quinnypig/status/1120653859561459712), who has repeatedly insisted that Route53 is essentially a database with 100% SLA.

[Read more](https://www.lastweekinaws.com/blog/route-53-amazons-premier-database/)

DiggyDB goes one step further than simple a `key/value` TXT record by allowing you to use (or indeed abuse) DNS TXT records by storing JSON data, almost as though it was a MongoDB or AWS DynamoDB!

JSON data is transformed and stored in a TXT record with each key/value pair on a seperate line:

```
"name=gatsby"
"version=3.1.2"
"downloads=409,484"
```

Querying for a known `id` (via DNS) is blazingly fast and can take `~30ms` to return the JSON data. 🚀

### Features

- Query table by id (via DNS)
- Query all rows in a table (via AWS SDK)
- Put a new `object` in a table (via AWS SDK)

More to come soon, but feel free to contribute if you have ideas!

### Limitations

Due to the nature of TXT records, `object` values should be limited to alphanumeric `string` values.

Some DNS servers may ignore the TTL value of DNS records, so updates may be delayed.

## Install

```
npm install -S diggydb-nodejs

or

yarn add diggydb-nodejs
```

## How to use

First you need to import `diggydb-nodejs` and configure it:

```ts
import { DiggyDB, DiggyQuery } from "diggydb-nodejs"

const db = new DiggyDB({
  hostname: "example.com",
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
})
```

### Query a row by id

If you know the `id` of the row you would like to retrieve from a `table`, you can use the following:

```ts
interface Framework {
  id: string
  name: string
  version: string
  downloads: string
}

const id = "3a7b68cf-686a-4135-b48b-6471deb3643a"
const table = "frameworks"

const result = await db.query<Framework>(id, table)

// returns
const result = {
  id: "3a7b68cf-686a-4135-b48b-6471deb3643a",
  name: "gatsby",
  version: "3.1.2",
  downloads: "409,484",
}
```

### Query rows in a table

You can retrieve all rows from a table using the following:

```ts
interface Framework {
  id: string
  name: string
  version: string
  downloads: string
}

const table = "frameworks"

const results = await db.queryTable<Framework[]>(table)

// returns
const results = [
  {
    id: "3a7b68cf-686a-4135-b48b-6471deb3643a",
    name: "gatsby",
    version: "3.1.2",
    downloads: "409,484",
  },
  {
    id: "aae3d92e-7230-43e4-b63c-1efe00081ae6",
    name: "next.js",
    version: "10.0.9",
    downloads: "1,144,043",
  },
]
```

### Adding a row to a table

You can add a row to a table using the following:

```ts
import { v4 as uuidv4 } from "uuid"

interface Framework {
  id: string
  name: string
  version: string
  downloads: string
}

const table = "frameworks"
const id = uuidv4() // create a unique id

const newRecord: Omit<Framework, "id"> = {
  name: "vuejs",
  version: "2.6.12",
  downloads: "1,935,726",
}

await db.put(table, uuidv4(), newRecord)
```

> Note: If the table doesn't exist, it will of course create it for you

## Adding records manually (or not using AWS)

It's not just Amazon Route53 you can use as a database, but you would need to update your DNS records manually:

1. For the record type, select `TXT`.
2. In the Name/Host/Alias field, enter `id.table.diggydb`.
   Your host might require you to enter the fully qualified domain, so this may look like `id.table.diggydb.example.com`. Your other DNS records might indicate what you should enter.

3. In the Time to Live (TTL) field, enter `60` or a value of your choice. This is time in seconds that DNS servers should cache the record for.
4. In the Value/Answer/Destination field, enter your JSON data key/value pairs (excl the `id` field) on each line:

```
"key=value"
"key=value"
"key=value"
```

5. Save the record.
