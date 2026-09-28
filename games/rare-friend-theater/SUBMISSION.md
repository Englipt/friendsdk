# Rare Friend Theater

**Builder:** [@Englipt](https://github.com/Englipt)  
**Category:** Character Spotlight

Your verified Generations NFT stars in a three-act interactive story. Its on-chain sprite family gives it a stage role and color, and its original sprite appears in every scene and in a shareable comic.

## Source and playable preview

- Source: https://github.com/Englipt/friendsdk/tree/main/games/rare-friend-theater
- Preview: https://englipt.github.io/friendsdk/
- SDK: FriendSDK v0.1.3

Connect a browser wallet on Robinhood mainnet (chain 4663) holding a hardwired Generations NFT, generation 1 or higher. Select the Friend you want to star in the story. The SDK verifies ownership before play. No RF funding or transaction signature is needed for the preview.

## Play

First, sweep a spotlight across the stage to find the lost star. Aim with mouse or touch and tap the star; keyboard players can use arrows and Enter, and a direct reveal button is available. Then choose one of three actions in each act and continue to the ending. Your choices appear in the stage scene and finished three-panel comic. Open the comic and use the browser's image menu to save it. In the Backstage Prop Box, spend simulated RF on a moon lantern, brass key, or star confetti, then equip one to show on stage and in the comic. A reduced-motion control is provided.

## Economy

The preview begins with 8 simulated RF. Each prop costs 2 simulated RF. Props have no chance outcomes, payouts, resale value, or consumable rules. All balances and props reset when the session reloads. No real RF is spent. A live version would need a new contract action to spend RF from the Friend's canonical wallet and persist prop ownership; FriendSDK v0.1.3 does not provide this action. The SDK's required chance-game definition is unused by the theater.

## Checks and limitations

SDK build, game validation, game typecheck, and automated desktop and mobile browser tests pass. The browser tests run against the SDK's fixture wallet and simulated RPC responses, including its fresh ownership checks. A real-wallet playthrough remains to be done. The comic is rendered as a PNG image inside the game because the sandbox blocks initiated downloads; players save it with their browser's image menu. The on-chain sprite requires the Robinhood mainnet RPC to be available.

All stage art is drawn by this project. Friend sprite art is provided by FriendSDK; no other third-party assets are used.
