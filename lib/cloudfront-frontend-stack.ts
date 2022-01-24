import { Duration, RemovalPolicy, Stack } from "aws-cdk-lib";
import { CertificateValidation, DnsValidatedCertificate } from "aws-cdk-lib/aws-certificatemanager";
import { CloudFrontWebDistribution, OriginAccessIdentity, ViewerCertificate, ViewerProtocolPolicy } from "aws-cdk-lib/aws-cloudfront";
import { S3Origin } from "aws-cdk-lib/aws-cloudfront-origins";
import { ARecord, RecordTarget } from "aws-cdk-lib/aws-route53";
import { CloudFrontTarget } from "aws-cdk-lib/aws-route53-targets";
import { BlockPublicAccess, Bucket, HttpMethods } from "aws-cdk-lib/aws-s3";
import { Construct } from "constructs";
import { Route53Props } from "./interfaces/route53-props";

interface CustomProps extends Route53Props { }

export class CloudfrontFrontendStack extends Stack {

    public readonly staticWebsiteBucket: Bucket;

    constructor(scope: Construct, id: string, props: CustomProps) {
        super(scope, id, props);

        const { hostedZone } = props!

        //Static website S3 bucket
        this.staticWebsiteBucket = new Bucket(this, `${process.env.PROJECT_NAME}-WebsiteBucket`, {
            bucketName: process.env.S3_BUCKET_STATIC_WEBSITE,
            publicReadAccess: false,
            blockPublicAccess: BlockPublicAccess.BLOCK_ALL,
            websiteIndexDocument: 'index.html',
            removalPolicy: RemovalPolicy.DESTROY,
            autoDeleteObjects: true,
            cors: [{
                allowedOrigins: ['*'],
                allowedMethods: [HttpMethods.GET],
            }],
        })

        //Cloudfront OAI access to S3
        const oai = new OriginAccessIdentity(this, `${process.env.PROJECT_NAME}-FrontendOAI`);
        this.staticWebsiteBucket.grantRead(oai)

        //Cloudfront s3 origin
        const s3Origin = new S3Origin(this.staticWebsiteBucket, {
            originAccessIdentity: oai,
        })


        //Cloudfront distribution SSL certificate
        const certificate = new DnsValidatedCertificate(this, `${process.env.PROJECT_NAME}-DistCertificate`, {
            domainName: process.env.DOMAIN_NAME!,
            hostedZone: hostedZone,
            validation: CertificateValidation.fromDns(hostedZone),
            region: process.env.AWS_REGION
        })

        // certificate.applyRemovalPolicy(RemovalPolicy.DESTROY)

        //Viewer certs for Cloudfromt from SSM certificate
        const viewerCerts = ViewerCertificate.fromAcmCertificate(certificate, {
            aliases: [process.env.DOMAIN_NAME!]
        })

        //Cloudfront distribution
        const frontendDistribution = new CloudFrontWebDistribution(this, `${process.env.PROJECT_NAME}-FrontendDistribution`, {
            originConfigs: [
                {
                    behaviors: [
                        {
                            isDefaultBehavior: true,
                            minTtl: Duration.seconds(0),
                        },
                    ],
                    s3OriginSource: {
                        s3BucketSource: this.staticWebsiteBucket,
                        originAccessIdentity: oai
                    },
                }

            ],
            viewerCertificate: viewerCerts,
            viewerProtocolPolicy: ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
            errorConfigurations: [
                {
                    errorCode: 404,
                    responsePagePath: '/index.html',
                    responseCode: 200
                },
                {
                    errorCode: 403,
                    responsePagePath: '/index.html',
                    responseCode: 200
                }
            ]
        })



        //Route53 ARecord alias for Cloudfront distribution
        const route53Domain = new ARecord(this, `${process.env.PROJECT_NAME}-DistributionRoute53ARecord`, {
            zone: hostedZone,
            target: RecordTarget.fromAlias(new CloudFrontTarget(frontendDistribution)),
            recordName: process.env.DOMAIN_NAME!
        })

    }

}