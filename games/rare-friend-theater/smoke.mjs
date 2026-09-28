import assert from "node:assert/strict";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { testGame } from "../../scripts/testing.mjs";

for (const width of [960, 390]) {
  await testGame("games/rare-friend-theater", { width, height: width < 500 ? 844 : 800,
    screenshot: join(tmpdir(), `rare-friend-theater-${width}.png`),
    check: async ({ page, game }) => {
      await game.getByRole("heading", { name: "The star has vanished" }).waitFor();
      await game.getByRole("button", { name: /Moon lantern/ }).click();
      await game.getByText("6 RF PREVIEW").waitFor();
      for (const [choice, next] of [
        ["Follow the stardust", "Next act"],
        ["Tell a ridiculous joke", "Next act"],
        ["Dance together", "See the ending"],
      ]) {
        await game.getByRole("button", { name: new RegExp(choice) }).click();
        await game.getByRole("button", { name: new RegExp(next) }).click();
      }
      await game.getByRole("heading", { name: "A star is born." }).waitFor();
      await game.getByRole("button", { name: /View your comic/ }).click();
      const image = game.getByRole("img", { name: /Three-panel comic/ });
      await image.waitFor();
      assert((await image.getAttribute("src"))?.startsWith("data:image/png;base64,"), "The comic image must render in the sandbox");
    },
  });
}
