import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Device, Record, MapDevice, Intent, User, InstanceInfo } from './types';
import { DRIVERS, Locker } from 'angular-safeguard';
import { environment } from '../environments/environment';

export interface LoginRequest {
	id: string;
	token: string;
	mfa?: boolean;
}

@Injectable({
	providedIn: 'root'
})
export class RequestService {
	/*host = '127.0.0.1:80';*/
	host = environment.production ? window.location.host : 'localhost:80';
	baseUrl: string = '//' + this.host + '/api/v1/';
	/*baseUrl = '/api/v1/';*/
	websocketUrl: string = 'ws://' + this.host + '/api/v1/ws';
	headers: HttpHeaders = new HttpHeaders();
	websocket: WebSocket;
	websocketObs: Observable<Intent>;

	constructor(private http: HttpClient, private locker: Locker) {
		this.updateHeaders();
	}

	public updateHeaders(): void {
		const tok = this.getToken();
		this.headers = this.headers.set('Authorization', tok);
	}

	public login(username: string, password: string): Observable<LoginRequest> {
		const obs: Observable<LoginRequest> = this.http.post<LoginRequest>(this.getPath('auth/login'),
			{ username, password }, { headers: this.headers });
		return obs;
	}

	public submitMfa(code: number): Observable<LoginRequest> {
		const obs: Observable<LoginRequest> = this.http.post<LoginRequest>(this.getPath('auth/mfa'), { pass: code },
			{ headers: this.headers });
		return obs;
	}

	public setLoginInfo(id: string, token: string): void {
		this.locker.set(DRIVERS.LOCAL, 'user-id', id);
		this.locker.set(DRIVERS.LOCAL, 'token', token);
		this.updateHeaders();
	}

	public logout() {
		this.locker.clear(DRIVERS.LOCAL);
	}

	public connectWebsocket() {
		this.websocket = new WebSocket(this.websocketUrl, this.getToken());
		this.websocketObs = new Observable<Intent>(sub => {
			this.websocket.onmessage = (evt) => sub.next(JSON.parse(evt.data));
			this.websocket.onerror = (evt) => sub.error(evt);
			this.websocket.onclose = () => sub.complete();
		});
	}

	public getWebsocketObservable(): Observable<Intent> {
		return this.websocketObs;
	}

	public getUserId(): string {
		return this.locker.get(DRIVERS.LOCAL, 'user-id');
	}

	public getToken(): string {
		return this.locker.get(DRIVERS.LOCAL, 'token');
	}

	public checkAuth(): boolean {
		const token = this.getToken();
		return token != null && !token.startsWith('mfa.');
	}

	public getUser(id: string): Observable<User> {
		return this.get<User>('user/' + id);
	}

	public getDevice(id: string): Observable<Device> {
		return this.get<Device>('device/' + id);
	}

	public getDeviceTimeline(id: string, full: boolean, start: Date, end: Date): Observable<Record[]> {
		let params: HttpParams = new HttpParams({});
		if (full) {
			params = params.append('full', 'y');
		}
		if (start) {
			params = params.append('start', String(start.getTime()));
		}
		if (end) {
			params = params.append('end', String(end.getTime()));
		}
		return this.get<Record[]>('device/' + id + '/timeline', params);
	}

	public updateDevice(id: string, update: any): Observable<any> {
		return this.put('device/' + id, update);
	}

	public getMap(rect: number[]): Observable<MapDevice[]> {
		return this.get<MapDevice[]>('map/' + JSON.stringify(rect));
	}

	public getInstanceInfo(): Observable<InstanceInfo> {
		return this.get<InstanceInfo>('instance/info');
	}

	public getPath(path: string): string {
		return this.baseUrl + path;
	}

	private get<T>(path: string, params?: HttpParams): Observable<T> {
		return this.http.get<T>(this.getPath(path), { headers: this.headers, params });
	}

	private put<T>(path: string, body: any): Observable<T> {
		return this.http.put<T>(this.getPath(path), body, { headers: this.headers });
	}
}
