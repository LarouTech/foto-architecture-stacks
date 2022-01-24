import { Construct } from "constructs";
import { StackApiGatewayExtended } from "./class/apiGateway-extended";
import { FotoLambdaProps } from "./interfaces/foto-lambda-props";
import { Route53Props } from "./interfaces/route53-props";
import { configProps, deleteItemFotoProps, dynamodbGetItemProps, dynamodbPutItemProps, getItemFotoProps, putItemFotoProps } from "./json-schema/schema-properties";
import { HttpMethod } from './class/apiGateway-extended';
import { CognitoProps } from "./interfaces/cognito-props";
import { CfnAuthorizer } from "aws-cdk-lib/aws-apigateway";

interface CustomProps extends Route53Props, FotoLambdaProps, CognitoProps { }

export class FotoApiGatewayStack extends StackApiGatewayExtended {
    constructor(scope: Construct, id: string, props?: CustomProps) {
        super(scope, id, props!);

        const { hostedZone, getSecretValueCommand, userPool, putItemProfile, getItemProfile, putItemFotoLabel, getItemFotoLabel, deleteItemFotoLabel } = props!;

        const fotoApi = this.createApi('foto', process.env.STAGE_ENV!, hostedZone);
        this.requestValidator(fotoApi, 'this.validator');

        //Cloud formation Authorizer
        const cfnAuthorizer = new CfnAuthorizer(this, 'Authorizer', {
            restApiId: fotoApi.restApiId,
            type: 'COGNITO_USER_POOLS',
            identitySource: 'method.request.header.authorizer',
            name: `${process.env.PROJECT_NAME}-authorizer`,
            providerArns: [userPool.userPoolArn],
        })

        this.apiContruct(fotoApi, 'foto', configProps, 'config', getSecretValueCommand!, HttpMethod.POST);
        this.apiContruct(fotoApi, 'foto', dynamodbPutItemProps, 'create-profile', putItemProfile!, HttpMethod.POST, cfnAuthorizer);
        this.apiContruct(fotoApi, 'foto', dynamodbGetItemProps, 'get-profile', getItemProfile!, HttpMethod.POST, cfnAuthorizer);
        this.apiContruct(fotoApi, 'foto', putItemFotoProps, 'put-foto', putItemFotoLabel!, HttpMethod.POST, cfnAuthorizer);
        this.apiContruct(fotoApi, 'foto', getItemFotoProps, 'get-foto', getItemFotoLabel!, HttpMethod.POST, cfnAuthorizer);
        this.apiContruct(fotoApi, 'foto', deleteItemFotoProps, 'delete-foto', deleteItemFotoLabel!, HttpMethod.POST, cfnAuthorizer);


    }
}