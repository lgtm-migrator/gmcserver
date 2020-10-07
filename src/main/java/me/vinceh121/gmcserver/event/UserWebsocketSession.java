package me.vinceh121.gmcserver.event;

import io.vertx.core.http.ServerWebSocket;
import me.vinceh121.gmcserver.entities.User;

public class UserWebsocketSession {
	private final User user;
	private final ServerWebSocket socket;

	public UserWebsocketSession(final User user, final ServerWebSocket socket) {
		this.user = user;
		this.socket = socket;
	}

	public User getUser() {
		return this.user;
	}

	public ServerWebSocket getSocket() {
		return this.socket;
	}

}
