import { Duration, StackProps } from 'aws-cdk-lib';
import { LambdaFunction } from 'aws-cdk-lib/aws-events-targets';
import { Effect, ManagedPolicy, PolicyDocument, PolicyStatement, Role, ServicePrincipal } from 'aws-cdk-lib/aws-iam';
import { Code, Function, IFunction, Runtime } from 'aws-cdk-lib/aws-lambda';
import { Construct } from 'constructs';
import { LambdaExtended } from './class/lambda-extended';

export class FotoLambdaStack extends LambdaExtended {
    public readonly getSecretValueCommand: IFunction;
    public readonly createThumbnails: IFunction;
    public readonly putItemDynamodb: IFunction;
    public readonly getItemDynamodb: IFunction;

    constructor(scope: Construct, id: string, props: StackProps) {
        super(scope, id, props);

        const lambdaPath = 'src/lambda/lib'

        //Create Policy docuemnt
        const secretManagerPolicy = this.createPolicyDocument([
            'secretsmanager:GetResourcePolicy',
            'secretsmanager:GetSecretValue',
            'secretsmanager:DescribeSecret',
            'secretsmanager:ListSecretVersionIds'
        ]);


        const dynamodbPolicy = new PolicyDocument({
            statements: [
                new PolicyStatement({
                    effect: Effect.ALLOW,
                    actions: [
                        "dynamodb:List*",
                        "dynamodb:DescribeReservedCapacity*",
                        "dynamodb:DescribeLimits",
                        "dynamodb:DescribeTimeToLive"
                    ],
                    resources: ['*']
                }),
                new PolicyStatement({
                    effect: Effect.ALLOW,
                    actions: [
                        "dynamodb:BatchGet*",
                        "dynamodb:DescribeStream",
                        "dynamodb:DescribeTable",
                        "dynamodb:Get*",
                        "dynamodb:Query",
                        "dynamodb:Scan",
                        "dynamodb:BatchWrite*",
                        "dynamodb:CreateTable",
                        "dynamodb:Delete*",
                        "dynamodb:Update*",
                        "dynamodb:PutItem"
                    ],
                    resources: [
                        `arn:aws:dynamodb:${process.env.AWS_REGION}:${process.env.AWS_ACCOUNT}:table/${process.env.PROJECT_NAME}-profile-table`
                    ]
                })
            ]
        })

        const thumbnailsPolicy = new PolicyDocument({
            statements: [
                new PolicyStatement({
                    effect: Effect.ALLOW,
                    actions: [
                        "logs:PutLogEvents",
                        "logs:CreateLogGroup",
                        "logs:CreateLogStream"
                    ],
                    resources: ['arn:aws:logs:*:*:*'],
                }),
                new PolicyStatement({
                    effect: Effect.ALLOW,
                    actions: ['s3:*'],
                    resources: ['arn:aws:s3:::foto-upload-bucket/*'],
                })
            ]
        })

        const thumbnailsRole = new Role(this, 'thumbnailsRole', {
            roleName: 'thumbnails-role',
            assumedBy: new ServicePrincipal('lambda.amazonaws.com'),
            inlinePolicies: {
                thumbnailsPolicy: thumbnailsPolicy
            }
        })

        const dynamodbRole = new Role(this, 'dynamodbRole', {
            roleName: `${process.env.PROJECT_NAME}-dynamodb-role`,
            assumedBy: new ServicePrincipal('lambda.amazonaws.com'),
            inlinePolicies: {
                dynamodbPolicy: dynamodbPolicy
            }
        })

        // Create role, to which we'll attach our Policies
        const secretManagerRole = this.createIamRole(
            'SecretManager-Role',
            'scretMnagerRole',
            secretManagerPolicy
        );

        //Lambda Manage Policy
        const secretManagerManagedPolicy = ManagedPolicy.fromAwsManagedPolicyName(
            'service-role/AWSLambdaBasicExecutionRole'
        );

        const s3ClientManagedPolicy = ManagedPolicy.fromAwsManagedPolicyName(
            'service-role/AWSLambdaBasicExecutionRole'
        );

        const thumbnailsManagedPolicy = ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaBasicExecutionRole')

        const dynamodbManagedPolicy = ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaBasicExecutionRole')

        // attach the Managed Policy to the Role
        secretManagerRole.addManagedPolicy(secretManagerManagedPolicy);
        thumbnailsRole.addManagedPolicy(thumbnailsManagedPolicy)
        dynamodbRole.addManagedPolicy(dynamodbManagedPolicy)


        //LAMBDA 
        //Define lambda layers
        const cognitoIdentityProviderClientLayer = this.createLambdaLayer(
            'secretManagerLayer',
            'src/layers/secret-manager-client'
        );
        const credentialProviderLayer = this.createLambdaLayer(
            'credentialProviderLayer',
            'src/layers/creds-provider'
        );
        const s3ClientLayer = this.createLambdaLayer(
            's3ClientLayer',
            'src/layers/s3-client'
        );

        const rxjsLayer = this.createLambdaLayer(
            'rxjsLayer',
            'src/layers/rxjs'
        );

        const sharpLayer = this.createLambdaLayer(
            'sharpLayer',
            'src/layers/sharp'
        );
        const rekognitionLayer = this.createLambdaLayer('rekognitionLayer', 'src/layers/rekognition-client')

        const awsSdkV2Layer = this.createLambdaLayer('awsSdkV2Layer', 'src/layers/aws-sdk-v2')

        const lambdaClientLayer = this.createLambdaLayer('lambdaClientLayer', 'src/layers/lambda-client')

        const dynamoDbLayer = this.createLambdaLayer('dynamoDbLayer', 'src/layers/dynamodb')


        //Define lambdas
        this.getSecretValueCommand = this.createLambdaFunction(
            'getSecretValueCommand',
            `${lambdaPath}/getSecretValueCommand.ts`,
            [cognitoIdentityProviderClientLayer, credentialProviderLayer],
            secretManagerRole
        );

        this.putItemDynamodb = this.createLambdaFunction(
            'putItemDynamodb',
            `${lambdaPath}/putItemDynamodb.ts`,
            [credentialProviderLayer, dynamoDbLayer, rxjsLayer],
            dynamodbRole
        );

        this.getItemDynamodb = this.createLambdaFunction(
            'getItemDynamodb',
            `${lambdaPath}/getItemDynamodb.ts`,
            [credentialProviderLayer, dynamoDbLayer, rxjsLayer],
            dynamodbRole
        );



        this.createThumbnails = new Function(this, `${process.env.PROJECT_NAME}-createThumbnails`, {
            code: Code.fromAsset(`${lambdaPath}/createThumbnails`),
            runtime: Runtime.NODEJS_14_X,
            handler: 'createThumbnails.handler',
            functionName: `${process.env.PROJECT_NAME}-createThumbnails`,
            layers: [sharpLayer, awsSdkV2Layer, lambdaClientLayer],
            role: thumbnailsRole,
            timeout: Duration.seconds(30)



        })


    }
}
