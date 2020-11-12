package me.vinceh121.gmcserver.managers;

import java.util.Date;

import io.vertx.core.Promise;
import me.vinceh121.gmcserver.GMCServer;
import me.vinceh121.gmcserver.actions.AbstractAction;
import me.vinceh121.gmcserver.entities.Device;
import me.vinceh121.gmcserver.entities.DeviceStats;
import me.vinceh121.gmcserver.entities.Record;
import me.vinceh121.gmcserver.entities.User;
import me.vinceh121.gmcserver.managers.email.Email;
import me.vinceh121.gmcserver.managers.email.EmailManager;

public class AlertManager extends AbstractManager {
	public static final long ALERT_EMAIL_DELAY = 24 * 60 * 60 * 1000; // 1 day

	public AlertManager(final GMCServer srv) {
		super(srv);
	}

	public CheckAlertAction checkAlert() {
		return new CheckAlertAction(this.srv);
	}

	public class CheckAlertAction extends AbstractAction<Boolean> {
		private Device dev;
		private User owner;
		private Record latestRecord;

		public CheckAlertAction(final GMCServer srv) {
			super(srv);
		}

		@Override
		protected void executeSync(final Promise<Boolean> promise) {
			if (new Date().getTime() - this.dev.getLastEmailAlert().getTime() < AlertManager.ALERT_EMAIL_DELAY) {
				promise.complete(false);
				return;
			}
			this.srv.getManager(DeviceManager.class)
					.deviceStats()
					.setField("cpm")
					.setDevId(this.dev.getId())
					.execute()
					.onComplete(statsRes -> {
						if (statsRes.failed()) {
							AlertManager.this.log.error("Failed to get stats for device {}", this.dev);
							promise.fail("Failed to get stats");
							return;
						}
						final DeviceStats stats = statsRes.result();

						final double upperBound = stats.getAvg() + stats.getStdDev();
						// final double lowerBound = stats.getAvg() - stats.getStdDev();

						if (this.latestRecord.getCpm() > upperBound) { // too high
							final Email email = new Email();
							email.setTo(this.owner);
							email.setTemplate("device-alert");
							email.setSubject("[ " + this.dev.getName() + " ] Abnormal CPM readings for device");
							email.getContext().put("fieldname", "CPM");
							email.getContext().put("value", this.latestRecord.getCpm());
							email.getContext().put("device", this.dev.toPublicJson());
							this.srv.getManager(EmailManager.class).sendEmail(email);
						}
						// else if (this.latestRecord.getCpm()< lowerBound) {} // too low

					});
		}

		public Device getDev() {
			return this.dev;
		}

		public CheckAlertAction setDev(final Device dev) {
			this.dev = dev;
			return this;
		}

		public User getOwner() {
			return this.owner;
		}

		public CheckAlertAction setOwner(final User owner) {
			this.owner = owner;
			return this;
		}

		public Record getLatestRecord() {
			return this.latestRecord;
		}

		public CheckAlertAction setLatestRecord(final Record latestRecord) {
			this.latestRecord = latestRecord;
			return this;
		}
	}
}
