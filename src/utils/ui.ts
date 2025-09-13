import chalk from 'chalk';
import boxen from 'boxen';
import gradient from 'gradient-string';
import { type Options as BoxenOptions } from 'boxen';

const BANNER_TEXT = `
 █████╗ ██████╗ ██╗███████╗██╗     ███████╗██╗     
██╔══██╗██╔══██╗██║██╔════╝██║     ██╔════╝██║     
███████║██████╔╝██║█████╗  ██║     █████╗  ██║     
██╔══██║██╔══██╗██║██╔══╝  ██║     ██╔══╝  ██║     
██║  ██║██║  ██║██║███████╗███████╗███████╗███████╗
╚═╝  ╚═╝╚═╝  ╚═╝╚═╝╚══════╝╚══════╝╚══════╝╚══════╝
`;

const BOXEN_OPTS: BoxenOptions = {
  padding: 1,
  margin: 1,
  borderStyle: 'round',
  borderColor: '#00ffff',
  backgroundColor: '#1a1a1a',
  textAlignment: 'center',
};

export class UI {
  static showBanner() {
    try {
      const gradientBanner = gradient('#00ffff', '#ff00ff')(BANNER_TEXT);
      const bannerBox = boxen(gradientBanner, {
        ...BOXEN_OPTS,
        title: 'OpenAPI Companion',
        titleAlignment: 'center',
      });
      
      // Clear the console first
      process.stdout.write('\x1Bc');
      // Then write the banner
      process.stdout.write('\n' + bannerBox + '\n\n');
    } catch (error) {
      // Fallback to a simpler banner if there's an error
      console.log('\n' + chalk.cyan.bold('ARIELLE JS - OpenAPI Companion') + '\n');
    }
  }

  static section(title: string) {
    console.log('\n' + chalk.cyan.bold(`› ${title.toUpperCase()}`) + '\n');
  }

  static success(message: string) {
    console.log(chalk.green('✓') + ' ' + message);
  }

  static error(message: string) {
    console.error(chalk.red('✗') + ' ' + message);
  }

  static warning(message: string) {
    console.warn(chalk.yellow('!') + ' ' + message);
  }

  static info(message: string) {
    console.log(chalk.blue('i') + ' ' + message);
  }

  static divider() {
    const width = process.stdout.columns || 80;
    console.log(chalk.dim('─'.repeat(width)));
  }

  static box(content: string, title?: string) {
    const boxedContent = boxen(content, {
      ...BOXEN_OPTS,
      title,
      padding: 1,
      margin: 1,
      borderStyle: 'single',
      borderColor: '#6e5494',
      backgroundColor: '#1a1a1a',
    });
    console.log(boxedContent);
  }

  static table(rows: string[][], headers?: string[]) {
    if (headers) {
      const headerRow = headers.map(h => chalk.cyan.bold(h));
      rows = [headerRow, ...rows];
    }
    
    // Calculate column widths
    const colWidths = rows[0].map((_, colIndex) => 
      Math.max(...rows.map(row => row[colIndex]?.length || 0))
    );
    
    // Print rows
    rows.forEach((row, rowIndex) => {
      const isHeader = headers && rowIndex === 0;
      const paddedRow = row.map((cell, colIndex) => {
        const padding = ' '.repeat(colWidths[colIndex] - (cell?.length || 0));
        return (cell || '') + padding;
      });
      
      const rowStr = paddedRow.join('  ');
      console.log(isHeader ? chalk.cyan(rowStr) : rowStr);
      
      if (isHeader) {
        const divider = colWidths.map(w => '─'.repeat(w)).join('┼');
        console.log(chalk.dim(divider));
      }
    });
  }
}
