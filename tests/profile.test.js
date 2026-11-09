import { describe, expect, it } from "vitest";
import { fromProfileDraft, toProfileDraft, validateProfile } from "../src/lib/profile.js";

describe("profile drafts", () => {
  const user = { name: "Joel", bodyweight: 78, height: 180, age: 20 };

  it("round-trips through the form in kilograms", () => {
    const draft = toProfileDraft(user, "kg");
    expect(draft).toMatchObject({ name: "Joel", bodyweight: "78", heightCm: "180", age: "20" });
    expect(fromProfileDraft(draft, "kg")).toEqual({ name: "Joel", bodyweight: 78, height: 180, age: 20 });
  });

  it("shows pounds and feet without changing what's stored", () => {
    const draft = toProfileDraft(user, "lb");
    expect(draft.bodyweight).toBe("172");
    expect([draft.heightFt, draft.heightIn]).toEqual(["5", "11"]);
    const back = fromProfileDraft(draft, "lb");
    expect(back.bodyweight).toBeCloseTo(78, 0);
    expect(back.height).toBeCloseTo(180.3, 1);
  });

  it("stores blanks as not given, never as zero", () => {
    const draft = { name: " Sam ", bodyweight: "", heightCm: "", heightFt: "", heightIn: "", age: "" };
    expect(fromProfileDraft(draft, "kg")).toEqual({ name: "Sam", bodyweight: null, height: null, age: null });
    expect(validateProfile(draft, "kg")).toEqual({});
  });

  it("catches typos but allows any real body", () => {
    const draft = { name: "", bodyweight: "780", heightCm: "18", heightFt: "", heightIn: "", age: "9" };
    expect(Object.keys(validateProfile(draft, "kg")).sort()).toEqual(["age", "bodyweight", "height", "name"]);
    expect(validateProfile({ ...draft, name: "" }, "kg", { requireName: false }).name).toBeUndefined();
  });
});
