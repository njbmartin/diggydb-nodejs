import { v4 as uuidv4 } from "uuid"

import { DiggyDB, DiggyQuery } from "../src"

const db = new DiggyDB({
  hostname: "gramic.io",
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
})

interface Framework {
  id: string
  name: string
  version: string
  downloads: string
}

const queryTable = async (table: string) => {
  // db.queryTable
  console.log("query table (via AWS SDK)")

  console.time("db.queryTable")

  const tableResult = await db.queryTable(table)

  console.log("table:", `"${table}"`)
  console.table(tableResult)
  console.timeEnd("db.queryTable")
  return tableResult
}

const queryRecord = async (table: string, id: string) => {
  // db.query
  const query: DiggyQuery = {
    table,
    id,
  }
  console.log("query row (via DNS)")
  console.log("table", `"${query.table}"`)

  console.time("db.query")

  const result = await db.query<Framework>(id, table)

  console.log("id", `"${query.id}"`)
  console.table([result])
  console.timeEnd("db.query")
  return result
}

const addRecord = async (table: string) => {
  console.log("add record to table (via AWS SDK)")
  console.log("table", `"${table}"`)

  console.time("db.put")

  const newRecord = {
    name: "vuejs",
    version: "2.6.12",
    downloads: "1,935,726",
  }

  console.table([newRecord])

  await db.put(table, uuidv4(), newRecord)

  console.log("added record to DNS")
  console.timeEnd("db.put")
}

const run = async () => {
  const table = "frameworks"

  const initialTable = await queryTable(table)
  await queryRecord(table, initialTable[0].id)

  await addRecord(table)

  // query table again
  await queryTable(table)
}
run()
