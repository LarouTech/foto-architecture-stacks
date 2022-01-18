import { StackProps } from "aws-cdk-lib";
import { IFunction } from "aws-cdk-lib/aws-lambda";

export interface FotoLambdaProps extends StackProps {
    getSecretValueCommand?: IFunction,
    createThumbnails?: IFunction,
    putItemDynamodb?: IFunction,
    getItemDynamodb?: IFunction
}