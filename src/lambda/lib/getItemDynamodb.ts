import { AttributeValue, DynamoDBClient, GetItemCommand, GetItemCommandOutput, PutItemCommand, PutItemCommandOutput } from "@aws-sdk/client-dynamodb";
import { fromEnv } from "@aws-sdk/credential-provider-env";
import { ALL } from "dns";
import { catchError, from, lastValueFrom, of, switchMap, tap } from "rxjs";

interface EventDto {
    region: string,
    tableName: string,
    profileId: string
}

export async function main(event: EventDto): Promise<GetItemCommandOutput> {
    const client = new DynamoDBClient({
        region: event.region,
        credentials: fromEnv()
    });

    const command$ = of(new GetItemCommand({
        TableName: event.tableName,
        Key: {
            id: {
                S: event.profileId
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
