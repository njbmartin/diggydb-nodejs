import { promises } from "dns"
import * as AWS from "aws-sdk"

const resolver = new promises.Resolver()

export interface DiggyConfig {
  hostname: string
  accessKeyId?: string
  secretAccessKey?: string
  region?: string
}

export interface DiggyQuery {
  table: string
  id: string
}

interface RecordMap {
  [key: string]: string
}

export class DiggyDB {
  hostname: string
  accessKeyId?: string
  secretAccessKey?: string
  region?: string

  constructor({
    hostname,
    accessKeyId,
    secretAccessKey,
    region = "us-east-1",
  }: DiggyConfig) {
    this.hostname = hostname
    this.accessKeyId = accessKeyId
    this.secretAccessKey = secretAccessKey
    this.region = ""
    if (accessKeyId && secretAccessKey) {
      AWS.config.update({
        accessKeyId,
        secretAccessKey,
        region,
      })
    }
  }

  private getKeyValue = (recordResult: string[][]) => {
    const mapped = recordResult.map((result) => {
      const [key, value] = result[0].split("=")
      return { key, value }
    })

    return mapped.reduce((map: RecordMap, obj) => {
      map[obj.key] = obj.value
      return map
    }, {})
  }

  put = async (table: string, id: string, value: Object) => {
    if (!this.accessKeyId || !this.secretAccessKey) {
      throw new Error("table queries require the AWS SDK to be configured")
    }
    const route53 = new AWS.Route53()
    const zones = await route53.listHostedZones().promise()
    const zoneId = zones.HostedZones.find(
      (zone) => zone.Name === `${this.hostname}.`
    )?.Id
    if (!zoneId) {
      throw new Error(`zone not found ${this.hostname}`)
    }

    const records = Object.entries(value).map(([key, value]) => ({
      Value: `"${key}=${value}"`,
    }))

    return await route53
      .changeResourceRecordSets({
        HostedZoneId: zoneId,
        ChangeBatch: {
          Changes: [
            {
              Action: "CREATE",
              ResourceRecordSet: {
                Name: `${id}.${table}.diggydb.${this.hostname}`,
                ResourceRecords: records,
                Type: "TXT",
                TTL: 60,
              },
            },
          ],
        },
      })
      .promise()
  }

  queryTable = async <T>(table: string) => {
    if (!this.accessKeyId || !this.secretAccessKey) {
      throw new Error("table queries require the AWS SDK to be configured")
    }
    const route53 = new AWS.Route53()
    const zones = await route53.listHostedZones().promise()
    const zoneId = zones.HostedZones.find(
      (zone) => zone.Name === `${this.hostname}.`
    )?.Id
    if (!zoneId) {
      throw new Error(`zone not found ${this.hostname}`)
    }
    const records = await route53
      .listResourceRecordSets({ HostedZoneId: zoneId })
      .promise()

    const filtered = records.ResourceRecordSets.filter(
      (record) =>
        record.Name.includes(`${table}.diggydb.${this.hostname}.`) &&
        record.Type === "TXT"
    ).map((record) => {
      const value =
        record.ResourceRecords &&
        record.ResourceRecords.map((record) => {
          const [key, value] = record.Value.replace(/(")|(")/g, "").split("=")
          return { key, value }
        }).reduce((map: RecordMap, obj) => {
          map[obj.key] = obj.value
          return map
        }, {})
      return {
        id: record.Name.replace(`.${table}.diggydb.${this.hostname}.`, ""),
        ...value,
      }
    })
    return (filtered as unknown) as T
  }

  query = async <T>(id: string, table: string) => {
    const recordResult = await resolver.resolveTxt(
      `${id}.${table}.diggydb.${this.hostname}`
    )
    return ({
      id,
      ...this.getKeyValue(recordResult),
    } as unknown) as T
  }
}
