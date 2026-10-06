package ee.kukirin.tuner;
import org.junit.Test;
import static org.junit.Assert.*;
public class RewardSessionTest {
 @Test public void completionAndCloseAreOnceOnly(){RewardSession r=new RewardSession();assertTrue(r.complete());assertFalse(r.complete());assertTrue(r.end());assertFalse(r.end());assertTrue(r.earned());}
 @Test public void earlyCloseNeverRewards(){RewardSession r=new RewardSession();assertTrue(r.end());assertFalse(r.earned());assertFalse(r.complete());}
 @Test public void separateRequestsDoNotShareRewards(){RewardSession a=new RewardSession(),b=new RewardSession();a.complete();a.end();assertTrue(a.earned());assertFalse(b.earned());}
}
