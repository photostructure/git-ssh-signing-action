import { parseSSHKeyInfoOutput, SSHKeyInfo } from "../src/ssh";

describe("parseSSHKeyInfoOutput", () => {
  it("parses a standard ssh-keygen output line", () => {
    const output = "2048 SHA256:abcdefg1234567 test@example.com (RSA)";
    const info: SSHKeyInfo = parseSSHKeyInfoOutput(output);
    expect(info).toEqual({
      bits: 2048,
      fingerprint: "SHA256:abcdefg1234567",
      comment: "test@example.com",
      type: "RSA",
    });
  });

  it("parses output with no comment", () => {
    const output = "4096 SHA256:xyz987654321  (ED25519)";
    const info: SSHKeyInfo = parseSSHKeyInfoOutput(output);
    expect(info).toEqual({
      bits: 4096,
      fingerprint: "SHA256:xyz987654321",
      comment: undefined,
      type: "ED25519",
    });
  });

  it("throws on invalid output", () => {
    expect(() => parseSSHKeyInfoOutput("invalid output")).toThrow(
      /Failed to parse SSH key info/,
    );
  });
});
