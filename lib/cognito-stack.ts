// import { AccountRecovery, StringAttribute, UserPool, UserPoolClient, VerificationEmailStyle } from '@aws-cdk/aws-cognito';
import { Duration, RemovalPolicy, Stack, StackProps } from 'aws-cdk-lib';
import { AccountRecovery, CfnIdentityPool, CfnIdentityPoolRoleAttachment, OAuthScope, StringAttribute, UserPool, UserPoolClient, UserPoolClientIdentityProvider, UserPoolDomain, UserPoolIdentityProvider, VerificationEmailStyle } from 'aws-cdk-lib/aws-cognito';
import { Effect, FederatedPrincipal, PolicyStatement, Role } from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';
import { FileUploadBucketProps } from './interfaces/file-upload-bucket-props';

interface CustomProps extends FileUploadBucketProps { }

export class CognitoStack extends Stack {
  public readonly userPool: UserPool;
  public readonly userPoolClient: UserPoolClient;
  public readonly userPoolDomain: UserPoolDomain;
  public readonly identityPool: CfnIdentityPool;
  public readonly cognitoIdentityProviderProperty: string

  constructor(scope: Construct, id: string, props?: CustomProps) {
    super(scope, id, props);


    const { fileUploadBucket } = props!;

    const projectName = process.env.PROJECT_NAME

    //CREATE COGNITO USER POOL
    this.userPool = new UserPool(this, `${projectName}-userpool`, {
      userPoolName: `${projectName}-${process.env.STAGE_ENV}`,
      accountRecovery: AccountRecovery.EMAIL_ONLY,

      autoVerify: {
        email: true,
        phone: false
      },
      passwordPolicy: {
        minLength: 8,
        requireDigits: true,
        requireLowercase: true,
        requireSymbols: true,
        requireUppercase: true,
        tempPasswordValidity: Duration.days(1)
      },
      selfSignUpEnabled: true,
      signInCaseSensitive: true,
      standardAttributes: {
        email: {
          mutable: true,
          required: true
        }
      },
      customAttributes: {
        'profileId': new StringAttribute({
          minLen: 36,
          maxLen: 36,
          mutable: true,
        })
      },
      userVerification: {
        emailSubject: 'Get your validation code to signin to FoTo!',
        emailBody: 'Thanks for signing up to our awesome app! Your verification code is {####}',
        emailStyle: VerificationEmailStyle.CODE
      },
      removalPolicy: RemovalPolicy.DESTROY
    });

    this.userPoolDomain = new UserPoolDomain(this, 'Foto-UserPoolDomain', {
      userPool: this.userPool,
      cognitoDomain: {
        domainPrefix: projectName!
      }
    })


    //CREATE COGNITO USER POOL CLIENT
    this.userPoolClient = new UserPoolClient(this, `${projectName}-webApp`, {
      userPool: this.userPool,
      userPoolClientName: `${projectName!}-webApp`,
      supportedIdentityProviders: [UserPoolClientIdentityProvider.COGNITO],
      generateSecret: false,
      authFlows: {
        adminUserPassword: true,
        custom: true,
        userPassword: true,
        userSrp: true,
      },
      oAuth: {
        flows: {
          authorizationCodeGrant: true,
          implicitCodeGrant: true
        },
        scopes: [OAuthScope.EMAIL],
        callbackUrls: [
          `http://localhost:4200`
        ],
        logoutUrls: [
          'http://localhost:4200'
        ]
      }
    })

    const cognitoIdentityProviderProperty: CfnIdentityPool.CognitoIdentityProviderProperty = {
      clientId: this.userPoolClient.userPoolClientId,
      providerName: this.userPool.userPoolProviderName,
      serverSideTokenCheck: false,
    };


    this.identityPool = new CfnIdentityPool(this, `${process.env.PROJECT_NAME}-cognito-provider`, {
      allowUnauthenticatedIdentities: false,
      identityPoolName: `${process.env.PROJECT_NAME}-cognito-provider`,
      cognitoIdentityProviders: [cognitoIdentityProviderProperty],
      supportedLoginProviders: cognitoIdentityProviderProperty,
      allowClassicFlow: false,
    })



    const unauthenticatedRole = new Role(this, 'CognitoDefaultUnauthenticatedRole', {
      roleName: `${process.env.PROJECT_NAME}-cognito-unauth-role`,
      assumedBy: new FederatedPrincipal('cognito-identity.amazonaws.com', {
        "StringEquals": { "cognito-identity.amazonaws.com:aud": this.identityPool.ref },
        "ForAnyValue:StringLike": { "cognito-identity.amazonaws.com:amr": "unauthenticated" },
      }, "sts:AssumeRoleWithWebIdentity"),
    });

    unauthenticatedRole.addToPolicy(new PolicyStatement({
      effect: Effect.ALLOW,
      actions: [
        "mobileanalytics:PutEvents",
        "cognito-sync:*"
      ],
      resources: ["*"],
    }));

    const authenticatedRole = new Role(this, 'CognitoDefaultAuthenticatedRole', {
      roleName: `${process.env.PROJECT_NAME}-cognito-auth-role`,
      assumedBy: new FederatedPrincipal('cognito-identity.amazonaws.com', {
        "StringEquals": { "cognito-identity.amazonaws.com:aud": this.identityPool.ref },
        "ForAnyValue:StringLike": { "cognito-identity.amazonaws.com:amr": "authenticated" },
      }, "sts:AssumeRoleWithWebIdentity"),
    });

    authenticatedRole.addToPolicy(new PolicyStatement({
      effect: Effect.ALLOW,
      actions: [
        "mobileanalytics:PutEvents",
        "cognito-sync:*",
        "cognito-identity:*",
        "rekognition:*"
      ],
      resources: ["*"],
    }))

    authenticatedRole.addToPolicy(new PolicyStatement({
      effect: Effect.ALLOW,
      actions: ['s3:ListBucket'],
      resources: [fileUploadBucket.bucketArn],
      conditions: {
        ['StringLike']: {
          ['s3:prefix']: [
            projectName + '/original' + '/${cognito-identity.amazonaws.com:sub}',
            projectName + '/thumbnails' + '/${cognito-identity.amazonaws.com:sub}',
            projectName + '/medium' + '/${cognito-identity.amazonaws.com:sub}'
        ]
        }
      }
    }))

    authenticatedRole.addToPolicy(new PolicyStatement({
      effect: Effect.ALLOW,
      actions: [
        "s3:ListObjects",
        "s3:GetObject",
        "s3:PutObject",
        "s3:DeleteObject",
      ],
      resources: [
        fileUploadBucket.bucketArn + '/' + projectName + '/original' + '/${cognito-identity.amazonaws.com:sub}',
        fileUploadBucket.bucketArn + '/' + projectName + '/thumbnails' + '/${cognito-identity.amazonaws.com:sub}',
        fileUploadBucket.bucketArn + '/' + projectName + '/medium' + '/${cognito-identity.amazonaws.com:sub}',
        fileUploadBucket.bucketArn + '/' + projectName + '/original' + '/${cognito-identity.amazonaws.com:sub}/*',
        fileUploadBucket.bucketArn + '/' + projectName + '/thumbnails' + '/${cognito-identity.amazonaws.com:sub}/*',
        fileUploadBucket.bucketArn + '/' + projectName + '/medium' + '/${cognito-identity.amazonaws.com:sub}/*',
      ]
    }))



    const identityRoleAttachment = new CfnIdentityPoolRoleAttachment(this, `${process.env.PROJECT_NAME}-role-attachment`, {
      identityPoolId: this.identityPool.ref,
      roles: {
        'authenticated': authenticatedRole.roleArn,
        'unauthenticated': unauthenticatedRole.roleArn
      }
    })

  }



}
