import { AttributeValue, DynamoDBClient, PutItemCommand, PutItemCommandOutput } from "@aws-sdk/client-dynamodb";
import { fromEnv } from "@aws-sdk/credential-provider-env";
import { ALL } from "dns";
import { catchError, from, lastValueFrom, of, switchMap } from "rxjs";

interface Profile {
    id: string
    email: string,
    creationDate: Date,
    firstName?: string,
    lastName?: string,
    lastLogin?: Date,
    alias?: string
    cognitoSub: string,
}

interface EventDto {
    region: string,
    tableName: string,
    item: Profile
}

export async function main(event: EventDto): Promise<PutItemCommandOutput> {
    const client = new DynamoDBClient({
        region: event.region,
        credentials: fromEnv()
    });

    const command$ = of(new PutItemCommand({
        TableName: event.tableName,
        Item: {
            'id': {
                S: event.item.id
            },
            'email': {
                S: event.item.email
            },
            'creationDate': {
                S: event.item.creationDate.toString()
            },
            'cognitoSub': {
                S: event.item.cognitoSub
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
