// Test setup and common utilities

// Set a simple PATH to avoid @actions/exec searching through problematic directories
// This prevents errors when looking for executables in non-directory files
process.env.PATH = "/usr/bin:/bin:/usr/local/bin:/usr/sbin:/sbin";

// Set up environment variables for tests
process.env.RUNNER_TEMP = "/tmp";
process.env.GITHUB_WORKSPACE = "/workspace";
process.env.NODE_ENV = "test";
