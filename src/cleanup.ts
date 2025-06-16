/**
 * Entry point for the post-action cleanup phase.
 * This file runs the SSH signing cleanup.
 */
/* istanbul ignore file */
import { run } from "./ssh-cleanup.js";
run();
