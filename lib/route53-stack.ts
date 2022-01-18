import { Stack, StackProps } from "aws-cdk-lib";
import { HostedZone, IHostedZone } from "aws-cdk-lib/aws-route53";
import { Construct } from "constructs";

export class Route53Stack extends Stack {
    public readonly hostedZone: IHostedZone;

    constructor(scope: Construct, id: string, props: StackProps) {
        super(scope, id, props);

        this.hostedZone = HostedZone.fromLookup(this, `${process.env.PROJECT_NAME}-HostedZone`, {
            domainName: process.env.DOMAIN_NAME!,
            privateZone: false
        });

    }



}