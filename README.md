# ArielleJS

ArielleJS is a powerful CLI tool that helps you understand and work with OpenAPI specifications using natural language processing.

## Features

- Parse OpenAPI specifications
- Interactive command-line interface
- Natural language processing for API documentation
- Vector-based search for API endpoints
- Multi-intent query processing
- Support for various LLM providers (Gemini, more coming soon!)

## Installation

```bash
# Install globally
npm install -g arielle-js

# Or use with npx
npx arielle-js
```

## Quick Start

1. Start ArielleJS:
   ```bash
   arielle start
   ```

2. Choose your preferred LLM provider (currently Gemini is the most tested option)

3. Enter your LLM API key when prompted

4. Provide the path to your OpenAPI specification file (YAML format)

5. Wait for the OpenAPI spec to be processed and inserted into the local ChromaDB database

6. Start asking questions about your API in natural language!

## Example Usage with Stripe API

Here are some examples of how you can interact with the Stripe API using Arielle:

### Basic Queries
```
How do I create a new customer?
What are the available payment methods?
Show me how to process a refund.
```

### Complex Workflows
```
How do I create a subscription with a trial period?
What's the process for handling a disputed charge?
Show me how to set up a webhook for payment failures.
```

### Multi-Intent Queries
```
How do I fetch all customers, then add a one-off charge for each?
List all active subscriptions and then cancel the most expensive one.
```

### Schema Exploration
```
What fields are available when creating a charge?
Show me the schema for the Customer object.
What are the possible values for a payment intent status?
```

## Tips
- Be as specific as possible with your questions
- You can ask follow-up questions based on previous answers
- The system understands context, so you can refer to previous parts of the conversation
- For complex operations, the system will break them down into multiple steps automatically

## Development

### Prerequisites

- Node.js 20+
- npm 9+

### Setup

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Build the project:
   ```bash
   npm run build
   ```
4. Link the package for local development:
   ```bash
   npm link
   ```

### Scripts

- `npm run build` - Compile TypeScript to JavaScript
- `npm run dev` - Run in development mode using ts-node
- `npm run lint` - Run ESLint
- `npm run format` - Format code with Prettier

## License

ISC
