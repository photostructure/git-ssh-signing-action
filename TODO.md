# TODO: SSH Signing Action - Pre-Release Tasks

This document outlines tasks and improvements needed before publishing to GitHub Marketplace.

## 🔴 Critical (Must Complete Before v1.0.0)

### 1. Versioning and Release Preparation

- [x] Update package.json version from "0.0.0" to "0.1.0"
- [ ] Create comprehensive release notes for v0.1.0
- [x] Set up release workflow using the script in `script/release`
- [ ] Test the release process in a fork first

### 2. Action Name Uniqueness

- [x] Verify "Git SSH Signing Action" is unique in GitHub Marketplace
- [ ] Consider a more distinctive name if needed (e.g., "SSH Commit Signing Action" or "Git SSH Sign")
- [ ] Update action.yml name field if changed

### 3. Security Audit

- [x] Run `npm audit` and fix any vulnerabilities
- [x] Enable GitHub security features:
  - [x] Dependabot alerts
  - [x] Code scanning (CodeQL)
  - [ ] Secret scanning
- [x] Add security policy (SECURITY.md)

### 4. Documentation Enhancements

- [x] Add badges to README:
  - [x] Marketplace version badge
  - [x] License badge
  - [x] Test status badge
- [x] Create detailed CHANGELOG.md
- [ ] Add more real-world usage examples to README
- [ ] Document migration from GPG signing to SSH signing

## 🟡 Important (Should Complete Soon)

### 5. Testing Improvements

- [ ] Add end-to-end tests that actually create signed commits
- [ ] Test with different Git versions (document minimum required version)
- [ ] Test on all supported runners (ubuntu, macos, windows)
- [ ] Add test for verifying signatures with allowed_signers file
- [ ] Create example workflow in `.github/workflows/example-usage.yml`

### 6. Error Message Improvements

- [ ] Add more descriptive error messages for common issues:
  - [ ] Invalid SSH key format
  - [ ] Missing Git installation
  - [ ] Insufficient permissions
- [ ] Add links to troubleshooting in error messages

### 7. Platform Support

- [ ] Test and document Windows support (or explicitly note if unsupported)
- [ ] Test and document macOS support
- [ ] Add platform-specific handling if needed

### 8. Performance Optimization

- [ ] Consider caching SSH agent for multiple signing operations
- [ ] Optimize bundle size (current: ~1MB)
- [ ] Add performance benchmarks

## 🟢 Nice to Have (Post-v1.0.0)

### 9. Enhanced Features

- [ ] Support for multiple SSH keys
- [ ] Support for SSH certificates
- [ ] Option to verify existing signatures
- [ ] Integration with GitHub's SSH key API
- [ ] Support for custom SSH agent socket path

### 10. Developer Experience

- [ ] Create GitHub Action template for quick setup
- [ ] Add VS Code snippets for common usage patterns
- [ ] Create video tutorial for setup
- [ ] Add FAQ section to documentation

### 11. Monitoring and Analytics

- [ ] Add telemetry (opt-in) to understand usage patterns
- [ ] Create dashboard for action health metrics
- [ ] Set up automated compatibility testing

### 12. Community Building

- [ ] Create discussion forum/category
- [ ] Add CODE_OF_CONDUCT.md
- [ ] Set up issue templates
- [ ] Create pull request template

## 📋 Pre-Release Checklist

Before creating the first release:

1. [ ] All critical tasks completed
2. [x] All tests passing with >90% coverage (92.53%)
3. [ ] Documentation reviewed and complete
4. [x] Security audit passed
5. [ ] Bundle size optimized
6. [ ] Example workflows tested
7. [ ] Release notes prepared
8. [ ] Marketplace listing preview reviewed

## 🚀 Release Process

1. Complete all critical tasks
2. Update version in package.json
3. Run `npm run all` to ensure everything passes
4. Commit all changes
5. Run `script/release` to create tags
6. Create GitHub release with detailed notes
7. Publish to GitHub Marketplace
8. Announce in relevant communities

## 📝 Notes for Contributors

- Each task should be completed with appropriate tests
- Update documentation as features are added
- Follow the coding standards in CONTRIBUTING.md
- Ensure backward compatibility for v1.x releases

## 🔗 Useful Resources

- [Creating a JavaScript Action](https://docs.github.com/en/actions/creating-actions/creating-a-javascript-action)
- [Publishing to Marketplace](https://docs.github.com/en/actions/creating-actions/publishing-actions-in-github-marketplace)
- [Action Metadata Syntax](https://docs.github.com/en/actions/creating-actions/metadata-syntax-for-github-actions)
- [Security Best Practices](https://docs.github.com/en/actions/security-guides/security-hardening-for-github-actions)
