import chalk from 'chalk';
import boxen from 'boxen';
import gradient from 'gradient-string';
const BANNER_TEXT = `
 █████╗ ██████╗ ██╗███████╗██╗     ███████╗██╗     
██╔══██╗██╔══██╗██║██╔════╝██║     ██╔════╝██║     
███████║██████╔╝██║█████╗  ██║     █████╗  ██║     
██╔══██║██╔══██╗██║██╔══╝  ██║     ██╔══╝  ██║     
██║  ██║██║  ██║██║███████╗███████╗███████╗███████╗
╚═╝  ╚═╝╚═╝  ╚═╝╚═╝╚══════╝╚══════╝╚══════╝╚══════╝
`;
const BOXEN_OPTS = {
    padding: 1,
    margin: 1,
    borderStyle: 'round',
    borderColor: '#00ffff',
    backgroundColor: '#1a1a1a',
    textAlignment: 'center',
};
export class UI {
    static showBanner() {
        const gradientBanner = gradient('#00ffff', '#ff00ff')(BANNER_TEXT);
        const bannerBox = boxen(gradientBanner, {
            ...BOXEN_OPTS,
            title: 'OpenAPI Companion',
            titleAlignment: 'center',
        });
        console.clear();
        console.log('\n' + bannerBox + '\n');
    }
    static section(title) {
        console.log('\n' + chalk.cyan.bold(`› ${title.toUpperCase()}`) + '\n');
    }
    static success(message) {
        console.log(chalk.green('✓') + ' ' + message);
    }
    static error(message) {
        console.error(chalk.red('✗') + ' ' + message);
    }
    static warning(message) {
        console.warn(chalk.yellow('!') + ' ' + message);
    }
    static info(message) {
        console.log(chalk.blue('i') + ' ' + message);
    }
    static divider() {
        const width = process.stdout.columns || 80;
        console.log(chalk.dim('─'.repeat(width)));
    }
    static box(content, title) {
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
    static table(rows, headers) {
        if (headers) {
            const headerRow = headers.map(h => chalk.cyan.bold(h));
            rows = [headerRow, ...rows];
        }
        // Calculate column widths
        const colWidths = rows[0].map((_, colIndex) => Math.max(...rows.map(row => row[colIndex]?.length || 0)));
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
