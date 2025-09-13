export async function loadAndValidateSpec({ specPath, apiService, }) {
    const spec = await apiService.loadAndValidateSpec(specPath);
    return spec;
}
