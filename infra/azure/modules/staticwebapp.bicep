/**
 * Azure Static Web App Module
 *
 * Static site hosting that replaces Netlify.
 * Hosts the Docusaurus documentation site.
 */

@description('Static Web App name')
param name string

@description('Azure region')
param location string

@description('Resource tags')
param tags object = {}

@description('SKU tier')
@allowed(['Free', 'Standard'])
param sku string = 'Free'

@description('GitHub repository URL')
param repositoryUrl string

@description('Branch to deploy from')
param branch string = 'main'

@description('App location in repo')
param appLocation string = 'apps/docs'

@description('API location in repo (empty if using separate Functions)')
param apiLocation string = ''

@description('Build output location')
param outputLocation string = 'build'

resource staticWebApp 'Microsoft.Web/staticSites@2023-01-01' = {
  name: name
  location: location
  tags: tags
  sku: {
    name: sku
    tier: sku
  }
  properties: {
    repositoryUrl: repositoryUrl
    branch: branch
    buildProperties: {
      appLocation: appLocation
      apiLocation: apiLocation
      outputLocation: outputLocation
      appBuildCommand: 'pnpm run build'
    }
    stagingEnvironmentPolicy: 'Enabled'
    allowConfigFileUpdates: true
  }
}

// Custom domain configuration (add your domain here)
// resource customDomain 'Microsoft.Web/staticSites/customDomains@2023-01-01' = {
//   parent: staticWebApp
//   name: 'docs.phoenixrooivalk.com'
//   properties: {}
// }

@description('Static Web App name')
output name string = staticWebApp.name

@description('Static Web App ID')
output id string = staticWebApp.id

@description('Static Web App URL')
output url string = 'https://${staticWebApp.properties.defaultHostname}'

@description('Static Web App default hostname')
output defaultHostname string = staticWebApp.properties.defaultHostname

@description('Deployment token (use for GitHub Actions)')
output deploymentToken string = staticWebApp.listSecrets().properties.apiKey
