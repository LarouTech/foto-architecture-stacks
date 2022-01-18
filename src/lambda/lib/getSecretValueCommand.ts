
import { SecretsManagerClient, GetSecretValueCommand } from '@aws-sdk/client-secrets-manager'
import { fromEnv } from '@aws-sdk/credential-provider-env'

interface EventDto {
  projectName: string,
  region: string,
  stage: string
}

export async function main(event: any): Promise<string | unknown> {
  const client = new SecretsManagerClient({
    credentials: fromEnv(),
    region: event.region
  });

  const command = new GetSecretValueCommand({
    SecretId: `${event.projectName}-${event.stage}-secret`
  });

  try {
    const response = await client.send(command);
    return JSON.parse(response.SecretString!);
  } catch (error) {
    console.log(error);
    return error;
  }
}
