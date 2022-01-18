import { Duration, RemovalPolicy, Stack, StackProps } from "aws-cdk-lib"
import { Certificate, CertificateValidation } from "aws-cdk-lib/aws-certificatemanager";
import { Peer, Port, SecurityGroup } from "aws-cdk-lib/aws-ec2";
import { Repository } from "aws-cdk-lib/aws-ecr";
import { Cluster, Compatibility, ContainerImage, FargateService, NetworkMode, Protocol, TaskDefinition } from "aws-cdk-lib/aws-ecs";
import {ApplicationLoadBalancer, ApplicationProtocol, ApplicationTargetGroup, IpAddressType, ListenerAction, TargetGroupLoadBalancingAlgorithmType, TargetType } from "aws-cdk-lib/aws-elasticloadbalancingv2";
import { ARecord, RecordTarget } from "aws-cdk-lib/aws-route53";
import { LoadBalancerTarget } from "aws-cdk-lib/aws-route53-targets";
import { Construct } from "constructs";
import { Route53Props } from "./interfaces/route53-props";
import { VpcProps } from "./interfaces/vpc-props";
import { RestApiContainer } from "./meta/container-properties";

interface CustomProps extends VpcProps, Route53Props { }

export class EcsFargateStack extends Stack {
    public readonly ecsFargateService: FargateService;

    constructor(scope: Construct, id: string, props?: CustomProps) {
        super(scope, id, props!);

        const { vpc, hostedZone } = props!;
        const projectName = process.env.PROJECT_NAME

        //Create application load balancer and security group
        const albSecurityGroup = new SecurityGroup(this, 'AlbSecuirtyGroup', {
            vpc: vpc,
            securityGroupName: 'alb-security-group',
        });

        albSecurityGroup.addIngressRule(Peer.anyIpv4(), Port.tcp(80));
        albSecurityGroup.addIngressRule(Peer.anyIpv4(), Port.tcp(443));


        const alb = new ApplicationLoadBalancer(this, `${projectName}-application-loadbalancer`, {
            vpc,
            internetFacing: true,
            loadBalancerName: `${projectName}-public-alb`,
            securityGroup: albSecurityGroup,
            ipAddressType: IpAddressType.IPV4,
        })

        const route53Domain = new ARecord(this, `${projectName}-RestApiGatewayRoute53ARecord`, {
            zone: hostedZone,
            target: RecordTarget.fromAlias(new LoadBalancerTarget(alb)),
            recordName: `alb.${process.env.DOMAIN_NAME}`,
        })


        //ECS Cluster
        const ecsCluster = new Cluster(this, `${projectName}-EcsCluster`, {
            clusterName: `${projectName}-cluster`,
            containerInsights: true.valueOf(),
            enableFargateCapacityProviders: true,
            vpc: vpc,
        })

        //Create Task Definition
        const taskDefinition = new TaskDefinition(this, `${projectName}-TaskDefinition`, {
            compatibility: Compatibility.EC2_AND_FARGATE,
            cpu: '512',
            memoryMiB: '1024',
            networkMode: NetworkMode.AWS_VPC,
            family: `${projectName}-definition`,
        });

        taskDefinition.applyRemovalPolicy(RemovalPolicy.DESTROY)

        //Create fargate service and security group
        const ecsServiceSecurityGroup = new SecurityGroup(this, 'EcsServiceSecurityGroup', {
            vpc: vpc,
            securityGroupName: 'ecs-service-security-group',
        });

        ecsServiceSecurityGroup.addIngressRule(Peer.ipv4('10.0.0.0/24'), Port.tcp(80));
        ecsServiceSecurityGroup.addIngressRule(Peer.ipv4('10.0.1.0/24'), Port.tcp(80));
        ecsServiceSecurityGroup.addIngressRule(Peer.ipv4('10.0.0.0/24'), Port.tcp(443));
        ecsServiceSecurityGroup.addIngressRule(Peer.ipv4('10.0.1.0/24'), Port.tcp(443));

        taskDefinition.addContainer(`${RestApiContainer.ecrRepositoryName}-container`, {
            image: ContainerImage.fromEcrRepository(Repository.fromRepositoryName(this, `${RestApiContainer.ecrRepositoryName}-repository`, RestApiContainer.ecrRepositoryName)),
            cpu: RestApiContainer.cpu,
            memoryLimitMiB: RestApiContainer.memoryLimitMiB,
            containerName: RestApiContainer.ecrRepositoryName,
            memoryReservationMiB: 128,
            portMappings: [{
                containerPort: RestApiContainer.port,
                hostPort: RestApiContainer.port,
                protocol: Protocol.TCP
            }],
        })

        //Create fargate service
        this.ecsFargateService = new FargateService(this, 'RestApiFargateService', {
            cluster: ecsCluster,
            taskDefinition: taskDefinition,
            assignPublicIp: false,
            desiredCount: 2,
            serviceName: `${projectName}-restapi-service`,
            securityGroups: [ecsServiceSecurityGroup],
        });

        //Define fargate targets
        const restapiTarget = this.ecsFargateService.loadBalancerTarget({
            containerName: RestApiContainer.ecrRepositoryName,
            containerPort: RestApiContainer.port,
            protocol: Protocol.TCP,
        })

        //Define target groups
        const restApiTargetGroup = new ApplicationTargetGroup(this, `${projectName}-TargetGroup`, {
            vpc: vpc,
            port: RestApiContainer.port,
            protocol: ApplicationProtocol.HTTP,
            targetType: TargetType.IP,
            targets: [restapiTarget],
            healthCheck: {
                healthyHttpCodes: '200,302',
                port: '80',
                interval: Duration.seconds(300)
            },
            deregistrationDelay: Duration.seconds(300),
            targetGroupName: `${projectName}-targetGroup`,
            stickinessCookieDuration: Duration.minutes(60),
            loadBalancingAlgorithmType: TargetGroupLoadBalancingAlgorithmType.ROUND_ROBIN,
            stickinessCookieName: 'sticky-cookie',
        })

        const httpListener = alb.addListener('HttpListener', {
            port: 80,
            defaultAction: ListenerAction.fixedResponse(200, {
                messageBody: 'Health check port'
            })
        })

        const albCertificate = new Certificate(this, 'RestApiCertificate', {
            domainName: 'alb.techkronik.com',
            validation: CertificateValidation.fromDns(hostedZone)

        })

        const httpsListener = alb.addListener('HttpsListener', {
            port: 443,
            certificates: [albCertificate],
            defaultTargetGroups: [restApiTargetGroup]
            // defaultAction: new AuthenticateCognitoAction({
            //     userPool: userPool,
            //     userPoolClient: userPoolClient,
            //     userPoolDomain: userPoolDomain,
            //     next: ListenerAction.fixedResponse(200, {
            //         contentType: 'text/plain',
            //         messageBody: 'Authenticated Moffo'
            //     }),
            //     onUnauthenticatedRequest: UnauthenticatedAction.DENY
            // }),
        })



    }
}