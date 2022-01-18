import { StackProps } from "aws-cdk-lib";
import { IHostedZone } from "aws-cdk-lib/aws-route53";

export interface Route53Props extends StackProps {
    hostedZone: IHostedZone
}