import { RemovalPolicy, Stack, StackProps } from 'aws-cdk-lib';
import {
    BlockPublicAccess,
    Bucket,
    EventType,
    HttpMethods
} from 'aws-cdk-lib/aws-s3';
import { LambdaDestination } from 'aws-cdk-lib/aws-s3-notifications';
import { Construct } from 'constructs';
import { FotoLambdaProps } from './interfaces/foto-lambda-props';

interface CustomProps extends FotoLambdaProps { }

export class S3FileUploadStack extends Stack {
    public readonly fileUploadBucket: Bucket;

    constructor(scope: Construct, id: string, props?: CustomProps) {
        super(scope, id, props);

        const { createThumbnails } = props!;

        this.fileUploadBucket = new Bucket(this, 'FileUploadBucket', {
            autoDeleteObjects: true,
            blockPublicAccess: BlockPublicAccess.BLOCK_ALL,
            bucketName: `${process.env.PROJECT_NAME}-upload-bucket`,
            cors: [
                {
                    allowedHeaders: ['*'],
                    allowedMethods: [
                        HttpMethods.GET,
                        HttpMethods.PUT,
                        HttpMethods.DELETE
                    ],
                    allowedOrigins: ['*']
                }
            ],
            removalPolicy: RemovalPolicy.DESTROY,
            versioned: true
        });

        //S3 EVENT TRIGGER
        this.fileUploadBucket.addEventNotification(
            EventType.OBJECT_CREATED,
            new LambdaDestination(createThumbnails!),
            {
                prefix:
                    process.env.PROJECT_NAME +
                    '/original/'
            }
        );
        // this.fileUploadBucket.addEventNotification(
        //     EventType.OBJECT_CREATED_PUT,
        //     new LambdaDestination(detectLabels!),
        //     {
        //         prefix:
        //             process.env.PROJECT_NAME +
        //             '/original/'
        //     }
        // )
    }
}
