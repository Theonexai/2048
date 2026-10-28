window.fakeStorage = {
  _data: {},

  setItem: function (id, val) {
    this._data[id] = String(val);
  },

  getItem: function (id) {
    return Object.prototype.hasOwnProperty.call(this._data, id) ?
      this._data[id] : null;
  },

  removeItem: function (id) {
    delete this._data[id];
  }
};

function LocalStorageManager() {
  this.bestScoreKey = "hopmint2048:v1:bestScore";
  this.gameStateKey = "hopmint2048:v1:gameState";
  this.legacyBestScoreKey = "bestScore";
  this.legacyGameStateKey = "gameState";
  this.storage = this.getStorage();
}

LocalStorageManager.prototype.getStorage = function () {
  var storage;
  var testKey = "hopmint2048:storage-test";

  try {
    storage = window.localStorage;
    storage.setItem(testKey, "1");
    storage.removeItem(testKey);
    return storage;
  } catch (error) {
    return window.fakeStorage;
  }
};

LocalStorageManager.prototype.read = function (key) {
  try {
    return this.storage.getItem(key);
  } catch (error) {
    return null;
  }
};

LocalStorageManager.prototype.write = function (key, value) {
  try {
    this.storage.setItem(key, value);
    return true;
  } catch (error) {
    this.useFallbackStorage();
    try {
      this.storage.setItem(key, value);
      return true;
    } catch (fallbackError) {
      return false;
    }
  }
};

LocalStorageManager.prototype.useFallbackStorage = function () {
  var previousStorage = this.storage;
  var keys = [this.bestScoreKey, this.gameStateKey,
    this.legacyBestScoreKey, this.legacyGameStateKey];
  var i, value;

  if (previousStorage === window.fakeStorage) return;
  this.storage = window.fakeStorage;
  for (i = 0; i < keys.length; i++) {
    try {
      value = previousStorage.getItem(keys[i]);
      if (value !== null) this.storage.setItem(keys[i], value);
    } catch (error) {
      // Keep using the in-memory store even if the browser store has failed.
    }
  }
};

LocalStorageManager.prototype.remove = function (key) {
  try {
    this.storage.removeItem(key);
  } catch (error) {
    this.useFallbackStorage();
    this.storage.removeItem(key);
  }
};

LocalStorageManager.prototype.getBestScore = function () {
  var storedScore = this.read(this.bestScoreKey);
  var score = Number(storedScore);
  var legacyScore;

  if (storedScore === null || !isFinite(score) || score < 0) {
    legacyScore = Number(this.read(this.legacyBestScoreKey));
    score = isFinite(legacyScore) && legacyScore > 0 ? legacyScore : 0;
    this.write(this.bestScoreKey, score);
  }

  return score;
};

LocalStorageManager.prototype.setBestScore = function (score) {
  this.write(this.bestScoreKey, String(score));
};

LocalStorageManager.prototype.isValidGameState = function (state) {
  var x, y, tile;

  if (!state || !state.grid || state.grid.size !== 4 ||
      !Array.isArray(state.grid.cells) || state.grid.cells.length !== 4 ||
      !isFinite(Number(state.score)) || Number(state.score) < 0) {
    return false;
  }

  for (x = 0; x < 4; x++) {
    if (!Array.isArray(state.grid.cells[x]) ||
        state.grid.cells[x].length !== 4) {
      return false;
    }
    for (y = 0; y < 4; y++) {
      tile = state.grid.cells[x][y];
      if (tile && (typeof tile.value !== "number" || tile.value < 2 ||
          !isFinite(tile.value) || Math.log(tile.value) / Math.LN2 % 1 !== 0 ||
          !tile.position ||
          tile.position.x !== x || tile.position.y !== y)) {
        return false;
      }
    }
  }

  return true;
};

LocalStorageManager.prototype.getGameState = function () {
  var stateJSON = this.read(this.gameStateKey);
  var legacy = false;
  var state = null;
  var tileCount = 0;
  var x, y;

  if (stateJSON) {
    try {
      state = JSON.parse(stateJSON);
    } catch (error) {
      this.remove(this.gameStateKey);
    }
    if (state && !this.isValidGameState(state)) {
      state = null;
      this.remove(this.gameStateKey);
    }
  }

  if (!state) {
    stateJSON = this.read(this.legacyGameStateKey);
    legacy = !!stateJSON;
    if (!stateJSON) return null;
    try {
      state = JSON.parse(stateJSON);
    } catch (error) {
      return null;
    }
    if (!this.isValidGameState(state)) return null;
  }

  if (typeof state.hasMoved !== "boolean") {
    for (x = 0; x < 4; x++) {
      for (y = 0; y < 4; y++) {
        if (state.grid.cells[x][y]) tileCount++;
      }
    }
    state.hasMoved = Number(state.score) > 0 || tileCount > 2;
  }

  if (legacy) this.write(this.gameStateKey, JSON.stringify(state));

  return state;
};

LocalStorageManager.prototype.setGameState = function (gameState) {
  this.write(this.gameStateKey, JSON.stringify(gameState));
};

LocalStorageManager.prototype.clearGameState = function () {
  this.remove(this.gameStateKey);
};
