# GitHub Actions Best Practices Guide

This guide provides comprehensive best practices for GitHub Actions workflows, with a focus on security, attestation, and hardening based on GitHub's official documentation.

## Table of Contents

1. [Security Hardening](#security-hardening)
2. [Secrets Management](#secrets-management)
3. [Preventing Script Injection](#preventing-script-injection)
4. [Third-Party Actions Security](#third-party-actions-security)
5. [Token and Permission Management](#token-and-permission-management)
6. [Artifact Attestations](#artifact-attestations)
7. [Workflow Design Best Practices](#workflow-design-best-practices)
8. [Development Guidelines](#development-guidelines)

## Security Hardening

### Core Principles

- **Least Privilege**: Always use the minimum required permissions
- **Defense in Depth**: Implement multiple layers of security
- **Zero Trust**: Treat all inputs as potentially untrusted

### Key Security Measures

1. **Enable GitHub Security Features**

   - Enable Dependabot for dependency updates
   - Use code scanning with CodeQL
   - Enable secret scanning
   - Configure security policies

2. **Monitor and Audit**

   - Review audit logs regularly
   - Use CODEOWNERS to monitor workflow changes
   - Track workflow modifications in protected branches

3. **OpenSSF Scorecard**
   - Use OpenSSF Scorecards to assess security posture
   - Address identified vulnerabilities systematically

## Secrets Management

### Best Practices

1. **Never use structured data as a secret**

   - Avoid JSON, XML, or similar formats in secrets
   - Use individual secret values instead

2. **Secret Registration and Handling**

   ```yaml
   # Good: Use registered secrets
   env:
     API_KEY: ${{ secrets.API_KEY }}

   # Bad: Hardcoded values
   env:
     API_KEY: "sk-1234567890abcdef"
   ```

3. **Rotation and Scope**

   - Rotate secrets periodically
   - Use credentials with minimal required scope
   - Implement expiration dates where possible

4. **Audit Secret Usage**
   - Review which workflows access which secrets
   - Remove unused secrets promptly
   - Document secret purposes and owners

## Preventing Script Injection

### Critical: Avoid Untrusted Input in Scripts

```yaml
# DANGEROUS - Script injection vulnerability
- run: |
    echo "Issue title: ${{ github.event.issue.title }}"

# SAFE - Using intermediate environment variable
- name: Safe echo
  env:
    ISSUE_TITLE: ${{ github.event.issue.title }}
  run: |
    echo "Issue title: ${ISSUE_TITLE}"
```

### Recommended Approaches

1. **Use Actions Instead of Inline Scripts**

   - Create JavaScript actions for complex logic
   - Validate and sanitize inputs within actions

2. **Environment Variable Pattern**
   ```yaml
   - name: Process user input safely
     env:
       USER_INPUT: ${{ github.event.comment.body }}
     run: |
       # Now USER_INPUT is safe to use
       processed=$(echo "${USER_INPUT}" | sed 's/[^a-zA-Z0-9]//g')
   ```

## Third-Party Actions Security

### Action Pinning Strategy

```yaml
# BEST: Pin to full commit SHA
- uses: actions/checkout@8e5e7e5ab8b370d6c329ec480221332ada57f0ab # v3.5.2

# ACCEPTABLE: Use tag from trusted creator
- uses: actions/checkout@v3

# RISKY: Using main/master branch
- uses: someuser/action@main
```

### Verification Process

1. **Audit Source Code**

   - Review action's repository
   - Check for recent security issues
   - Verify maintainer reputation

2. **Use Dependabot**
   ```yaml
   # .github/dependabot.yml
   version: 2
   updates:
     - package-ecosystem: "github-actions"
       directory: "/"
       schedule:
         interval: "weekly"
   ```

## Token and Permission Management

### GITHUB_TOKEN Permissions

```yaml
# Workflow-level permissions (recommended)
permissions:
  contents: read
  issues: write
  pull-requests: write

jobs:
  build:
    runs-on: ubuntu-latest
    # Job-level permissions override workflow-level
    permissions:
      contents: read
    steps:
      - uses: actions/checkout@v3
```

### Security Settings

1. **Repository Settings**

   - Disable "Allow GitHub Actions to create and approve pull requests"
   - Set default permissions to read-only
   - Configure workflow permissions policy

2. **OpenID Connect (OIDC)**
   ```yaml
   # Example: AWS OIDC configuration
   - name: Configure AWS credentials
     uses: aws-actions/configure-aws-credentials@v2
     with:
       role-to-assume: arn:aws:iam::123456789100:role/my-github-actions-role
       aws-region: us-east-1
   ```

## Artifact Attestations

### What Are Attestations?

Artifact attestations provide cryptographically signed claims about your build artifacts, establishing provenance and integrity guarantees for your software supply chain.

### Generating Attestations

```yaml
name: Build with attestation

on:
  push:
    branches: [main]

permissions:
  id-token: write
  contents: read
  attestations: write

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Build artifact
        run: |
          make build

      - name: Generate build provenance
        uses: actions/attest-build-provenance@v1
        with:
          subject-path: "./dist/my-binary"
```

### Verifying Attestations

```bash
# Verify a binary artifact
gh attestation verify ./my-binary --owner myorg

# Verify a container image
gh attestation verify oci://ghcr.io/myorg/myimage:latest --owner myorg
```

### SLSA Compliance Levels

- **Level 2** (Default): Basic provenance with signed attestations
- **Level 3**: Achieved by using reusable workflows with hardened runners

### Best Practices for Attestations

1. **What to Sign**

   - Released software artifacts
   - Container images for production
   - Software Bill of Materials (SBOM)

2. **What NOT to Sign**
   - Development/test builds
   - Individual source files
   - Intermediate build artifacts

## Workflow Design Best Practices

### Reusable Workflows

```yaml
# .github/workflows/reusable-build.yml
name: Reusable Build Workflow

on:
  workflow_call:
    inputs:
      node-version:
        required: true
        type: string

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: ${{ inputs.node-version }}
```

### Caching Dependencies

```yaml
- name: Cache dependencies
  uses: actions/cache@v3
  with:
    path: ~/.npm
    key: ${{ runner.os }}-node-${{ hashFiles('**/package-lock.json') }}
    restore-keys: |
      ${{ runner.os }}-node-
```

### Conditional Execution

```yaml
jobs:
  test:
    if: github.event_name == 'pull_request'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - run: npm test
```

## Development Guidelines

### Action Development Best Practices

1. **Metadata Requirements**

   ```yaml
   # action.yml
   name: "My Custom Action"
   description: "Description of what this action does"
   author: "Your Name or Organization"
   branding:
     icon: "check" # Feather icon name
     color: "green" # white, yellow, blue, green, orange, red, purple, gray-dark
   inputs:
     my-input:
       description: "Input description"
       required: true
       default: "default value"
   outputs:
     my-output:
       description: "Output description"
   runs:
     using: "node20" # Use node20 for latest features
     main: "dist/index.js"
     post: "dist/index.js" # Optional: for cleanup actions
   ```

2. **JavaScript Action Structure**

   - **Bundling**: Include all dependencies in `dist/` folder
   - **Use @actions/core**: For inputs, outputs, and error handling
   - **Post-action cleanup**: Use `post:` in action.yml for cleanup

   ```javascript
   import * as core from "@actions/core";

   export async function run() {
     try {
       const input = core.getInput("my-input", { required: true });
       // Your action logic here
       core.setOutput("my-output", "value");
     } catch (error) {
       core.setFailed(error.message);
     }
   }
   ```

3. **Exit Codes and Error Handling**

   - Always use `core.setFailed()` for errors (sets exit code 1)
   - Use `core.warning()` for non-fatal issues
   - Use `core.info()` and `core.debug()` for logging
   - Never use `process.exit()` directly

   ```javascript
   // Good
   core.setFailed("Operation failed: " + error.message);

   // Bad
   console.error(error);
   process.exit(1);
   ```

4. **Testing**
   - Unit test your actions with mocked @actions/core
   - Integration test in real workflows
   - Test error conditions and edge cases
   - Use GitHub's local-action tool for local testing

### Workflow Templates

Create organization-wide templates in `.github/workflow-templates/`:

```yaml
# ci-template.yml
name: CI Template

on:
  push:
    branches: [$default-branch]
  pull_request:
    branches: [$default-branch]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Run tests
        run: |
          npm ci
          npm test
```

## Publishing Actions to GitHub Marketplace

### Pre-Publishing Checklist

1. **Action Metadata**

   - Unique, descriptive action name
   - Clear, concise description
   - Author field populated
   - Appropriate branding (icon and color)

2. **Documentation**

   - Comprehensive README with:
     - Clear description of what the action does
     - Usage examples for common scenarios
     - Input/output documentation
     - Prerequisites and requirements
     - Troubleshooting section
   - LICENSE file (required)
   - CONTRIBUTING.md (recommended)

3. **Code Quality**

   - All tests passing
   - Proper error handling with clear messages
   - Security best practices followed
   - No hardcoded secrets or sensitive data

4. **Release Process**

   ```bash
   # Tag your release
   git tag -a v1.0.0 -m "Initial release"
   git push origin v1.0.0

   # Also create major version tag for users
   git tag -a v1 -m "v1 release"
   git push origin v1 --force
   ```

### Semantic Versioning for Actions

- **Major (v1, v2)**: Breaking changes
- **Minor (v1.1, v1.2)**: New features, backward compatible
- **Patch (v1.1.1)**: Bug fixes, backward compatible

Users should reference major version tags:

```yaml
uses: yourname/action@v1 # Automatically gets latest v1.x.x
```

### Marketplace Submission

1. Navigate to your repository
2. Click "Releases" → "Draft a new release"
3. Select your version tag
4. Check "Publish this Action to the GitHub Marketplace"
5. Ensure all requirements are met
6. Add release notes
7. Publish release

## Summary

Following these best practices ensures your GitHub Actions workflows are:

1. **Secure**: Protected against common vulnerabilities
2. **Reliable**: Consistent and predictable behavior
3. **Maintainable**: Easy to understand and modify
4. **Compliant**: Meeting security standards and attestation requirements
5. **Publishable**: Ready for GitHub Marketplace distribution

Remember: Security is not a one-time setup but an ongoing practice. Regularly review and update your workflows to maintain security posture.

## References

- [GitHub Actions Security Guides](https://docs.github.com/en/actions/security-guides)
- [Security Hardening for GitHub Actions](https://docs.github.com/en/actions/security-guides/security-hardening-for-github-actions)
- [Artifact Attestations](https://docs.github.com/en/actions/security-guides/using-artifact-attestations-to-establish-provenance-for-builds)
- [GitHub Actions Best Practices](https://docs.github.com/en/actions/guides)
- [Creating a JavaScript Action](https://docs.github.com/en/actions/creating-actions/creating-a-javascript-action)
- [Metadata Syntax for GitHub Actions](https://docs.github.com/en/actions/creating-actions/metadata-syntax-for-github-actions)
- [Setting Exit Codes for Actions](https://docs.github.com/en/actions/creating-actions/setting-exit-codes-for-actions)
- [Publishing Actions in GitHub Marketplace](https://docs.github.com/en/actions/creating-actions/publishing-actions-in-github-marketplace)
