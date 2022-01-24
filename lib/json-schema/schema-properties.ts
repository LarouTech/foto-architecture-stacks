import { JsonSchemaType } from "aws-cdk-lib/aws-apigateway";
import { Schema } from "inspector";

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


export const putItemFotoProps = {
   region: {
        type: JsonSchemaType.STRING,
        description: 'aws region'
    },
    tableName: {
        type: JsonSchemaType.STRING,
        description: 'foto table name'
    }
   
}

export const getItemFotoProps = {
    region: {
        type: JsonSchemaType.STRING,
        description: 'aws region'
    },
    tableName: {
        type: JsonSchemaType.STRING,
        description: 'foto table name'
    },
    userSub: {
        type: JsonSchemaType.STRING,
        description: 'cognito user sub'
    }
   
}

export const deleteItemFotoProps = {
    region: {
        type: JsonSchemaType.STRING,
        description: 'aws region'
    },
    tableName: {
        type: JsonSchemaType.STRING,
        description: 'foto table name'
    },
    id: {
        type: JsonSchemaType.STRING,
        description: 'image id in dynamodb'
    }
   
}




