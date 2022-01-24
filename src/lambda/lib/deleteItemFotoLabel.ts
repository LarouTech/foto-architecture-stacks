import { AttributeValue, DeleteItemCommand, DeleteItemCommandOutput, DeleteTableCommand, DeleteTableCommandOutput, DynamoDBClient, GetItemCommand, GetItemCommandOutput, PutItemCommand, PutItemCommandOutput } from "@aws-sdk/client-dynamodb";
import { fromEnv } from "@aws-sdk/credential-provider-env";
import { ALL } from "dns";
import { catchError, from, lastValueFrom, of, switchMap, tap } from "rxjs";

interface EventDto {
    region: string,
    tableName: string,
    id: string
}

export async function main(event: EventDto): Promise<DeleteItemCommandOutput> {
    const client = new DynamoDBClient({
        region: event.region,
        credentials: fromEnv()
    });

    const command$ = of(new DeleteItemCommand({
        TableName: event.tableName,
        Key: {
            id: {
                S: event.id
            }
        },
    }));


    const response$ = command$
        .pipe(
            switchMap(command => {
                return from(client.send(command))

            })
        )

    return lastValueFrom(response$)

}
