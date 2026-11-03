import { beforeEach, describe, expect, it, vi } from "vitest";
import { getSession } from "@/lib/auth";
import { allowedLevels, canAccessLevel } from "@/lib/student";
import { GET as vrQuestions } from "@/app/api/vr/questions/route";
import { POST as checkout } from "@/app/api/parent/billing/checkout/route";
import { POST as portal } from "@/app/api/parent/billing/portal/route";
import { NextRequest } from "next/server";
import { insert } from "../support/fake-prisma";
import { ID, details, formRequest, signInAs } from "../support/world";

const retrieve = vi.hoisted(() => vi.fn());

vi.mock("@/lib/billing", async (original) => ({
  ...(await original<typeof import("@/lib/billing")>()),
  stripe: () => ({
    subscriptions: { retrieve },
    billingPortal: { sessions: { create: async () => ({ url: "https://stripe.test/portal" }) } },
  }),
}));

const DAY = 24 * 60 * 60 * 1000;
const STARTER_LEVELS = ["Starter", "Explorer"];

function pay(studentId: number, activeUntil: Date, paymentId = "sub_test") {
  insert("userPaymentDetails", { userProfileId: BigInt(studentId), paymentId, profileActive: activeUntil });
}

const levelsFor = async (id: number) => {
  signInAs(id);
  return allowedLevels(await getSession());
};

describe("with payments not enforced", () => {
  it("gives an unpaid home child their granted levels", async () => {
    expect(await levelsFor(ID.homeChild)).toEqual(STARTER_LEVELS);
  });
});

describe("with payments enforced", () => {
  beforeEach(() => {
    vi.stubEnv("PAYMENTS_ENFORCED", "true");
  });

  describe("a home child", () => {
    it("has no levels when never subscribed", async () => {
      expect(await levelsFor(ID.homeChild)).toEqual([]);
    });

    it("has no levels once the subscription has run out", async () => {
      pay(ID.homeChild, new Date(Date.now() - 2 * DAY));
      expect(await levelsFor(ID.homeChild)).toEqual([]);
    });

    it("is not unlocked by a payment that is not a subscription", async () => {
      pay(ID.homeChild, new Date(Date.now() + 30 * DAY), "pi_one_off");
      expect(await levelsFor(ID.homeChild)).toEqual([]);
    });

    it("is not unlocked by another child's subscription", async () => {
      pay(ID.otherHomeChild, new Date(Date.now() + 30 * DAY));
      expect(await levelsFor(ID.homeChild)).toEqual([]);
    });

    it("has their granted levels while paid up, and no others", async () => {
      pay(ID.homeChild, new Date(Date.now() + 30 * DAY));
      const levels = await levelsFor(ID.homeChild);
      expect(levels).toEqual(STARTER_LEVELS);
      expect(canAccessLevel(levels, "Master")).toBe(false);
    });

    it("is judged the same when their parent is viewing", async () => {
      expect(await levelsFor(ID.otherParent)).toEqual([]);
      pay(ID.otherHomeChild, new Date(Date.now() + 30 * DAY));
      expect(await levelsFor(ID.otherParent)).toEqual(STARTER_LEVELS);
    });
  });

  describe("a school pupil", () => {
    it("has their granted levels with no subscription", async () => {
      expect(await levelsFor(ID.oakPupil)).toEqual(STARTER_LEVELS);
    });

    it("still has only the levels granted to them", async () => {
      const levels = await levelsFor(ID.oakPupil);
      expect(canAccessLevel(levels, "Master")).toBe(false);

      details(ID.oakPupil).master = true;
      expect(await levelsFor(ID.oakPupil)).toEqual([...STARTER_LEVELS, "Master"]);
    });

    it("keeps their levels when linked to a parent and signed in at home", async () => {
      expect(await levelsFor(ID.linkedPupil)).toEqual(STARTER_LEVELS);
    });
  });

  it("closes a locked level on the question route, not just on the page", async () => {
    signInAs(ID.homeChild);
    const response = await vrQuestions(
      new NextRequest("http://test.local/api/vr/questions?level=Starter&topic=Words")
    );
    expect(response.status).toBe(403);
  });
});

describe("who is never gated by a subscription", () => {
  beforeEach(() => {
    vi.stubEnv("PAYMENTS_ENFORCED", "true");
  });

  it("opens everything to a site admin", async () => {
    expect(await levelsFor(ID.admin)).toBe("all");
    expect(canAccessLevel("all", "Master")).toBe(true);
  });
});

describe("who has no levels at all", () => {
  it("is anyone without a session, and staff", async () => {
    expect(await allowedLevels(null)).toEqual([]);
    expect(await levelsFor(ID.oakTeacher)).toEqual([]);
    expect(await levelsFor(ID.oakAdmin)).toEqual([]);
  });

  it("treats a level with no name as locked", () => {
    expect(canAccessLevel(STARTER_LEVELS, null)).toBe(false);
    expect(canAccessLevel(STARTER_LEVELS, undefined)).toBe(false);
  });
});

describe("billing", () => {
  const subscribe = (studentId: number) =>
    checkout(formRequest("/api/parent/billing/checkout", { studentId: String(studentId) }));
  const manage = (studentId: number) =>
    portal(formRequest("/api/parent/billing/portal", { studentId: String(studentId) }));
  const paidUp = () => new Date(Date.now() + 30 * DAY);

  beforeEach(() => {
    vi.stubEnv("STRIPE_SECRET_KEY", "sk_test_not_real");
    retrieve.mockReset();
    retrieve.mockResolvedValue({ customer: "cus_test" });
  });

  it("reaches the subscription check for a parent's home child", async () => {
    pay(ID.homeChild, paidUp());
    signInAs(ID.parent);
    expect((await subscribe(ID.homeChild)).headers.get("location")).toContain("billing=already");
  });

  it.each([
    ["a linked school pupil", ID.linkedPupil],
    ["another parent's child", ID.otherHomeChild],
  ])("stops checkout for %s", async (_who, studentId) => {
    pay(studentId, paidUp());
    signInAs(ID.parent);
    expect((await subscribe(studentId)).headers.get("location")).toContain("billing=error");
  });

  it("opens the billing portal for a parent's home child", async () => {
    pay(ID.homeChild, paidUp());
    signInAs(ID.parent);
    expect((await manage(ID.homeChild)).headers.get("location")).toBe("https://stripe.test/portal");
  });

  it.each([
    ["a linked school pupil", ID.linkedPupil],
    ["another parent's child", ID.otherHomeChild],
  ])("keeps the billing portal closed for %s", async (_who, studentId) => {
    pay(studentId, paidUp());
    signInAs(ID.parent);
    expect((await manage(studentId)).headers.get("location")).toContain("billing=error");
    expect(retrieve).not.toHaveBeenCalled();
  });

  it("sends anyone but a parent to the login page", async () => {
    signInAs(ID.oakTeacher);
    expect((await subscribe(ID.linkedPupil)).headers.get("location")).toContain("/login");
    expect((await manage(ID.linkedPupil)).headers.get("location")).toContain("/login");
  });
});
