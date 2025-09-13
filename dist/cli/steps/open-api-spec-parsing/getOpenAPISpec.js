export async function getOpenAPISpecPath({ specPath, interactionService, }) {
    // If no spec path was provided, prompt the user for one
    if (!specPath) {
        return await interactionService.promptForSpecPath();
    }
    return specPath;
}
