import { StackProps } from "aws-cdk-lib";
import { InterfaceVpcEndpoint, Vpc } from "aws-cdk-lib/aws-ec2";

export interface VpcProps extends StackProps {
    vpc: Vpc,
    vpcEndpoint?: InterfaceVpcEndpoint
    
}