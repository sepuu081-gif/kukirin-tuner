package ee.kukirin.tuner;

/** Terminal ad callbacks are once-only; dismissal is not a reward. */
final class RewardSession {
    private boolean completed;
    private boolean ended;
    synchronized boolean complete() {
        if (ended || completed) return false;
        completed = true;
        return true;
    }
    synchronized boolean end() {
        if (ended) return false;
        ended = true;
        return true;
    }
    synchronized boolean earned() { return completed; }
}
