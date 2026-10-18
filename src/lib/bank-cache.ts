/**
 * Cache settings for the question-bank listings (which levels and topics
 * exist) on the Maths, Verbal and Non-Verbal pickers.
 *
 * Those lists only change when questions are loaded, which happens through SQL
 * scripts rather than the app, so every page view was recounting the same
 * numbers. They are now held for an hour: a newly loaded bank shows up within
 * that, or at once after `revalidateTag(BANK_TAG, "max")` or a restart.
 *
 * English is not cached here - an admin approving a comprehension should see
 * it go live immediately.
 */
export const BANK_TAG = "question-bank";

export const BANK_CACHE = { tags: [BANK_TAG], revalidate: 3600 };
