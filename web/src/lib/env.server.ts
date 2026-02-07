import { env } from '$env/dynamic/private';

export function getServerUrl() {
    return env.ACESTEP_SERVER_URL || 'http://localhost:8001';
}