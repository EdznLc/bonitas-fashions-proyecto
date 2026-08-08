import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const services = [
    { name: 'Auth Service', script: path.join(__dirname, 'services', 'auth-service', 'server.js'), port: 5001 },
    { name: 'Productos Service', script: path.join(__dirname, 'services', 'productos-service', 'server.js'), port: 5002 },
    { name: 'Apartados Service', script: path.join(__dirname, 'services', 'apartados-service', 'server.js'), port: 5003 },
    { name: 'Encuestas Service', script: path.join(__dirname, 'services', 'encuestas-service', 'server.js'), port: 5004 },
];

console.log('🚀 Arrancando arquitectura de Microservicios Independientes (SOA)...\n');

services.forEach(service => {
    const child = spawn('node', [service.script], {
        stdio: 'inherit',
        env: { ...process.env, PORT: service.port }
    });

    child.on('error', (err) => {
        console.error(`❌ Error al iniciar ${service.name}:`, err);
    });
});
