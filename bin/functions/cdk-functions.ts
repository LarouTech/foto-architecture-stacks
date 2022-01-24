import { App } from "aws-cdk-lib";
import { IHostedZone } from "aws-cdk-lib/aws-route53";
import { Route53Stack } from '../../lib/route53-stack';
import { CloudfrontFrontendStack } from '../../lib/cloudfront-frontend-stack';
import { Bucket } from "aws-cdk-lib/aws-s3";
import { CodePipelineFrontendStack } from "../../lib/code-pipeline-frontend-stack";
import { FotoLambdaStack } from "../../lib/foto-lambda-stack";
import { IFunction } from "aws-cdk-lib/aws-lambda";
import { CfnIdentityPool, UserPool, UserPoolClient, UserPoolDomain } from "aws-cdk-lib/aws-cognito";
import { FotoApiGatewayStack } from "../../lib/foto-apiGateway-stack";
import { SecretStack } from "../../lib/secret-stack";
import { S3FileUploadStack } from "../../lib/s3-file-upload-stack";
import { CognitoStack } from "../../lib/cognito-stack";
import { VpcStack } from "../../lib/vpc.stack";
import { Vpc } from "aws-cdk-lib/aws-ec2";
import { EcsFargateStack } from "../../lib/ecs-fargate-stack";
import { CodePipelineRestapiStack } from "../../lib/code-pipeline-restapi";
import { FargateService } from "aws-cdk-lib/aws-ecs";
import { ProfileDynamoDbStack } from "../../lib/profile-dynamodb-stack";
import { Table } from "aws-cdk-lib/aws-dynamodb";

export interface StackEnvironment {
    env: {
        region: string,
        account: string
    }
}

export enum STAGE {
    'DEV' = 'dev',
    'STE' = 'ste'
}

const environment: StackEnvironment = {
    env: {
        account: process.env.CDK_DEFAULT_ACCOUNT!,
        region: process.env.CDK_DEFAULT_REGION!
    }
};


const prefix = (stage: STAGE) => `${process.env.PROJECT_NAME}-${stage}`

export function cognitoStackBuilder(app: App, stage: STAGE, bucket: Bucket): CognitoStack {
    return new CognitoStack(app, `${prefix(stage)}-CognitoStack`, {
        ...environment,
        fileUploadBucket: bucket
    });
}

export function route53StackBuilder(app: App, stage: STAGE): Route53Stack {
    return new Route53Stack(app, `${prefix(stage)}-Route53Stack`, {
        ...environment
    })
}

export function cloudfrontFrontendStackBuilder(app: App, stage: STAGE, hostedZone: IHostedZone): CloudfrontFrontendStack {
    return new CloudfrontFrontendStack(app, `${prefix(stage)}-CloudfrontFrontendStack`, {
        ...environment,
        hostedZone: hostedZone
    })
}

export function codePipelineFrontendStackBuilder(app: App, stage: STAGE, staticWebsiteBucket: Bucket): CodePipelineFrontendStack {
    return new CodePipelineFrontendStack(app, `${prefix(stage)}-CodePipelineFrontendStack`, {
        ...environment,
        staticWebsiteBucket: staticWebsiteBucket
    })
}

export function fotoLambdaStackBuilder(app: App, stage: STAGE): FotoLambdaStack {
    return new FotoLambdaStack(app, `${prefix(stage)}-LambdaStack`, {
        ...environment,
    })
}

export function profileDynmodbStackBuilder(app: App, stage: STAGE) {
    return new ProfileDynamoDbStack(app, `${prefix(stage)}-DynamodbStack`, {
        ...environment
    } )
}


export function fotoApiGatewayStackBuilder(app: App, stage: STAGE, hostedZone: IHostedZone, getSecretValueCommand: IFunction, putItemProfile: IFunction, getItemProfile: IFunction, putItemFotoLabel: IFunction, getItemFotoLabel: IFunction, deleteItemFotoLabel: IFunction, userPool: UserPool, userPoolClient: UserPoolClient, userPoolDomain: UserPoolDomain): FotoApiGatewayStack {
    return new FotoApiGatewayStack(app, `${prefix(stage)}-ApiGatewayStack`, {
        ...environment,
        hostedZone: hostedZone,
        getSecretValueCommand: getSecretValueCommand,
        userPool: userPool,
        userPoolClient: userPoolClient,
        userPoolDomain: userPoolDomain,
        putItemProfile: putItemProfile,
        getItemProfile: getItemProfile,
        putItemFotoLabel: putItemFotoLabel,
        getItemFotoLabel: getItemFotoLabel,
        deleteItemFotoLabel: deleteItemFotoLabel
    })
}

export function secretStackBuilder(app: App, stage: STAGE, userPool: UserPool, userPoolClient: UserPoolClient, userPoolDomain: UserPoolDomain, identity: CfnIdentityPool, bucket: Bucket, profileTable: Table, fotoTable: Table): SecretStack {
    return new SecretStack(app, `${prefix(stage)}-SecretStack`, {
        ...environment,
        userPool: userPool,
        userPoolClient: userPoolClient,
        userPoolDomain: userPoolDomain,
        identityPool: identity,
        fileUploadBucket: bucket,
        profileTable: profileTable,
        fotoTable: fotoTable
    })
}

export function s3FileUploadStackBuilder(app: App, stage: STAGE, createThumbnails: IFunction): S3FileUploadStack {
    return new S3FileUploadStack(app, `${prefix(stage)}-S3FileUploadStack`, {
        ...environment,
        createThumbnails: createThumbnails,
    })
}

export function vpcStackBuilder(app: App, stage: STAGE): VpcStack {
    return new VpcStack(app, `${prefix(stage)}-VpcStack`, {
        ...environment,
    })
}

export function ecsFargateServiceBuilder(app: App, stage: STAGE, vpc: Vpc, hostedZone: IHostedZone): EcsFargateStack {
    return new EcsFargateStack(app, `${prefix(stage)}-EcsFargateStack`, {
        ...environment,
        vpc: vpc,
        hostedZone: hostedZone,
    })
}

export function codePipelineRestapiStackBuilder(app: App, stage: STAGE, ecsFargateService: FargateService): CodePipelineRestapiStack {
    return new CodePipelineRestapiStack(app, `${prefix(stage)}-CodePipelineRestapiStack`, {
        ...environment,
        ecsFargateService: ecsFargateService
    })
}

function extractLambda(lambdas: IFunction[], name: string): IFunction {
    return lambdas.find(lambda => lambda.functionName === `${process.env.PROJECT_NAME}-${name}`)!
}










