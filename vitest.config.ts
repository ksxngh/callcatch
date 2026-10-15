import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    environment: "node",
    env: {
      MOCK_TWILIO: "true",
      SUPABASE_URL: "http://localhost",
      SUPABASE_SERVICE_ROLE_KEY: "test-key",
    },
  },
  resolve: {
    alias: { "@": path.resolve(__dirname, ".") },
  },
});
