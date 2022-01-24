import { AttributeValue, DynamoDBClient, PutItemCommand, PutItemCommandOutput } from "@aws-sdk/client-dynamodb";
import { Label } from "@aws-sdk/client-rekognition";
import { fromEnv } from "@aws-sdk/credential-provider-env";
import { DynamoDBDocumentClient, PutCommand } from "@aws-sdk/lib-dynamodb";
import { ALL } from "dns";
import { catchError, from, lastValueFrom, map, of, switchMap } from "rxjs";

export interface FotoDbDto {
    items: {
        id: string
        userSub: string,
        email: string,
        imageId: string,
        profileId: string,
        key: string,
        labels: Array<Label>,
    }
    region: string,
    tableName: string,
}

export async function main(event: FotoDbDto) {
    const client = new DynamoDBClient({
        region: event.region,
        credentials: fromEnv()
    });

    const dbDocClient = DynamoDBDocumentClient.from(client)

    return await dbDocClient.send(
        new PutCommand({
            TableName: event.tableName,
            Item: {
                ...event.items
            }
        })
    )


}
