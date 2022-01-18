import { RemovalPolicy, Stack } from "aws-cdk-lib";
import { BuildSpec, LinuxBuildImage, Project, Source } from "aws-cdk-lib/aws-codebuild";
import { Artifact, Pipeline } from "aws-cdk-lib/aws-codepipeline";
import { CodeBuildAction, CodeStarConnectionsSourceAction, EcsDeployAction } from "aws-cdk-lib/aws-codepipeline-actions";
import { Effect, PolicyStatement } from "aws-cdk-lib/aws-iam";
import { Bucket } from "aws-cdk-lib/aws-s3";
import { Secret } from "aws-cdk-lib/aws-secretsmanager";
import { Construct } from "constructs";
import { EcsFargateProps } from "./interfaces/ecs-fargate-props";

export interface CustomProps extends EcsFargateProps { }

export class CodePipelineRestapiStack extends Stack {
    constructor(scope: Construct, id: string, props: CustomProps) {
        super(scope, id, props);

        const { ecsFargateService } = props;
        const projectName = process.env.PROJECT_NAME

        //Get codetar connection arn from secret manager
        const secret = Secret.fromSecretNameV2(this, 'GithubCodestarSecret', process.env.CODESTAR_SECRET_NAME!)
            .secretValueFromJson(process.env.CODESTAR_SECRET_KEY!).toString()

        //Define pipeline
        const pipeline = new Pipeline(this, `${projectName}-Ecs-Pipeline`, {
            pipelineName: `${projectName}-ecs-${process.env.STAGE_ENV}`,
            restartExecutionOnUpdate: true,
            artifactBucket: new Bucket(this, `${projectName}-${process.env.STAGE_ENV}`, {
                removalPolicy: RemovalPolicy.DESTROY,
                bucketName: `codepipeline-${projectName?.toLowerCase()}-ecs-task-${process.env.STAGE_ENV}`,
                autoDeleteObjects: true
            }),
        });

        //Define Source (Github)
        const sourceOutput = new Artifact('source');

        const sourceAction = new CodeStarConnectionsSourceAction({
            actionName: 'GitHub',
            owner: `${process.env.GITHUB_USERNAME}`,
            repo: `${process.env.REPOSITORY_RESTAPI}`,
            output: sourceOutput,
            branch: 'master' || 'main',
            connectionArn: secret,
        })

        const sourceStage = pipeline.addStage({
            stageName: `${projectName}-Source`,
            actions: [sourceAction]
        });

        //Define build
        const buildStage = pipeline.addStage({
            stageName: `${projectName}-Build`,
            placement: {
                justAfter: sourceStage
            },
        });

        const codebuildProject = new Project(this, `${projectName}-build-project`, {
            buildSpec: BuildSpec.fromSourceFilename('buildspec.yml'),
            projectName: `${projectName}-build-project`,
            source: Source.gitHub({
                owner: `${process.env.GITHUB_USERNAME}`,
                repo: `${process.env.REPOSITORY_RESTAPI}`,
            }),
            environment: {
                buildImage: LinuxBuildImage.STANDARD_5_0,
                privileged: true,
            },
        })

        codebuildProject.addToRolePolicy(new PolicyStatement({
            effect: Effect.ALLOW,
            resources: ['*'],
            actions: [
                'ecr:GetRegistryPolicy',
                'ecr:DescribeRegistry',
                'ecr:GetAuthorizationToken',
                'ecr:DeleteRegistryPolicy',
                'ecr:PutRegistryPolicy',
                'ecr:PutReplicationConfiguration',
            ]
        }))

        const wild = '*';
        codebuildProject.addToRolePolicy(new PolicyStatement({
            effect: Effect.ALLOW,
            actions: ['ecr:*'],
            resources: [`arn:aws:ecr:*:${process.env.AWS_ACCOUNT}:repository/${wild}`]
        }))

        const buildOutput = new Artifact(`${projectName}-build`);

        const buildAction = new CodeBuildAction({
            actionName: 'Build',
            input: sourceOutput,
            project: codebuildProject,
            outputs: [buildOutput],
        });

        buildStage.addAction(buildAction);

        //Deploy Action
        const deployStage = pipeline.addStage({
            stageName: `${projectName}-Deploy`,
            placement: {
                justAfter: buildStage
            },
        });

        const ecsDeployAction = new EcsDeployAction({
            actionName: 'deployEcs',
            service: ecsFargateService!,
            input: Artifact.artifact(buildOutput.artifactName!),
        })

        deployStage.addAction(ecsDeployAction)
    }
}