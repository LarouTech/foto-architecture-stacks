import { StackProps } from "aws-cdk-lib";
import { Table } from "aws-cdk-lib/aws-dynamodb";

export interface DynamodbProps extends StackProps {
    profileTable: Table,
    fotoTable: Table
    
}