#!/usr/bin/env ts-node
import { loadOpenAPI, validateFullOpenAPISpec } from './openapi/loader.js';
import { processOpenAPISpec } from './openapi/processor.js';
import path from 'path';
async function testOpenAPIProcessing(filePath) {
    try {
        console.log('\n=== Testing OpenAPI Processing ===');
        console.log(`Loading spec from: ${filePath}`);
        // Test loading
        console.log('\n1. Loading spec...');
        const spec = await loadOpenAPI(filePath);
        console.log('✅ Successfully loaded spec');
        console.log(`   - Title: ${spec.info.title}`);
        console.log(`   - Version: ${spec.info.version}`);
        // Test validation
        console.log('\n2. Validating spec...');
        try {
            validateFullOpenAPISpec(spec);
            console.log('✅ Spec is valid');
        }
        catch (error) {
            console.warn('⚠️ Validation warnings:');
            console.warn(error.message);
        }
        // Test processing
        console.log('\n3. Processing endpoints...');
        const endpoints = processOpenAPISpec(spec);
        console.log(`✅ Processed ${endpoints.length} endpoints`);
        // Show sample endpoint
        if (endpoints.length > 0) {
            console.log('\nSample endpoint:');
            const sample = endpoints[0];
            console.log(`- ${sample.method} ${sample.path}`);
            if (sample.summary)
                console.log(`  ${sample.summary}`);
            if (sample.parameters.length > 0) {
                console.log('  Parameters:');
                sample.parameters.forEach(param => {
                    console.log(`  - ${param.name} (${param.in})`);
                });
            }
            console.log('\nNLP Text:');
            console.log(sample.nlpText.substring(0, 200) + '...');
        }
    }
    catch (error) {
        console.error('❌ Error:');
        console.error(error.message);
        process.exit(1);
    }
}
// Get file path from command line or use the example
const filePath = process.argv[2] || path.join(process.cwd(), 'examples/petstore.yaml');
testOpenAPIProcessing(filePath);
