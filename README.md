# HopMint Games 2048

A mobile-friendly HopMint Games adaptation of the open-source 2048 puzzle. The original game was created by Gabriele Cirulli, based on 1024 by Veewo Studio, and was conceptually inspired by Threes by Asher Vollmer. This adaptation keeps the standard 2048 rules and includes the upstream attribution and MIT license in [LICENSE.txt](LICENSE.txt).

## Play locally

From this folder, start a small local web server:

```sh
python -m http.server 8000
```

Then open `http://localhost:8000` in a browser. The game has no build step or third-party runtime dependencies.

Use arrow keys or swipe to move. Progress and best score are saved in browser storage when it is available. Existing progress under the original `gameState` and `bestScore` storage keys is migrated to HopMint's namespaced keys when it can be read safely.

## Upstream contributions

The upstream project credits Anna Harren and sigod as maintainers, and recognizes TimPetricola for best-score storage, chrisprice for mobile swipe handling, marcingajda for Windows Phone swipe support, mgarciaisaia for Android support, and many additional contributors. Their work remains covered by the copyright and license notice in [LICENSE.txt](LICENSE.txt).
