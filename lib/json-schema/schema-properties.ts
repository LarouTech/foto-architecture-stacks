import { JsonSchemaType } from "aws-cdk-lib/aws-apigateway";

export const configProps = {
    region: {
        type: JsonSchemaType.STRING,
        description: 'The aws region'
    },
    projectName: {
        type: JsonSchemaType.STRING,
        description: 'Name of the project'
    },
    stage: {
        type: JsonSchemaType.STRING,
        description: 'SDLC stage'
    }

}

export const dynamodbPutItemProps = {
    region: {
        type: JsonSchemaType.STRING,
        description: 'The aws region'
    },
    tableName: {
        type: JsonSchemaType.STRING,
        description: 'The dynamodb table name'
    },
    key: {
        type: JsonSchemaType.STRING,
        description: 'The dynamodb key name'
    },
    value: {
        type: JsonSchemaType.STRING,
        description: 'The dynamodb key value'
    },
}

export const dynamodbGetItemProps = {
    region: {
        type: JsonSchemaType.STRING,
        description: 'The aws region'
    },
    tableName: {
        type: JsonSchemaType.STRING,
        description: 'The dynamodb table name'
    },
    profileId: {
        type: JsonSchemaType.STRING,
        description: 'The dynamodb profileId'
    },

}





