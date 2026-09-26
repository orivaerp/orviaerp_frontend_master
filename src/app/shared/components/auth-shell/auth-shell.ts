import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-auth-shell',
  templateUrl: './auth-shell.html',
})
export class AuthShell {
  @Input() title = '';
  @Input() subtitle = '';
  readonly year = new Date().getFullYear();
}
