import inquirer from 'inquirer';
import chalk from 'chalk';
import { UI } from '../../utils/ui.js';

export class InteractionService {
  async promptForSpecPath(): Promise<string> {
    UI.section('OpenAPI Specification');
    UI.info('Please provide the path or URL to your OpenAPI specification file (YAML/JSON)');

    const answers = await inquirer.prompt([
      {
        type: 'input',
        name: 'specPath',
        message: 'Path/URL to OpenAPI spec:',
        prefix: chalk.cyan('?'),
        validate: (input: string) => {
          return input.trim() ? true : 'Please enter a valid path or URL';
        },
      },
    ]);

    return answers.specPath;
  }

  displayAPIInfo(info: {
    title: string;
    version: string;
    description: string;
    endpointCount: number;
  }) {
    UI.section('API Information');
    UI.table([
      ['Title', info.title],
      ['Version', info.version],
      ['Description', info.description],
      ['Endpoints', info.endpointCount.toString()],
    ]);
  }

  displayEndpoints(endpointsByTag: Record<string, any[]>) {
    UI.section('API Endpoints');
    
    for (const [tag, tagEndpoints] of Object.entries(endpointsByTag)) {
      console.log(`\n${chalk.cyan.bold(tag)} (${tagEndpoints.length} endpoints)`);

      tagEndpoints.slice(0, 5).forEach((endpoint) => {
        const method = endpoint.method.toLowerCase();
        let coloredMethod: string;

        switch (method) {
          case 'get': coloredMethod = chalk.green.bold(endpoint.method.padEnd(6)); break;
          case 'post': coloredMethod = chalk.blue.bold(endpoint.method.padEnd(6)); break;
          case 'put': coloredMethod = chalk.yellow.bold(endpoint.method.padEnd(6)); break;
          case 'delete': coloredMethod = chalk.red.bold(endpoint.method.padEnd(6)); break;
          case 'patch': coloredMethod = chalk.magenta.bold(endpoint.method.padEnd(6)); break;
          default: coloredMethod = chalk.white.bold(endpoint.method.padEnd(6));
        }

        console.log(`  ${coloredMethod} ${endpoint.path}`);
        if (endpoint.summary) {
          console.log(`    ${chalk.dim(endpoint.summary)}`);
        }
      });

      if (tagEndpoints.length > 5) {
        console.log(chalk.dim(`  ...and ${tagEndpoints.length - 5} more endpoints`));
      }
    }
  }

  displayCompletionMessage() {
    UI.divider();
    UI.section('Next Steps');
    console.log(chalk.green('✓ ') + 'Your API has been successfully analyzed');
    console.log(chalk.yellow('! ') + 'Vector database integration coming in Phase 3');
    console.log('\n' + chalk.dim('Run with --verbose for detailed logging'));
  }
}

export default InteractionService;
