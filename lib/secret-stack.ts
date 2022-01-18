import { RemovalPolicy, Stack } from "aws-cdk-lib";
import { UserPoolClientIdentityProvider } from "aws-cdk-lib/aws-cognito";
import { Secret } from "aws-cdk-lib/aws-secretsmanager";
import { Construct } from "constructs";
import { CognitoProps } from "./interfaces/cognito-props";
import { DynamodbProps } from "./interfaces/dynamodb-props";
import { FileUploadBucketProps } from "./interfaces/file-upload-bucket-props";

interface CustomProps extends CognitoProps, FileUploadBucketProps, DynamodbProps { }

export class SecretStack extends Stack {
    constructor(scope: Construct, id: string, props?: CustomProps) {
        super(scope, id, props);

        const { userPool, userPoolClient, identityPool, fileUploadBucket, profileTable } = props!;

        const cognitoSecret = new Secret(this, `${process.env.PROJECT_NAME}-${process.env.STAGE_ENV}-secret`, {
            secretName: `${process.env.PROJECT_NAME}-${process.env.STAGE_ENV}-secret`,
            description: `${process.env.PROJECT_NAME}-secret for frontend and backend integration`,
            removalPolicy: RemovalPolicy.DESTROY,
            
            generateSecretString: {
                secretStringTemplate: JSON.stringify({
                    userPoolId: userPool.userPoolId,
                    region: process.env.AWS_REGION,
                    appClient: userPoolClient.userPoolClientId,
                    projectName: process.env.PROJECT_NAME,
                    stage: process.env.STAGE_ENV,
                    rootDomain: process.env.DOMAIN_NAME,
                    identityPoolId: identityPool!.ref,
                    uploadBucket: fileUploadBucket.bucketName,
                    profileTableName: profileTable.tableName

                }),
                generateStringKey: 'config',
            }
        })

    }

}
