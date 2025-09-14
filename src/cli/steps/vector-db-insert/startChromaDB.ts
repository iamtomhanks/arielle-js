import { exec } from 'child_process';
import { promisify } from 'util';
import { Logger } from '../../../utils/logger.js';
import chalk from 'chalk';

const execAsync = promisify(exec);

interface ChromaDBServerOptions {
  host?: string;
  port?: number;
  path?: string;
  verbose?: boolean;
}

export class ChromaDBServer {
  private static instance: ChromaDBServer;
  private process: any = null;
  private logger: Logger;

  private constructor(private options: ChromaDBServerOptions = {}) {
    this.options = {
      host: 'localhost',
      port: 8000,
      path: './chroma-data',
      verbose: false,
      ...options
    };
    this.logger = Logger.getInstance(!!this.options.verbose);
  }

  public static getInstance(options?: ChromaDBServerOptions): ChromaDBServer {
    if (!ChromaDBServer.instance) {
      ChromaDBServer.instance = new ChromaDBServer(options);
    }
    return ChromaDBServer.instance;
  }

  public async start(): Promise<boolean> {
    if (this.process) {
      this.logger.info(chalk.yellow('ChromaDB server is already running'));
      return true;
    }

    const { host, port, path } = this.options;
    const command = `chroma run --host ${host} --port ${port} --path ${path}`;

    this.logger.info(chalk.blue(`Starting ChromaDB server at http://${host}:${port}...`));
    
    try {
      this.process = exec(command, { 
        cwd: process.cwd(),
        env: { ...process.env, PYTHONUNBUFFERED: '1' }
      });

      // Log output
      this.process.stdout?.on('data', (data: string) => {
        this.logger.debug(chalk.gray(`[ChromaDB] ${data}`));
      });

      this.process.stderr?.on('data', (data: string) => {
        this.logger.error(chalk.red(`[ChromaDB Error] ${data}`));
      });

      // Handle process exit
      this.process.on('close', (code: number) => {
        this.logger.info(chalk.yellow(`ChromaDB server process exited with code ${code}`));
        this.process = null;
      });

      // Give it a moment to start
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Verify server is running
      const isRunning = await this.isServerRunning();
      if (isRunning) {
        this.logger.info(chalk.green('✓ ChromaDB server started successfully'));
        return true;
      } else {
        throw new Error('Failed to start ChromaDB server');
      }
    } catch (error) {
      this.logger.error(chalk.red('Failed to start ChromaDB server:'));
      if (error instanceof Error) {
        this.logger.error(chalk.red(`- ${error.message}`));
      }
      this.process = null;
      return false;
    }
  }

  public async stop(): Promise<void> {
    if (!this.process) {
      this.logger.info(chalk.yellow('ChromaDB server is not running'));
      return;
    }

    this.logger.info(chalk.blue('Stopping ChromaDB server...'));
    this.process.kill();
    this.process = null;
    this.logger.info(chalk.green('✓ ChromaDB server stopped'));
  }

  public async isServerRunning(): Promise<boolean> {
    try {
      const { stdout } = await execAsync(`lsof -i :${this.options.port}`);
      return stdout.includes('LISTEN');
    } catch {
      return false;
    }
  }

  public getConnectionString(): string {
    return `http://${this.options.host}:${this.options.port}`;
  }
}

// Helper function for direct usage
export async function ensureChromaDBServer(options?: ChromaDBServerOptions): Promise<boolean> {
  const server = ChromaDBServer.getInstance(options);
  const isRunning = await server.isServerRunning();
  
  if (!isRunning) {
    return server.start();
  }
  
  return true;
}
