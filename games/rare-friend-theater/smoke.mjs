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
      await game.getByRole("button", { name: /Light 3 lamps/ }).click();
      await game.getByText("3 preview RF given").waitFor();
      assert.match(await game.locator(".rft-props-head > b").innerText(), /3\s*RF preview/i);
      assert(await game.getByRole("button", { name: /Light 5 lamps/ }).isDisabled(), "Support must not exceed the preview balance");
      await stage.scrollIntoViewIfNeeded();
      await page.locator(".rf-game-frame").screenshot({ path: join(tmpdir(), `rare-friend-theater-reveal-${width}.png`) });
      for (const [act, choice, next] of [
        [0, "Follow the stardust", "Next act"],
        [1, "Tell a ridiculous joke", "Next act"],
        [2, "Hum it softly", "Next act"],
        [3, "Build paper steps", "Next act"],
        [4, "Raise a lantern", "Next act"],
        [5, "Write a new wish", "Next act"],
        [6, "Dance together", "See the ending"],
      ]) {
        if (act === 2) {
          await game.getByText("Play the lost lullaby · 0/3").waitFor();
          for (const note of [{ x: 470, y: 305 }, { x: 555, y: 260 }, { x: 635, y: 205 }]) {
            await stage.scrollIntoViewIfNeeded();
            const noteBox = await stage.boundingBox();
            assert(noteBox);
            await stage.click({ position: { x: noteBox.width * note.x / 800, y: noteBox.height * note.y / 500 } });
          }
        }
        if (act === 3) {
          await game.getByText("Fold the paper bridge · 0/3").waitFor();
          for (const fold of [{ x: 447, y: 336 }, { x: 544, y: 293 }, { x: 638, y: 336 }]) {
            await stage.scrollIntoViewIfNeeded();
            const foldBox = await stage.boundingBox();
            assert(foldBox);
            await stage.click({ position: { x: foldBox.width * fold.x / 800, y: foldBox.height * fold.y / 500 } });
          }
        }
        await game.getByRole("button", { name: new RegExp(choice) }).click();
        await game.getByRole("button", { name: new RegExp(next) }).click();
      }
      await game.getByRole("heading", { name: "The Great Sky Dance" }).waitFor();
      assert.equal(await game.locator(".rft-story-trail li").count(), 7, "Every choice should appear in the story trail");
      await stage.scrollIntoViewIfNeeded();
      await page.locator(".rf-game-frame").screenshot({ path: join(tmpdir(), `rare-friend-theater-finale-${width}.png`) });
      await game.getByRole("button", { name: /View your comic/ }).click();
      const image = game.getByRole("img", { name: /Seven-panel comic/ });
      await image.waitFor();
      assert((await image.getAttribute("src"))?.startsWith("data:image/png;base64,"), "The comic image must render in the sandbox");
      assert((await image.evaluate(element => element.naturalHeight)) > 5400, "The finished comic should include all seven panels");
      await page.locator(".rf-game-frame").screenshot({ path: join(tmpdir(), `rare-friend-theater-comic-${width}.png`) });
      await game.getByRole("button", { name: /Close/ }).click();
      await game.getByRole("button", { name: "Play another version" }).click();
      await game.getByRole("button", { name: "Reveal the clue" }).click();
      await game.getByRole("button", { name: /Follow the stardust/ }).waitFor();
    },
  });
}
