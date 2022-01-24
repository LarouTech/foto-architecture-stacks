import { AuthorizationType, CfnAuthorizer, JsonSchema, JsonSchemaType, JsonSchemaVersion, LambdaIntegration, Method, MethodOptions, Model, PassthroughBehavior, RequestValidator, RestApi } from 'aws-cdk-lib/aws-apigateway';
import { Resource, Stack } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { ARecord, IHostedZone, RecordTarget } from 'aws-cdk-lib/aws-route53';
import { IFunction } from 'aws-cdk-lib/aws-lambda';
import { CertificateValidation, DnsValidatedCertificate } from 'aws-cdk-lib/aws-certificatemanager';
import { ApiGateway } from 'aws-cdk-lib/aws-route53-targets';
import { Route53Props } from '../interfaces/route53-props';

export enum HttpMethod {
    'GET' = 'GET',
    'POST' = 'POST',
    'DELETE' = 'DELETE',
    'HEAD' = 'HEAD',
    'PATCH' = 'PATCH',
    'PUT' = 'PUT'
}

interface CustomProps extends Route53Props { }

export class StackApiGatewayExtended extends Stack {

    public validator: RequestValidator;
    constructor(scope: Construct, id: string, props: CustomProps) {
        super(scope, id, props);
    }

    apiContruct(api: RestApi, name: string, schemaProps: any, ressourceName: string, iFunction: IFunction, method: HttpMethod, authorizer?: CfnAuthorizer) {
        const requestModel = this.defineRequestBodyMappingModel(api, `${ressourceName.split('-').join('')}RequestModel`, schemaProps);
        this.addApiRessource(api, ressourceName);
        const IntegrationResponse = this.addIntegrationResponse(iFunction);
        const methodOptions = this.addMethodOptions(requestModel, this.validator, authorizer);
        this.addApiMethod(api, ressourceName, method, IntegrationResponse, methodOptions)
    }

    createApi(name: string, stage: string, hostedZone: IHostedZone): RestApi {
        const api = new RestApi(this, `${process.env.PROJECT_NAME}-${name}`, {
            deployOptions: {
                stageName: stage,
            },
            restApiName: `${name}-${process.env.STAGE_ENV}`,
            defaultCorsPreflightOptions: {
                allowOrigins: ['*'],
                allowHeaders: [
                    'Content-Type',
                    'X-Amz-Date',
                    'Authorization',
                    'X-Api-Key',
                    'X-Amz-Security-Token',
                    'authorization',
                    'authorizer'
                ],
                allowMethods: ['GET', 'POST', 'DELETE', 'UPDATE', 'PATCH', 'OPTIONS'],
                statusCode: 200
            },
            domainName: {
                domainName: `${name}.${process.env.DOMAIN_NAME}`,
                certificate: new DnsValidatedCertificate(this, `${name}-certificate`, {
                    domainName: `${process.env.PROJECT_NAME}.${process.env.DOMAIN_NAME}`,
                    hostedZone: hostedZone,
                    validation: CertificateValidation.fromDns(),
                    region: process.env.AWS_REGION
                }),
            },
        });

        //Route53 ARecord alias for Cloudfront distribution
        const route53Domain = new ARecord(this, `${process.env.PROJECT_NAME}-${name}-Route53ARecord`, {
            zone: hostedZone,
            target: RecordTarget.fromAlias(new ApiGateway(api)),
            recordName: `${process.env.PROJECT_NAME}.${process.env.DOMAIN_NAME!}`,
        })

        return api
    }

    defineRequestBodyMappingModel(api: RestApi, name: string, properties: { [name: string]: JsonSchema }): Model {
        return new Model(this, `${process.env.PROJECT_NAME}-${name}`, {
            restApi: api,
            schema: {
                schema: JsonSchemaVersion.DRAFT7,
                title: name,
                type: JsonSchemaType.OBJECT,
                properties: properties,

            },
            contentType: 'application/json',
            modelName: name,
            description: `config ${name} request model`,
        });
    }

    requestValidator(api: RestApi, name: string): RequestValidator {
        return new RequestValidator(this, `${process.env.PROJECT_NAME}-${name}`, {
            restApi: api,
            requestValidatorName: name,
            validateRequestBody: true,
            validateRequestParameters: true,
        })
    }

    addApiRessource(api: RestApi, name: string): Resource {
        const resource = api.root.addResource(name);
        return resource
    }

    addIntegrationResponse(lambdaFn: IFunction): LambdaIntegration {
        return new LambdaIntegration(lambdaFn, {
            proxy: false,
            integrationResponses: [{
                statusCode: '200',
                responseParameters: {
                    'method.response.header.Access-Control-Allow-Origin': "'*'",
                }
            }],
            passthroughBehavior: PassthroughBehavior.WHEN_NO_MATCH,
        },
        );
    }

    addMethodOptions(model: Model, validator: RequestValidator, authorizer?: CfnAuthorizer): MethodOptions {
        return {
            authorizationType: authorizer ? AuthorizationType.COGNITO : AuthorizationType.NONE,
            authorizer: authorizer ? { authorizerId: authorizer!.ref } : undefined,
            methodResponses: [
                {
                    statusCode: '200',
                    responseParameters: {
                        'method.response.header.Access-Control-Allow-Origin': true,
                    }
                },
            ],
            requestModels: {
                'application/json': model
            },
            requestValidator: validator,
        };
    }

    addApiMethod(api: RestApi, path: string, method: HttpMethod, integrationResponse: LambdaIntegration, options: MethodOptions): Method {
        return api.root
            .resourceForPath(path)
            .addMethod(method, integrationResponse, options)
    }
}