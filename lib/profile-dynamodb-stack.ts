import { RemovalPolicy, Stack, StackProps } from "aws-cdk-lib";
import { AttributeType, BillingMode, Table, TableEncryption } from "aws-cdk-lib/aws-dynamodb";
import { Construct } from "constructs";

export class ProfileDynamoDbStack extends Stack {
    public readonly profileTable: Table;

    constructor(scope: Construct, id: string, props: StackProps) {
        super(scope, id, props);

        this.profileTable = new Table(this, `${process.env.PROJECT_NAME}-profile-table`, {
            partitionKey: {
                name: 'id',
                type: AttributeType.STRING
            },
            tableName: `${process.env.PROJECT_NAME}-profile-table`,
            removalPolicy: RemovalPolicy.DESTROY
            
        })


    
        

    }
}