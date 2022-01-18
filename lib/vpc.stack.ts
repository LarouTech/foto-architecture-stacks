import { Stack, StackProps } from "aws-cdk-lib";
import { GatewayVpcEndpointAwsService, InterfaceVpcEndpoint, SubnetType, Vpc } from "aws-cdk-lib/aws-ec2";
import { Construct } from "constructs";

export class VpcStack extends Stack  {
    public readonly vpc: Vpc;
    public readonly vpcEndpoint: InterfaceVpcEndpoint

    constructor(scope: Construct, id: string, props: StackProps) {
        super(scope, id, props);

        this.vpc = new Vpc(this, 'Vpc', {
            cidr: '10.0.0.0/16',
            enableDnsHostnames: true,
            enableDnsSupport: true,
            natGateways: 1,
            maxAzs: 2,
            subnetConfiguration: [
                {
                    name: 'public',
                    subnetType: SubnetType.PUBLIC,
                    cidrMask: 24
                },
                {
                    name: 'private',
                    subnetType: SubnetType.PRIVATE_WITH_NAT,
                    cidrMask: 24
                },
                {
                    name: 'isolated',
                    subnetType: SubnetType.PRIVATE_ISOLATED,
                    cidrMask: 24
                },
            ],
        })


        const vpcEndpoint = this.vpc.addGatewayEndpoint('GatewayEndpoint', {
            service: GatewayVpcEndpointAwsService.S3,
        })

        

    }
}
