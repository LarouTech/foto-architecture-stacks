import { RemovalPolicy, Stack, StackProps } from "aws-cdk-lib";
import { AttributeType, BillingMode, Table, TableEncryption } from "aws-cdk-lib/aws-dynamodb";
import { Construct } from "constructs";

export class ProfileDynamoDbStack extends Stack {
    public readonly profileTable: Table;
    public readonly fotoTable: Table

    constructor(scope: Construct, id: string, props: StackProps) {
        super(scope, id, props);

        this.profileTable = new Table(this, 'profile-table', {
            partitionKey: {
                name: 'id',
                type: AttributeType.STRING
            },
            tableName: 'profile-table',
            removalPolicy: RemovalPolicy.DESTROY
            
        })

        this.fotoTable = new Table(this, 'foto-table', {
            partitionKey: {
                name: 'id',
                type: AttributeType.STRING
            },
            tableName: 'foto-table',
            removalPolicy: RemovalPolicy.DESTROY,
        })

        this.fotoTable.addGlobalSecondaryIndex({
            indexName: 'userSub',
            partitionKey: {
                name: 'userSub',
                type: AttributeType.STRING
            }
        })


    
        

    }
}