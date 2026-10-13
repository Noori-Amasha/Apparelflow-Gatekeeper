import "@testing-library/jest-dom/vitest";

import { beforeEach, afterEach } from "vitest";
import { cleanup } from "@testing-library/react";

beforeEach(() => {
  cleanup();
});

afterEach(() => {
  cleanup();
});
