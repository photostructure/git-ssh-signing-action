# Security Policy

## Supported Versions

This project is currently in pre-release. Once v1.0.0 is released, we will support:

| Version | Supported          |
| ------- | ------------------ |
| 1.x.x   | :white_check_mark: |
| < 1.0   | :x:                |

## Reporting a Vulnerability

We take the security of this GitHub Action seriously. If you believe you have found a security vulnerability, please report it to us as described below.

**Please do not report security vulnerabilities through public GitHub issues.**

Instead, please report them by:

1. **Email**: Send an email to the repository maintainers (check the repository's contributors page)
2. **GitHub Security Advisories**: Use GitHub's [private vulnerability reporting](https://docs.github.com/en/code-security/security-advisories/guidance-on-reporting-and-writing/privately-reporting-a-security-vulnerability) feature

Please include the following information:

- Type of issue (e.g., key exposure, privilege escalation, etc.)
- Full paths of source file(s) related to the issue
- Location of the affected source code (tag/branch/commit or direct URL)
- Any special configuration required to reproduce the issue
- Step-by-step instructions to reproduce the issue
- Proof-of-concept or exploit code (if possible)
- Impact of the issue, including how an attacker might exploit it

## Response Timeline

- **Initial Response**: Within 48 hours
- **Impact Assessment**: Within 1 week
- **Patch Release**: Critical issues within 1 week, others within 2 weeks

## Security Best Practices

When using this action:

1. **Never commit SSH private keys to your repository**
2. **Always use GitHub Secrets for sensitive data**
3. **Rotate SSH keys regularly**
4. **Use the most specific permissions possible**
5. **Review the action's code before using it**

## Security Features

This action includes several security features:

- Automatic cleanup of SSH keys after use
- Secure file permissions (0600) for private keys
- No logging of sensitive information
- Support for GitHub's security features (Dependabot, CodeQL)

## Dependencies

We regularly update dependencies to patch known vulnerabilities. You can check the current status by running:

```bash
npm audit
```

## Acknowledgments

We appreciate responsible disclosure of security vulnerabilities. Contributors who report valid security issues will be acknowledged in our release notes (unless they prefer to remain anonymous).
