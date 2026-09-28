import assert from "node:assert/strict";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { testGame } from "../../scripts/testing.mjs";

for (const width of [960, 390]) {
  await testGame("games/rare-friend-theater", { width, height: width < 500 ? 844 : 800,
    screenshot: join(tmpdir(), `rare-friend-theater-${width}.png`),
    check: async ({ page, game }) => {
      await game.getByRole("heading", { name: "The star has vanished" }).waitFor();
      await page.locator(".rf-game-frame").screenshot({ path: join(tmpdir(), `rare-friend-theater-stage-${width}.png`) });
      const stage = game.locator("canvas");
      const box = await stage.boundingBox();
      assert(box, "The stage should be visible");
      await stage.click({ position: { x: box.width * 583 / 800, y: box.height * 210 / 500 } });
      await game.getByRole("button", { name: /Follow the stardust/ }).waitFor();
      await game.getByRole("button", { name: "Sugarplum" }).click();
      assert.equal(await game.getByRole("button", { name: "Sugarplum" }).getAttribute("aria-pressed"), "true");
      await game.getByRole("button", { name: /Moon lantern/ }).click();
      await game.getByText("6 RF PREVIEW").waitFor();
      await stage.scrollIntoViewIfNeeded();
      await page.locator(".rf-game-frame").screenshot({ path: join(tmpdir(), `rare-friend-theater-reveal-${width}.png`) });
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
      await page.locator(".rf-game-frame").screenshot({ path: join(tmpdir(), `rare-friend-theater-comic-${width}.png`) });
      await game.getByRole("button", { name: /Close/ }).click();
      await game.getByRole("button", { name: "Play another version" }).click();
      await game.getByRole("button", { name: "Reveal the clue" }).click();
      await game.getByRole("button", { name: /Follow the stardust/ }).waitFor();
    },
  });
}
