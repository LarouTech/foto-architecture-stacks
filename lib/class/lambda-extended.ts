import { Duration, Stack, StackProps } from "aws-cdk-lib";
import { Effect, PolicyDocument, PolicyStatement, Role, ServicePrincipal } from "aws-cdk-lib/aws-iam";
import { Code, Function, ILayerVersion, LayerVersion, Runtime } from "aws-cdk-lib/aws-lambda";
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";
import { Construct } from "constructs";
import * as path from 'path'


export class LambdaExtended extends Stack {
    constructor(scope: Construct, id: string, props: StackProps) {
        super(scope, id, props);
    }

    createLambdaLayer(name: string, layerPath: string) {
        return new LayerVersion(this, name, {
            code: Code.fromAsset(layerPath),
            compatibleRuntimes: [Runtime.NODEJS_14_X],
            description: `${name} for nodejs lambda`,
            layerVersionName: name,
        });
    }

    createLambdaFunction(name: string, filePath: string, layers: ILayerVersion[], role?: any) {
        return new NodejsFunction(this, `${process.env.PROJECT_NAME}-${name}`, {
            runtime: Runtime.NODEJS_14_X,
            handler: 'main',
            layers: layers,
            functionName: `${process.env.PROJECT_NAME}-${name}`,
            role: role,
            timeout: Duration.seconds(5),
            entry: path.join(__dirname, `../../${filePath}`),
        });
    };

    createPolicyDocument(actions: string[]) {
        return new PolicyDocument({
            statements: [
                new PolicyStatement({
                    resources: ['*'],
                    actions: actions,
                    effect: Effect.ALLOW,
                }),
            ],
        });
    };

    createIamRole(name: string, id: string, policy: any) {
        return  new Role(this, id, {
            roleName: name,
            assumedBy: new ServicePrincipal('lambda.amazonaws.com'),
            description: `${name} for lambda function`,
            inlinePolicies: {
                CognitoLIstUSers: policy,
            },
        });
    }
}