import { StackProps } from "aws-cdk-lib";
import { CfnIdentityPool, UserPool, UserPoolClient, UserPoolDomain } from "aws-cdk-lib/aws-cognito";

export interface CognitoProps extends StackProps {
    userPool: UserPool,
    userPoolClient: UserPoolClient,
    userPoolDomain: UserPoolDomain,
    identityPool?: CfnIdentityPool,
}