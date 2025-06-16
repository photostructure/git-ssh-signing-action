/**
 * Test SSH keys for unit and integration tests
 */

// Valid ED25519 private key for testing (generated for tests only)
export const TEST_ED25519_PRIVATE_KEY = `-----BEGIN OPENSSH PRIVATE KEY-----
b3BlbnNzaC1rZXktdjEAAAAABG5vbmUAAAAEbm9uZQAAAAAAAAABAAAAMwAAAAtzc2gtZW
QyNTUxOQAAACCM/oWAB886VCzfCTrO/BZIAkBH52d8bvoBTX+9hM7KvQAAAJiVBTDblQUw
2wAAAAtzc2gtZWQyNTUxOQAAACCM/oWAB886VCzfCTrO/BZIAkBH52d8bvoBTX+9hM7KvQ
AAAEA77m4MQSolAz2ubUSpolmoPMbvAixRVwM86PNEZ58tE4z+hYAHzzpULN8JOs78FkgC
QEfnZ3xu+gFNf72Ezsq9AAAAEHRlc3RAZXhhbXBsZS5jb20BAgMEBQ==
-----END OPENSSH PRIVATE KEY-----`;

// Corresponding public key
export const TEST_ED25519_PUBLIC_KEY = `ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIIz+hYAHzzpULN8JOs78FkgCQEfnZ3xu+gFNf72Ezsq9 test@example.com`;

// Expected fingerprint for the test key
export const TEST_ED25519_FINGERPRINT =
  "SHA256:G5jpKq6wXcM6YJOAljB6+iwRoXdr9zKxGzpgQxbCvvA";

// Invalid private key for error testing
export const INVALID_PRIVATE_KEY = "not-a-valid-ssh-key";

// Expected SSH key info output format from ssh-keygen -l
export const TEST_ED25519_KEY_INFO_OUTPUT = `256 SHA256:G5jpKq6wXcM6YJOAljB6+iwRoXdr9zKxGzpgQxbCvvA test@example.com (ED25519)`;
