import { Queue } from 'bullmq';

const [host, port] = (process.env.REDIS_URL || 'localhost:6379')
  .replace('redis://', '')
  .split(':');

export const deploymentQueue = new Queue('deployments', {
  connection: {
    host,
    port: Number(port),
  },
});

export async function pushToQueue(deploymentId: string) {
  await deploymentQueue.add('build', { deploymentId });
}