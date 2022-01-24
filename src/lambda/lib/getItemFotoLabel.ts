import { AttributeValue, DynamoDBClient, GetItemCommand, GetItemCommandOutput, PutItemCommand, PutItemCommandOutput, QueryCommand } from "@aws-sdk/client-dynamodb";
import { fromEnv } from "@aws-sdk/credential-provider-env";
import { QueryCommandOutput } from "@aws-sdk/lib-dynamodb";
import { ALL } from "dns";
import { catchError, from, lastValueFrom, of, switchMap, tap } from "rxjs";

interface EventDto {
    region: string,
    tableName: string,
    userSub: string
}

export async function main(event: EventDto): Promise<QueryCommandOutput> {
    const client = new DynamoDBClient({
        region: event.region,
        credentials: fromEnv()
    });

    const command$ = of(new QueryCommand({
        TableName: event.tableName,
        IndexName: 'userSub',
        KeyConditions: {
            userSub: {
                ComparisonOperator: 'EQ',
                AttributeValueList: [{ S: event.userSub }]
            }
        }
    }));

    const response$ = command$
        .pipe(
            switchMap(command => {
                return from(client.send(command))

            })
        )

    return lastValueFrom(response$)

}
