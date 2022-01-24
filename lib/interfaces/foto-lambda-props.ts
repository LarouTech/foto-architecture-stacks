import { StackProps } from "aws-cdk-lib";
import { IFunction } from "aws-cdk-lib/aws-lambda";

export interface FotoLambdaProps extends StackProps {
    getSecretValueCommand?: IFunction,
    createThumbnails?: IFunction,
    putItemProfile?: IFunction,
    getItemProfile?: IFunction,
    putItemFotoLabel?: IFunction,
    getItemFotoLabel?: IFunction,
    deleteItemFotoLabel?: IFunction
}