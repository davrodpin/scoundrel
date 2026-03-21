import {
  getInitialDeckId,
  loadDeckPreference,
  saveDeckPreference,
} from "./deck_preference.ts";

function assert(condition: boolean, msg: string): void {
  if (!condition) throw new Error(`Assertion failed: ${msg}`);
}

function assertEquals<T>(actual: T, expected: T): void {
  if (actual !== expected) {
    throw new Error(
      `Expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`,
    );
  }
}

function createFakeStorage(): Storage {
  const store = new Map<string, string>();
  return {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => {
      store.set(key, value);
    },
    removeItem: (key: string) => {
      store.delete(key);
    },
    clear: () => store.clear(),
    get length() {
      return store.size;
    },
    key: (_index: number) => null,
  };
}

function withStorage(
  storage: Storage | "throwing",
  fn: () => void,
): void {
  const original = globalThis.localStorage;
  if (storage === "throwing") {
    Object.defineProperty(globalThis, "localStorage", {
      get() {
        throw new Error("localStorage unavailable");
      },
      configurable: true,
    });
  } else {
    Object.defineProperty(globalThis, "localStorage", {
      value: storage,
      configurable: true,
    });
  }
  try {
    fn();
  } finally {
    Object.defineProperty(globalThis, "localStorage", {
      value: original,
      configurable: true,
    });
  }
}

// loadDeckPreference

Deno.test("loadDeckPreference - returns null when localStorage is empty", () => {
  withStorage(createFakeStorage(), () => {
    assertEquals(loadDeckPreference(), null);
  });
});

Deno.test("loadDeckPreference - returns stored deck ID when set", () => {
  const storage = createFakeStorage();
  storage.setItem("scoundrel:selectedDeckId", "8bit");
  withStorage(storage, () => {
    assertEquals(loadDeckPreference(), "8bit");
  });
});

Deno.test("loadDeckPreference - returns null when localStorage throws", () => {
  withStorage("throwing", () => {
    assertEquals(loadDeckPreference(), null);
  });
});

// saveDeckPreference

Deno.test("saveDeckPreference - stores deck ID in localStorage", () => {
  const storage = createFakeStorage();
  withStorage(storage, () => {
    saveDeckPreference("8bit");
    assertEquals(storage.getItem("scoundrel:selectedDeckId"), "8bit");
  });
});

Deno.test("saveDeckPreference - does not throw when localStorage is unavailable", () => {
  withStorage("throwing", () => {
    saveDeckPreference("8bit");
  });
});

// getInitialDeckId

Deno.test("getInitialDeckId - returns stored ID when it exists in available decks", () => {
  const storage = createFakeStorage();
  storage.setItem("scoundrel:selectedDeckId", "8bit");
  withStorage(storage, () => {
    assertEquals(
      getInitialDeckId(["dungeon", "8bit"], "dungeon"),
      "8bit",
    );
  });
});

Deno.test("getInitialDeckId - returns defaultDeck when stored ID is not in available decks", () => {
  const storage = createFakeStorage();
  storage.setItem("scoundrel:selectedDeckId", "removed-deck");
  withStorage(storage, () => {
    assertEquals(
      getInitialDeckId(["dungeon", "8bit"], "dungeon"),
      "dungeon",
    );
  });
});

Deno.test("getInitialDeckId - returns defaultDeck when no stored preference", () => {
  withStorage(createFakeStorage(), () => {
    assertEquals(
      getInitialDeckId(["dungeon", "8bit"], "dungeon"),
      "dungeon",
    );
  });
});
