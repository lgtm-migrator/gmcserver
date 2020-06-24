import { Component, OnInit } from '@angular/core';
import { RequestService } from '../request.service';
import { HttpErrorResponse } from '@angular/common/http';
import { catchError } from 'rxjs/operators';
import { throwError } from 'rxjs';
/*import { NgForm } from '@angular/forms';*/

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit {
  username: string;
  password: string;
  progress: boolean = false;
  errorMsg: string;

  constructor(private req: RequestService) { }

  ngOnInit(): void {
  }

  executeLogin(): void {
    this.errorMsg = null;
    if (this.username != null && this.password != null
      && this.username.length != 0 && this.password.length != 0)
      this.req.login(this.username, this.password)
        .subscribe(
          res => {
            this.req.setLoginInfo(res.id, res.token);
          },
          err => {
            if (err.error instanceof ErrorEvent) {
              this.errorMsg = err.error.error;
            } else {
              this.errorMsg = err.status + ': ' + err.error.description;
            }
          }
        )
  }
}
