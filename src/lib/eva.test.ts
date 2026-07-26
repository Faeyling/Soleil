import { describe, expect, it } from "vitest";
import { severiteDepuisEva } from "./eva";

describe("severiteDepuisEva", () => {
  it("mappe 0-2 sur bas", () => {
    expect(severiteDepuisEva(0)).toBe("bas");
    expect(severiteDepuisEva(2)).toBe("bas");
  });

  it("mappe 3-5 sur moyen", () => {
    expect(severiteDepuisEva(3)).toBe("moyen");
    expect(severiteDepuisEva(5)).toBe("moyen");
  });

  it("mappe 6-7 sur haut", () => {
    expect(severiteDepuisEva(6)).toBe("haut");
    expect(severiteDepuisEva(7)).toBe("haut");
  });

  it("mappe 8-10 sur crise", () => {
    expect(severiteDepuisEva(8)).toBe("crise");
    expect(severiteDepuisEva(10)).toBe("crise");
  });
});
