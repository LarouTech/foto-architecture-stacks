import { App } from 'aws-cdk-lib';
import {
    cloudfrontFrontendStackBuilder,
    codePipelineFrontendStackBuilder,
    codePipelineRestapiStackBuilder,
    cognitoStackBuilder,
    ecsFargateServiceBuilder,
    fotoApiGatewayStackBuilder,
    fotoLambdaStackBuilder,
    profileDynmodbStackBuilder,
    route53StackBuilder,
    s3FileUploadStackBuilder,
    secretStackBuilder,
    STAGE,
    vpcStackBuilder
} from './cdk-functions';
//DEV STACK
export function devStackBuilder(app: App, stage: STAGE): void {
    const fotoLambdaStack = fotoLambdaStackBuilder(app, stage);
    const dynamodbStack = profileDynmodbStackBuilder(app, stage)

    const s3FileUploadStack = s3FileUploadStackBuilder(
        app,
        stage,
        fotoLambdaStack.createThumbnails,
    ); 
    
    const cognitoStack = cognitoStackBuilder(
        app,
        stage,
        s3FileUploadStack.fileUploadBucket
    );

    const route53Stack = route53StackBuilder(app, stage);

    const cloudfrontFrontendStack = cloudfrontFrontendStackBuilder(
        app,
        stage,
        route53Stack.hostedZone
    );

    codePipelineFrontendStackBuilder(
        app,
        stage,
        cloudfrontFrontendStack.staticWebsiteBucket
    );



    fotoApiGatewayStackBuilder(
        app,
        stage,
        route53Stack.hostedZone,
        fotoLambdaStack.getSecretValueCommand,
        fotoLambdaStack.putItemProfile,
        fotoLambdaStack.getItemProfile,
        fotoLambdaStack.putItemFotoLabel,
        fotoLambdaStack.getItemFotoLabel,
        fotoLambdaStack.deleteItemFotoLabel,
        cognitoStack.userPool,
        cognitoStack.userPoolClient,
        cognitoStack.userPoolDomain
    );

    secretStackBuilder(
        app,
        stage,
        cognitoStack.userPool,
        cognitoStack.userPoolClient,
        cognitoStack.userPoolDomain,
        cognitoStack.identityPool,
        s3FileUploadStack.fileUploadBucket,
        dynamodbStack.profileTable,
        dynamodbStack.fotoTable
    );


}

//STE STACK
export function steStackBuilder(app: App, stage: STAGE): void {
    const fotoLambdaStack = fotoLambdaStackBuilder(app, stage);
    const dynamodbStack = profileDynmodbStackBuilder(app, stage)

    const s3FileUploadStack = s3FileUploadStackBuilder(
        app,
        stage,
        fotoLambdaStack.createThumbnails,

    );

    const cognitoStack = cognitoStackBuilder(
        app,
        stage,
        s3FileUploadStack.fileUploadBucket
    );

    const route53Stack = route53StackBuilder(app, stage);

    const cloudfrontFrontendStack = cloudfrontFrontendStackBuilder(
        app,
        stage,
        route53Stack.hostedZone
    );

    codePipelineFrontendStackBuilder(
        app,
        stage,
        cloudfrontFrontendStack.staticWebsiteBucket
    );


    fotoApiGatewayStackBuilder(
        app,
        stage,
        route53Stack.hostedZone,
        fotoLambdaStack.getSecretValueCommand,
        fotoLambdaStack.putItemProfile,
        fotoLambdaStack.getItemProfile,
        fotoLambdaStack.putItemFotoLabel,
        fotoLambdaStack.getItemFotoLabel,
        fotoLambdaStack.deleteItemFotoLabel,
        cognitoStack.userPool,
        cognitoStack.userPoolClient,
        cognitoStack.userPoolDomain
    );

    secretStackBuilder(
        app,
        stage,
        cognitoStack.userPool,
        cognitoStack.userPoolClient,
        cognitoStack.userPoolDomain,
        cognitoStack.identityPool,
        s3FileUploadStack.fileUploadBucket,
        dynamodbStack.profileTable,
        dynamodbStack.fotoTable
    );

    const vpcStack = vpcStackBuilder(app, stage);

    const ecsFargateService = ecsFargateServiceBuilder(
        app,
        stage,
        vpcStack.vpc,
        route53Stack.hostedZone
    );

    codePipelineRestapiStackBuilder(
        app,
        stage,
        ecsFargateService.ecsFargateService
    );
}
