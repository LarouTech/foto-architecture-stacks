import { RemovalPolicy, Stack } from "aws-cdk-lib";
import { BuildSpec, LinuxBuildImage, Project, Source } from "aws-cdk-lib/aws-codebuild";
import { Artifact, Pipeline } from "aws-cdk-lib/aws-codepipeline";
import { CodeBuildAction, CodeStarConnectionsSourceAction, S3DeployAction } from "aws-cdk-lib/aws-codepipeline-actions";
import { Bucket } from "aws-cdk-lib/aws-s3";
import { Secret } from "aws-cdk-lib/aws-secretsmanager";
import { Construct } from "constructs";
import { CloudfrontFrontendProps } from "./interfaces/cloudfront-frontend-props";

interface CustomProps extends CloudfrontFrontendProps {}

export class CodePipelineFrontendStack extends Stack {

  constructor(scope: Construct, id: string, props: CustomProps) {
    super(scope, id, props);

    const { staticWebsiteBucket } = props;
    const projectName = process.env.PROJECT_NAME

    //Get codetar connection arn from secret manager
    const secret = Secret.fromSecretNameV2(this, 'GithubCodestarSecret', process.env.CODESTAR_SECRET_NAME!)
      .secretValueFromJson(process.env.CODESTAR_SECRET_KEY!).toString()

    //Define pipeline
    const pipeline = new Pipeline(this, `${projectName}-Frontend-Pipeline`, {
      pipelineName: `${projectName}-frontend-${process.env.STAGE_ENV}`,
      restartExecutionOnUpdate: true,
      artifactBucket: new Bucket(this, `${projectName}-${process.env.STAGE_ENV}`, {
        removalPolicy: RemovalPolicy.DESTROY,
        bucketName: `codepipeline-${projectName?.toLowerCase()}-${process.env.STAGE_ENV}`,
        autoDeleteObjects: true
      }),
    });

    //Define Source (Github)
    const sourceOutput = new Artifact('source');

    const sourceAction = new CodeStarConnectionsSourceAction({
      actionName: 'GitHub',
      owner: `${process.env.GITHUB_USERNAME}`,
      repo: `${process.env.REPOSITORY_NAME}`,
      output: sourceOutput,
      branch: `${process.env.REPOSITORY_BRANCH}`,
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
      }
    });

    const codebuildProject = new Project(this, `${projectName}-build-project`, {
      buildSpec: BuildSpec.fromSourceFilename('buildspec.yml'),
      source: Source.gitHub({
        owner: `${process.env.REPOSITORY_OWNER}`,
        repo: `${process.env.REPOSITORY_NAME}`,
      }),
      environment: {
        buildImage: LinuxBuildImage.STANDARD_5_0
      }
    })

    const buildOutput = new Artifact(`${projectName}-build`);

    const buildAction = new CodeBuildAction({
      actionName: 'Build',
      input: sourceOutput,
      project: codebuildProject,
      outputs: [buildOutput]
    });

    buildStage.addAction(buildAction);


    //Define deploy to s3
    const deployAction = new S3DeployAction({
      actionName: 'deploy-website',
      bucket: staticWebsiteBucket,
      input: buildOutput,
      extract: true,
    })

    const deployStage = pipeline.addStage({
      stageName: `${projectName}-Deploy`,
      actions: [deployAction],
    });

  }
}