export interface ContainerProperties {
    ecrRepositoryName: string,
    port: number,
    cpu: number,
    memoryLimitMiB: number
}

export const RestApiContainer: ContainerProperties =
{
    ecrRepositoryName: 'restapi',
    port: 3000,
    cpu: 128,
    memoryLimitMiB: 512
}

