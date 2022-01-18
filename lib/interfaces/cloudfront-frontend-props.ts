import { StackProps } from "aws-cdk-lib";
import { Bucket } from "aws-cdk-lib/aws-s3";

export interface CloudfrontFrontendProps extends StackProps {
    staticWebsiteBucket: Bucket
}