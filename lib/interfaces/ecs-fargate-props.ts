import { StackProps } from "aws-cdk-lib";
import { FargateService } from "aws-cdk-lib/aws-ecs";

export interface EcsFargateProps extends StackProps {
    ecsFargateService: FargateService
}